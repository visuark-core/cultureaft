import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ConnectionMetrics {
  endpoint: string;
  responseTime: number;
  status: number;
  timestamp: string;
  success: boolean;
  retryCount?: number;
}

export interface OptimizationConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheTimeout: number;
  connectionPoolSize: number;
}

class ConnectionOptimizationService {
  private axiosInstance: AxiosInstance;
  private requestCache = new Map<string, { data: any; timestamp: number }>();
  private connectionMetrics: ConnectionMetrics[] = [];
  private readonly maxMetricsHistory = 1000;
  
  private readonly defaultConfig: OptimizationConfig = {
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    cacheTimeout: 300000, // 5 minutes
    connectionPoolSize: 10
  };

  constructor(config: Partial<OptimizationConfig> = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    this.axiosInstance = axios.create({
      timeout: finalConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
    this.setupConnectionPooling();
  }

  /**
   * Setup request and response interceptors for optimization
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add request timestamp for metrics
        (config as any).metadata = { startTime: Date.now() };
        
        // Add cache headers for GET requests
        if (config.method === 'get') {
          config.headers['Cache-Control'] = 'max-age=300';
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.recordMetrics(response);
        return response;
      },
      (error) => {
        this.recordMetrics(error.response, error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup connection pooling and keep-alive
   */
  private setupConnectionPooling(): void {
    // Configure axios defaults for connection reuse
    // Connection pooling is handled by the browser in web environments
    // This would be implemented differently in Node.js environments
  }

  /**
   * Record connection metrics
   */
  private recordMetrics(response?: AxiosResponse, error?: any): void {
    if (!response && !error) return;

    const config = response?.config || error?.config;
    if (!(config as any)?.metadata?.startTime) return;

    const responseTime = Date.now() - (config as any).metadata.startTime;
    const endpoint = `${config.method?.toUpperCase()} ${config.url}`;
    
    const metric: ConnectionMetrics = {
      endpoint,
      responseTime,
      status: response?.status || error?.response?.status || 0,
      timestamp: new Date().toISOString(),
      success: !!response && response.status >= 200 && response.status < 300,
      retryCount: (config as any).metadata.retryCount || 0
    };

    this.connectionMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.connectionMetrics.length > this.maxMetricsHistory) {
      this.connectionMetrics = this.connectionMetrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Optimized GET request with caching
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const cacheKey = `GET:${url}:${JSON.stringify(config?.params || {})}`;
    
    // Check cache first
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.defaultConfig.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await this.retryRequest(() => 
        this.axiosInstance.get<T>(url, config)
      );
      
      // Cache successful responses
      this.requestCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      
      return response.data;
    } catch (error) {
      // Remove from cache on error
      this.requestCache.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Optimized POST request with retry logic
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.retryRequest(() => 
      this.axiosInstance.post<T>(url, data, config)
    );
    return response.data;
  }

  /**
   * Optimized PUT request with retry logic
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.retryRequest(() => 
      this.axiosInstance.put<T>(url, data, config)
    );
    return response.data;
  }

  /**
   * Optimized DELETE request with retry logic
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.retryRequest(() => 
      this.axiosInstance.delete<T>(url, config)
    );
    return response.data;
  }

  /**
   * Retry logic for failed requests
   */
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    attempt: number = 1
  ): Promise<AxiosResponse<T>> {
    try {
      const response = await requestFn();
      return response;
    } catch (error: any) {
      if (attempt < this.defaultConfig.retryAttempts && this.shouldRetry(error)) {
        // Add retry count to config for metrics
        if (error.config) {
          (error.config as any).metadata = (error.config as any).metadata || {};
          (error.config as any).metadata.retryCount = attempt;
        }
        
        await this.delay(this.defaultConfig.retryDelay * attempt);
        return this.retryRequest(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any): boolean {
    if (!error.response) {
      // Network errors should be retried
      return true;
    }
    
    const status = error.response.status;
    // Retry on server errors (5xx) and some client errors
    return status >= 500 || status === 408 || status === 429;
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear request cache
   */
  clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * Get connection metrics
   */
  getMetrics(): ConnectionMetrics[] {
    return [...this.connectionMetrics];
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    averageResponseTime: number;
    successRate: number;
    totalRequests: number;
    slowestEndpoints: { endpoint: string; avgTime: number }[];
  } {
    if (this.connectionMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        successRate: 0,
        totalRequests: 0,
        slowestEndpoints: []
      };
    }

    const totalRequests = this.connectionMetrics.length;
    const successfulRequests = this.connectionMetrics.filter(m => m.success).length;
    const averageResponseTime = this.connectionMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const successRate = (successfulRequests / totalRequests) * 100;

    // Calculate slowest endpoints
    const endpointStats = new Map<string, { total: number; count: number }>();
    this.connectionMetrics.forEach(metric => {
      const existing = endpointStats.get(metric.endpoint) || { total: 0, count: 0 };
      endpointStats.set(metric.endpoint, {
        total: existing.total + metric.responseTime,
        count: existing.count + 1
      });
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgTime: stats.total / stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    return {
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      totalRequests,
      slowestEndpoints
    };
  }

  /**
   * Preload critical endpoints
   */
  async preloadCriticalEndpoints(): Promise<void> {
    const criticalEndpoints = [
      '/api/health',
      '/api/profile/me',
      '/api/orders/recent'
    ];

    const preloadPromises = criticalEndpoints.map(endpoint => 
      this.get(endpoint).catch(() => {
        // Ignore errors during preload
      })
    );

    await Promise.allSettled(preloadPromises);
  }
}

export const connectionOptimizationService = new ConnectionOptimizationService();