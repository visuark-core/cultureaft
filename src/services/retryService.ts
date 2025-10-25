/**
 * Retry service for handling failed operations with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export class RetryService {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    exponentialBase: 2,
    jitter: true,
    retryCondition: () => true,
  };

  /**
   * Executes a function with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry this error
        if (!config.retryCondition(error)) {
          break;
        }

        // If this was the last attempt, don't wait
        if (attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, config);
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
        
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError || new Error('Unknown error'),
      attempts: config.maxAttempts,
      totalTime: Date.now() - startTime,
    };
  }

  /**
   * Calculates delay with exponential backoff and optional jitter
   */
  private static calculateDelay(attempt: number, config: Required<RetryOptions>): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
    let delay = Math.min(exponentialDelay, config.maxDelay);

    if (config.jitter) {
      // Add random jitter (±25% of the delay)
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay = Math.max(0, delay + jitter);
    }

    return Math.round(delay);
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Predefined retry conditions
   */
  static retryConditions = {
    // Retry on network errors
    networkErrors: (error: any): boolean => {
      if (error?.code === 'NETWORK_ERROR' || error?.code === 'ECONNRESET') {
        return true;
      }
      if (error?.message?.includes('network') || error?.message?.includes('timeout')) {
        return true;
      }
      return false;
    },

    // Retry on HTTP 5xx errors
    serverErrors: (error: any): boolean => {
      const status = error?.status || error?.response?.status;
      return status >= 500 && status < 600;
    },

    // Retry on rate limiting (429) and server errors
    httpRetryable: (error: any): boolean => {
      const status = error?.status || error?.response?.status;
      return status === 429 || (status >= 500 && status < 600);
    },

    // Retry on Google API specific errors
    googleApiErrors: (error: any): boolean => {
      const status = error?.status || error?.response?.status;
      const code = error?.code;
      
      // Retry on rate limiting, server errors, and specific Google API errors
      if (status === 429 || (status >= 500 && status < 600)) {
        return true;
      }
      
      // Retry on specific Google API error codes
      const retryableCodes = ['RATE_LIMIT_EXCEEDED', 'BACKEND_ERROR', 'INTERNAL_ERROR'];
      return retryableCodes.includes(code);
    },

    // Never retry
    never: (): boolean => false,

    // Always retry
    always: (): boolean => true,
  };
}

/**
 * Queue for managing failed operations that need to be retried later
 */
export interface QueuedOperation {
  id: string;
  operation: () => Promise<any>;
  options: RetryOptions;
  createdAt: Date;
  lastAttempt?: Date;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date;
  priority: number;
  metadata?: Record<string, any>;
}

export class RetryQueue {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private processingInterval: number | null = null;

  constructor(private processIntervalMs: number = 5000) {
    this.startProcessing();
  }

  /**
   * Adds an operation to the retry queue
   */
  addOperation(
    operation: () => Promise<any>,
    options: RetryOptions = {},
    priority: number = 0,
    metadata?: Record<string, any>
  ): string {
    const id = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const config = { ...RetryService['DEFAULT_OPTIONS'], ...options };
    
    const queuedOperation: QueuedOperation = {
      id,
      operation,
      options,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: config.maxAttempts,
      nextRetryAt: new Date(),
      priority,
      metadata,
    };

    this.queue.push(queuedOperation);
    this.sortQueue();
    
    console.log(`Added operation ${id} to retry queue`);
    return id;
  }

  /**
   * Removes an operation from the queue
   */
  removeOperation(id: string): boolean {
    const index = this.queue.findIndex(op => op.id === id);
    if (index >= 0) {
      this.queue.splice(index, 1);
      console.log(`Removed operation ${id} from retry queue`);
      return true;
    }
    return false;
  }

  /**
   * Gets the current queue status
   */
  getQueueStatus(): {
    totalOperations: number;
    pendingOperations: number;
    nextRetryAt?: Date;
  } {
    const pendingOperations = this.queue.filter(op => op.nextRetryAt <= new Date());
    const nextOperation = this.queue.find(op => op.nextRetryAt > new Date());

    return {
      totalOperations: this.queue.length,
      pendingOperations: pendingOperations.length,
      nextRetryAt: nextOperation?.nextRetryAt,
    };
  }

  /**
   * Starts processing the retry queue
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.processIntervalMs);
  }

  /**
   * Stops processing the retry queue
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Processes pending operations in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const now = new Date();
    const pendingOperations = this.queue.filter(op => op.nextRetryAt <= now);

    for (const operation of pendingOperations) {
      try {
        await this.processOperation(operation);
      } catch (error) {
        console.error(`Error processing queued operation ${operation.id}:`, error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Processes a single operation
   */
  private async processOperation(queuedOperation: QueuedOperation): Promise<void> {
    queuedOperation.attempts++;
    queuedOperation.lastAttempt = new Date();

    try {
      await queuedOperation.operation();
      
      // Operation succeeded, remove from queue
      this.removeOperation(queuedOperation.id);
      console.log(`Queued operation ${queuedOperation.id} completed successfully`);
    } catch (error) {
      console.error(`Queued operation ${queuedOperation.id} failed (attempt ${queuedOperation.attempts}):`, error);

      // Check if we should retry
      const shouldRetry = queuedOperation.options.retryCondition?.(error) ?? true;
      
      if (queuedOperation.attempts >= queuedOperation.maxAttempts || !shouldRetry) {
        // Max attempts reached or shouldn't retry, remove from queue
        this.removeOperation(queuedOperation.id);
        console.error(`Queued operation ${queuedOperation.id} failed permanently after ${queuedOperation.attempts} attempts`);
      } else {
        // Schedule next retry
        const delay = this.calculateNextRetryDelay(queuedOperation);
        queuedOperation.nextRetryAt = new Date(Date.now() + delay);
        this.sortQueue();
        console.log(`Queued operation ${queuedOperation.id} scheduled for retry in ${delay}ms`);
      }
    }
  }

  /**
   * Calculates the delay for the next retry
   */
  private calculateNextRetryDelay(operation: QueuedOperation): number {
    const config = { ...RetryService['DEFAULT_OPTIONS'], ...operation.options };
    const exponentialDelay = config.baseDelay * Math.pow(config.exponentialBase, operation.attempts - 1);
    let delay = Math.min(exponentialDelay, config.maxDelay);

    if (config.jitter) {
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay = Math.max(0, delay + jitter);
    }

    return Math.round(delay);
  }

  /**
   * Sorts the queue by priority and next retry time
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First sort by priority (higher priority first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Then sort by next retry time (earlier first)
      return a.nextRetryAt.getTime() - b.nextRetryAt.getTime();
    });
  }

  /**
   * Clears all operations from the queue
   */
  clearQueue(): void {
    this.queue = [];
    console.log('Retry queue cleared');
  }

  /**
   * Gets all operations in the queue
   */
  getAllOperations(): QueuedOperation[] {
    return [...this.queue];
  }
}

// Global retry queue instance
export const globalRetryQueue = new RetryQueue();