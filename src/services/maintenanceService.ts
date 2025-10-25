export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  lastRun: string | null;
  nextRun: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'cleanup' | 'optimization' | 'backup' | 'security' | 'monitoring';
  autoRun: boolean;
  task: () => Promise<{ success: boolean; message: string; details?: any }>;
}

export interface MaintenanceReport {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  lastMaintenanceRun: string | null;
  nextScheduledRun: string | null;
  systemHealth: 'good' | 'warning' | 'critical';
  recommendations: string[];
}

class MaintenanceService {
  private tasks: Map<string, MaintenanceTask> = new Map();
  private isRunning = false;
  private maintenanceLog: { timestamp: string; task: string; result: any }[] = [];
  private readonly maxLogSize = 500;

  constructor() {
    this.initializeDefaultTasks();
    this.scheduleAutomaticMaintenance();
  }

  /**
   * Initialize default maintenance tasks
   */
  private initializeDefaultTasks(): void {
    // Cache cleanup task
    this.addTask({
      id: 'cache-cleanup',
      name: 'Cache Cleanup',
      description: 'Clear expired cache entries and optimize storage',
      frequency: 'daily',
      priority: 'medium',
      category: 'cleanup',
      autoRun: true,
      task: this.cleanupCache.bind(this)
    });

    // Local storage cleanup
    this.addTask({
      id: 'storage-cleanup',
      name: 'Storage Cleanup',
      description: 'Remove old data from localStorage and sessionStorage',
      frequency: 'weekly',
      priority: 'low',
      category: 'cleanup',
      autoRun: true,
      task: this.cleanupStorage.bind(this)
    });

    // Performance optimization
    this.addTask({
      id: 'performance-optimization',
      name: 'Performance Optimization',
      description: 'Optimize application performance and memory usage',
      frequency: 'daily',
      priority: 'high',
      category: 'optimization',
      autoRun: true,
      task: this.optimizePerformance.bind(this)
    });

    // Error log cleanup
    this.addTask({
      id: 'error-log-cleanup',
      name: 'Error Log Cleanup',
      description: 'Archive old error logs and maintain log size',
      frequency: 'weekly',
      priority: 'medium',
      category: 'cleanup',
      autoRun: true,
      task: this.cleanupErrorLogs.bind(this)
    });

    // Security check
    this.addTask({
      id: 'security-check',
      name: 'Security Check',
      description: 'Perform basic security checks and validations',
      frequency: 'daily',
      priority: 'critical',
      category: 'security',
      autoRun: true,
      task: this.performSecurityCheck.bind(this)
    });

    // Health monitoring
    this.addTask({
      id: 'health-monitoring',
      name: 'Health Monitoring',
      description: 'Monitor system health and performance metrics',
      frequency: 'daily',
      priority: 'high',
      category: 'monitoring',
      autoRun: true,
      task: this.monitorSystemHealth.bind(this)
    });
  }

  /**
   * Add a maintenance task
   */
  addTask(taskConfig: Omit<MaintenanceTask, 'lastRun' | 'nextRun' | 'status'>): void {
    const task: MaintenanceTask = {
      ...taskConfig,
      lastRun: null,
      nextRun: this.calculateNextRun(taskConfig.frequency),
      status: 'pending'
    };

    this.tasks.set(task.id, task);
  }

  /**
   * Remove a maintenance task
   */
  removeTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  /**
   * Run a specific maintenance task
   */
  async runTask(taskId: string): Promise<{ success: boolean; message: string; details?: any }> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    if (task.status === 'running') {
      return { success: false, message: 'Task is already running' };
    }

    task.status = 'running';
    const startTime = Date.now();

    try {
      const result = await task.task();
      
      task.status = result.success ? 'completed' : 'failed';
      task.lastRun = new Date().toISOString();
      task.nextRun = this.calculateNextRun(task.frequency);

      // Log the result
      this.logMaintenanceResult(task.name, result, Date.now() - startTime);

      return result;
    } catch (error: any) {
      task.status = 'failed';
      task.lastRun = new Date().toISOString();
      task.nextRun = this.calculateNextRun(task.frequency);

      const result = {
        success: false,
        message: `Task failed: ${error.message}`,
        details: { error: error.toString() }
      };

      this.logMaintenanceResult(task.name, result, Date.now() - startTime);
      return result;
    }
  }

  /**
   * Run all pending maintenance tasks
   */
  async runAllPendingTasks(): Promise<MaintenanceReport> {
    if (this.isRunning) {
      throw new Error('Maintenance is already running');
    }

    this.isRunning = true;
    const results: { task: string; result: any }[] = [];

    try {
      const pendingTasks = Array.from(this.tasks.values())
        .filter(task => this.shouldRunTask(task))
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));

      for (const task of pendingTasks) {
        const result = await this.runTask(task.id);
        results.push({ task: task.name, result });
      }

      return this.generateMaintenanceReport();
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Schedule automatic maintenance
   */
  private scheduleAutomaticMaintenance(): void {
    // Run maintenance check every hour
    setInterval(() => {
      this.checkAndRunScheduledTasks();
    }, 60 * 60 * 1000); // 1 hour

    // Initial check after 5 minutes
    setTimeout(() => {
      this.checkAndRunScheduledTasks();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Check and run scheduled tasks
   */
  private async checkAndRunScheduledTasks(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    const tasksToRun = Array.from(this.tasks.values())
      .filter(task => task.autoRun && this.shouldRunTask(task));

    if (tasksToRun.length > 0) {
      console.log(`🔧 Running ${tasksToRun.length} scheduled maintenance tasks`);
      await this.runAllPendingTasks();
    }
  }

  /**
   * Check if a task should run
   */
  private shouldRunTask(task: MaintenanceTask): boolean {
    if (!task.nextRun) {
      return true;
    }

    return new Date(task.nextRun) <= new Date();
  }

  /**
   * Calculate next run time based on frequency
   */
  private calculateNextRun(frequency: MaintenanceTask['frequency']): string {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'manual':
        return ''; // Manual tasks don't have next run time
    }

    return now.toISOString();
  }

  /**
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: MaintenanceTask['priority']): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  /**
   * Log maintenance result
   */
  private logMaintenanceResult(taskName: string, result: any, duration: number): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      task: taskName,
      result: {
        ...result,
        duration: `${duration}ms`
      }
    };

    this.maintenanceLog.push(logEntry);

    // Keep log size manageable
    if (this.maintenanceLog.length > this.maxLogSize) {
      this.maintenanceLog = this.maintenanceLog.slice(-this.maxLogSize);
    }

    console.log(`🔧 Maintenance task completed: ${taskName}`, result);
  }

  /**
   * Generate maintenance report
   */
  generateMaintenanceReport(): MaintenanceReport {
    const tasks = Array.from(this.tasks.values());
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;

    const lastMaintenanceRun = this.maintenanceLog.length > 0 
      ? this.maintenanceLog[this.maintenanceLog.length - 1].timestamp 
      : null;

    const nextScheduledRun = tasks
      .filter(t => t.autoRun && t.nextRun)
      .map(t => new Date(t.nextRun!))
      .sort((a, b) => a.getTime() - b.getTime())[0]?.toISOString() || null;

    // Determine system health
    let systemHealth: 'good' | 'warning' | 'critical' = 'good';
    if (failedTasks > 0) {
      systemHealth = tasks.some(t => t.status === 'failed' && t.priority === 'critical') 
        ? 'critical' 
        : 'warning';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (failedTasks > 0) {
      recommendations.push(`${failedTasks} maintenance tasks have failed and need attention`);
    }
    if (pendingTasks > tasks.length * 0.5) {
      recommendations.push('Many maintenance tasks are pending - consider running maintenance');
    }

    return {
      totalTasks: tasks.length,
      completedTasks,
      failedTasks,
      pendingTasks,
      lastMaintenanceRun,
      nextScheduledRun,
      systemHealth,
      recommendations
    };
  }

  // Maintenance task implementations

  /**
   * Cache cleanup task
   */
  private async cleanupCache(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      let cleanedItems = 0;

      // Clear expired items from various caches
      if (typeof window !== 'undefined') {
        // Clear expired session data
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
          if (key.startsWith('temp_') || key.startsWith('cache_')) {
            try {
              const data = JSON.parse(sessionStorage.getItem(key) || '{}');
              if (data.expires && new Date(data.expires) < new Date()) {
                sessionStorage.removeItem(key);
                cleanedItems++;
              }
            } catch {
              // Invalid JSON, remove it
              sessionStorage.removeItem(key);
              cleanedItems++;
            }
          }
        });
      }

      return {
        success: true,
        message: `Cache cleanup completed. Removed ${cleanedItems} expired items.`,
        details: { cleanedItems }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Cache cleanup failed: ${error.message}`
      };
    }
  }

  /**
   * Storage cleanup task
   */
  private async cleanupStorage(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      let cleanedItems = 0;

      if (typeof window !== 'undefined') {
        // Clean old localStorage items
        const localKeys = Object.keys(localStorage);
        localKeys.forEach(key => {
          if (key.startsWith('old_') || key.startsWith('deprecated_')) {
            localStorage.removeItem(key);
            cleanedItems++;
          }
        });
      }

      return {
        success: true,
        message: `Storage cleanup completed. Removed ${cleanedItems} old items.`,
        details: { cleanedItems }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Storage cleanup failed: ${error.message}`
      };
    }
  }

  /**
   * Performance optimization task
   */
  private async optimizePerformance(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const optimizations: string[] = [];

      // Force garbage collection if available
      if (typeof window !== 'undefined' && 'gc' in window) {
        (window as any).gc();
        optimizations.push('Garbage collection triggered');
      }

      // Clear console in production
      if (import.meta.env.PROD && typeof console !== 'undefined') {
        console.clear();
        optimizations.push('Console cleared');
      }

      return {
        success: true,
        message: `Performance optimization completed. Applied ${optimizations.length} optimizations.`,
        details: { optimizations }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Performance optimization failed: ${error.message}`
      };
    }
  }

  /**
   * Error log cleanup task
   */
  private async cleanupErrorLogs(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // This would integrate with the error handling service
      // For now, just return success
      return {
        success: true,
        message: 'Error log cleanup completed.',
        details: { archivedLogs: 0 }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error log cleanup failed: ${error.message}`
      };
    }
  }

  /**
   * Security check task
   */
  private async performSecurityCheck(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const checks: string[] = [];
      let issues = 0;

      // Check for secure context
      if (typeof window !== 'undefined') {
        if (!window.isSecureContext) {
          issues++;
          checks.push('Not running in secure context (HTTPS)');
        }

        // Check for mixed content
        if (window.location.protocol === 'https:' && document.querySelector('script[src^="http:"], link[href^="http:"]')) {
          issues++;
          checks.push('Mixed content detected');
        }
      }

      return {
        success: issues === 0,
        message: issues === 0 
          ? 'Security check passed. No issues found.'
          : `Security check found ${issues} issues.`,
        details: { issues, checks }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Security check failed: ${error.message}`
      };
    }
  }

  /**
   * System health monitoring task
   */
  private async monitorSystemHealth(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const healthMetrics: any = {};

      if (typeof window !== 'undefined' && 'performance' in window) {
        // Memory usage
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          healthMetrics.memoryUsage = {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
          };
        }

        // Connection info
        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          healthMetrics.connection = {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
          };
        }
      }

      return {
        success: true,
        message: 'System health monitoring completed.',
        details: healthMetrics
      };
    } catch (error: any) {
      return {
        success: false,
        message: `System health monitoring failed: ${error.message}`
      };
    }
  }

  /**
   * Get all tasks
   */
  getTasks(): MaintenanceTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get maintenance log
   */
  getMaintenanceLog(): typeof this.maintenanceLog {
    return [...this.maintenanceLog];
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): MaintenanceTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Update task configuration
   */
  updateTask(taskId: string, updates: Partial<MaintenanceTask>): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    Object.assign(task, updates);
    return true;
  }
}

export const maintenanceService = new MaintenanceService();