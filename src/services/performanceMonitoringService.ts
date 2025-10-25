export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  category: 'navigation' | 'resource' | 'paint' | 'interaction' | 'custom';
  details?: any;
}

export interface PerformanceReport {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  resourceLoadTimes: { name: string; duration: number }[];
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  timestamp: string;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private observer: PerformanceObserver | null = null;
  private isMonitoring = false;

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') {
      return;
    }

    this.isMonitoring = true;

    // Monitor navigation timing
    this.monitorNavigationTiming();

    // Monitor resource timing
    this.monitorResourceTiming();

    // Monitor paint timing
    this.monitorPaintTiming();

    // Monitor layout shifts
    this.monitorLayoutShifts();

    // Monitor first input delay
    this.monitorFirstInputDelay();

    // Monitor largest contentful paint
    this.monitorLargestContentfulPaint();

    // Monitor memory usage
    this.monitorMemoryUsage();

    console.log('🔍 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    console.log('🔍 Performance monitoring stopped');
  }

  /**
   * Monitor navigation timing
   */
  private monitorNavigationTiming(): void {
    if (!('performance' in window) || !('getEntriesByType' in performance)) {
      return;
    }

    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    
    navigationEntries.forEach(entry => {
      this.addMetric({
        name: 'Page Load Time',
        value: entry.loadEventEnd - entry.fetchStart,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        category: 'navigation',
        details: {
          domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
          domComplete: entry.domComplete - entry.fetchStart,
          loadComplete: entry.loadEventEnd - entry.fetchStart
        }
      });

      this.addMetric({
        name: 'DNS Lookup Time',
        value: entry.domainLookupEnd - entry.domainLookupStart,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        category: 'navigation'
      });

      this.addMetric({
        name: 'TCP Connection Time',
        value: entry.connectEnd - entry.connectStart,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        category: 'navigation'
      });

      this.addMetric({
        name: 'Server Response Time',
        value: entry.responseEnd - entry.requestStart,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        category: 'navigation'
      });
    });
  }

  /**
   * Monitor resource timing
   */
  private monitorResourceTiming(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            this.addMetric({
              name: 'Resource Load Time',
              value: resourceEntry.duration,
              unit: 'ms',
              timestamp: new Date().toISOString(),
              category: 'resource',
              details: {
                name: resourceEntry.name,
                type: this.getResourceType(resourceEntry.name),
                size: resourceEntry.transferSize || 0
              }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observer = observer;
    } catch (error) {
      console.warn('Resource timing monitoring not supported:', error);
    }
  }

  /**
   * Monitor paint timing
   */
  private monitorPaintTiming(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'paint') {
            this.addMetric({
              name: entry.name === 'first-paint' ? 'First Paint' : 'First Contentful Paint',
              value: entry.startTime,
              unit: 'ms',
              timestamp: new Date().toISOString(),
              category: 'paint'
            });
          }
        });
      });

      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('Paint timing monitoring not supported:', error);
    }
  }

  /**
   * Monitor layout shifts
   */
  private monitorLayoutShifts(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      let cumulativeLayoutShift = 0;

      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            cumulativeLayoutShift += entry.value;
            
            this.addMetric({
              name: 'Cumulative Layout Shift',
              value: cumulativeLayoutShift,
              unit: 'score',
              timestamp: new Date().toISOString(),
              category: 'interaction',
              details: {
                shiftValue: entry.value,
                sources: entry.sources?.map((source: any) => source.node?.tagName) || []
              }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Layout shift monitoring not supported:', error);
    }
  }

  /**
   * Monitor first input delay
   */
  private monitorFirstInputDelay(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.entryType === 'first-input') {
            this.addMetric({
              name: 'First Input Delay',
              value: entry.processingStart - entry.startTime,
              unit: 'ms',
              timestamp: new Date().toISOString(),
              category: 'interaction',
              details: {
                inputType: entry.name,
                startTime: entry.startTime
              }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('First input delay monitoring not supported:', error);
    }
  }

  /**
   * Monitor largest contentful paint
   */
  private monitorLargestContentfulPaint(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.entryType === 'largest-contentful-paint') {
            this.addMetric({
              name: 'Largest Contentful Paint',
              value: entry.startTime,
              unit: 'ms',
              timestamp: new Date().toISOString(),
              category: 'paint',
              details: {
                element: entry.element?.tagName || 'unknown',
                size: entry.size || 0
              }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('Largest contentful paint monitoring not supported:', error);
    }
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    if (!('memory' in performance)) {
      return;
    }

    const checkMemory = () => {
      const memory = (performance as any).memory;
      
      this.addMetric({
        name: 'Memory Usage',
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        timestamp: new Date().toISOString(),
        category: 'custom',
        details: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        }
      });
    };

    // Check memory usage every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  /**
   * Add a custom performance metric
   */
  addCustomMetric(name: string, value: number, unit: string, details?: any): void {
    this.addMetric({
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      category: 'custom',
      details
    });
  }

  /**
   * Add metric to collection
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep metrics collection manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const navigationMetrics = this.metrics.filter(m => m.category === 'navigation');
    const paintMetrics = this.metrics.filter(m => m.category === 'paint');
    const interactionMetrics = this.metrics.filter(m => m.category === 'interaction');
    const resourceMetrics = this.metrics.filter(m => m.category === 'resource');
    const memoryMetrics = this.metrics.filter(m => m.name === 'Memory Usage');

    const report: PerformanceReport = {
      pageLoadTime: this.getLatestMetricValue(navigationMetrics, 'Page Load Time') || 0,
      firstContentfulPaint: this.getLatestMetricValue(paintMetrics, 'First Contentful Paint') || 0,
      largestContentfulPaint: this.getLatestMetricValue(paintMetrics, 'Largest Contentful Paint') || 0,
      firstInputDelay: this.getLatestMetricValue(interactionMetrics, 'First Input Delay') || 0,
      cumulativeLayoutShift: this.getLatestMetricValue(interactionMetrics, 'Cumulative Layout Shift') || 0,
      timeToInteractive: this.calculateTimeToInteractive(),
      resourceLoadTimes: resourceMetrics.map(m => ({
        name: m.details?.name || 'unknown',
        duration: m.value
      })),
      timestamp: new Date().toISOString()
    };

    // Add memory usage if available
    const latestMemory = memoryMetrics[memoryMetrics.length - 1];
    if (latestMemory?.details) {
      report.memoryUsage = {
        usedJSHeapSize: latestMemory.details.usedJSHeapSize,
        totalJSHeapSize: latestMemory.details.totalJSHeapSize,
        jsHeapSizeLimit: latestMemory.details.jsHeapSizeLimit
      };
    }

    return report;
  }

  /**
   * Get latest metric value by name
   */
  private getLatestMetricValue(metrics: PerformanceMetric[], name: string): number | null {
    const metric = metrics.filter(m => m.name === name).pop();
    return metric ? metric.value : null;
  }

  /**
   * Calculate time to interactive (simplified)
   */
  private calculateTimeToInteractive(): number {
    const navigationMetrics = this.metrics.filter(m => m.category === 'navigation');
    const domComplete = navigationMetrics.find(m => m.details?.domComplete);
    return domComplete?.details?.domComplete || 0;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(m => m.category === category);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const report = this.generateReport();
    let score = 100;

    // Deduct points based on performance metrics
    if (report.pageLoadTime > 3000) score -= 20;
    if (report.firstContentfulPaint > 1800) score -= 15;
    if (report.largestContentfulPaint > 2500) score -= 15;
    if (report.firstInputDelay > 100) score -= 20;
    if (report.cumulativeLayoutShift > 0.1) score -= 15;

    // Memory usage penalty
    if (report.memoryUsage) {
      const memoryUsagePercent = (report.memoryUsage.usedJSHeapSize / report.memoryUsage.jsHeapSizeLimit) * 100;
      if (memoryUsagePercent > 80) score -= 15;
    }

    return Math.max(0, score);
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();