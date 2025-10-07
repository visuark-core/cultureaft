/**
 * Retry mechanism utility for handling network failures and transient errors
 */

import { logger } from './logger';
import { errorHandler, ErrorCategory } from './errorHandler';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
  onMaxAttemptsReached?: (error: any) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error: any) => {
    // Default retry condition - retry on network errors and 5xx server errors
    if (error?.code === 'NETWORK_ERROR' || error?.code === 'ECONNABORTED') {
      return true;
    }
    
    if (error?.response?.status >= 500) {
      return true;
    }
    
    // Retry on specific error messages
    const retryableMessages = [
      'network error',
      'timeout',
      'connection failed',
      'server error',
      'gateway error',
      'service unavailable'
    ];
    
    const errorMessage = (error?.message || '').toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }
};

class RetryMechanism {
  private static instance: RetryMechanism;

  static getInstance(): RetryMechanism {
    if (!RetryMechanism.instance) {
      RetryMechanism.instance = new RetryMechanism();
    }
    return RetryMechanism.instance;
  }

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context: { operationName?: string; orderId?: string; paymentId?: string } = {}
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    const startTime = Date.now();
    let lastError: any;
    let attempt = 0;

    const { operationName = 'unknown', orderId, paymentId } = context;

    logger.debug('RETRY', `Starting operation with retry: ${operationName}`, {
      config: finalConfig,
      orderId,
      paymentId
    });

    while (attempt < finalConfig.maxAttempts) {
      attempt++;
      
      try {
        logger.debug('RETRY', `Attempt ${attempt}/${finalConfig.maxAttempts} for ${operationName}`, {
          orderId,
          paymentId
        });

        const result = await operation();
        
        const totalTime = Date.now() - startTime;
        
        logger.info('RETRY', `Operation ${operationName} succeeded on attempt ${attempt}`, {
          attempts: attempt,
          totalTime,
          orderId,
          paymentId
        });

        return {
          success: true,
          result,
          attempts: attempt,
          totalTime
        };
      } catch (error) {
        lastError = error;
        
        logger.warn('RETRY', `Attempt ${attempt} failed for ${operationName}`, {
          error: error instanceof Error ? error.message : String(error),
          orderId,
          paymentId
        });

        // Check if we should retry this error
        if (!finalConfig.retryCondition!(error)) {
          logger.info('RETRY', `Error not retryable for ${operationName}`, {
            error: error instanceof Error ? error.message : String(error),
            orderId,
            paymentId
          });
          break;
        }

        // If this is the last attempt, don't wait
        if (attempt >= finalConfig.maxAttempts) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, finalConfig);
        
        logger.debug('RETRY', `Waiting ${delay}ms before retry ${attempt + 1} for ${operationName}`, {
          orderId,
          paymentId
        });

        // Call onRetry callback if provided
        finalConfig.onRetry?.(attempt, error);

        // Wait before next attempt
        await this.delay(delay);
      }
    }

    // All attempts failed
    const totalTime = Date.now() - startTime;
    
    logger.error('RETRY', `All retry attempts failed for ${operationName}`, lastError instanceof Error ? lastError : undefined, {
      attempts: attempt,
      totalTime,
      orderId,
      paymentId
    });

    // Handle the error through error handler
    errorHandler.handleError(lastError, ErrorCategory.NETWORK, {
      orderId,
      paymentId,
      component: 'RetryMechanism',
      action: operationName,
      additionalData: {
        attempts: attempt,
        totalTime
      }
    });

    // Call onMaxAttemptsReached callback if provided
    finalConfig.onMaxAttemptsReached?.(lastError);

    return {
      success: false,
      error: lastError,
      attempts: attempt,
      totalTime
    };
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }
    
    return Math.max(delay, 0);
  }

  /**
   * Create a delay promise
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retry wrapper for a function
   */
  createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    config: Partial<RetryConfig> = {},
    operationName?: string
  ): T {
    return (async (...args: Parameters<T>) => {
      const result = await this.executeWithRetry(
        () => fn(...args),
        config,
        { operationName: operationName || fn.name }
      );
      
      if (result.success) {
        return result.result;
      } else {
        throw result.error;
      }
    }) as T;
  }

  /**
   * Retry specifically for payment operations
   */
  async retryPaymentOperation<T>(
    operation: () => Promise<T>,
    orderId: string,
    operationName: string,
    paymentId?: string
  ): Promise<T> {
    const config: Partial<RetryConfig> = {
      maxAttempts: 3,
      baseDelay: 2000,
      maxDelay: 10000,
      retryCondition: (error: any) => {
        // Don't retry payment verification failures or authentication errors
        const nonRetryablePatterns = [
          'signature verification failed',
          'invalid signature',
          'authentication failed',
          'payment declined',
          'insufficient funds'
        ];
        
        const errorMessage = (error?.message || '').toLowerCase();
        const isNonRetryable = nonRetryablePatterns.some(pattern => 
          errorMessage.includes(pattern)
        );
        
        return !isNonRetryable && DEFAULT_RETRY_CONFIG.retryCondition!(error);
      },
      onRetry: (attempt: number, error: any) => {
        logger.warn('PAYMENT_RETRY', `Payment operation retry attempt ${attempt}`, {
          operationName,
          orderId,
          paymentId,
          error: error.message
        });
      },
      onMaxAttemptsReached: (error: any) => {
        logger.error('PAYMENT_RETRY', `Payment operation failed after all retries`, error, {
          operationName,
          orderId,
          paymentId
        });
      }
    };

    const result = await this.executeWithRetry(
      operation,
      config,
      { operationName, orderId, paymentId }
    );

    if (result.success) {
      return result.result!;
    } else {
      throw result.error;
    }
  }

  /**
   * Retry for network operations
   */
  async retryNetworkOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxAttempts: number = 5
  ): Promise<T> {
    const config: Partial<RetryConfig> = {
      maxAttempts,
      baseDelay: 1000,
      maxDelay: 15000,
      backoffMultiplier: 1.5,
      retryCondition: (error: any) => {
        // Retry all network-related errors
        return DEFAULT_RETRY_CONFIG.retryCondition!(error);
      }
    };

    const result = await this.executeWithRetry(
      operation,
      config,
      { operationName }
    );

    if (result.success) {
      return result.result!;
    } else {
      throw result.error;
    }
  }

  /**
   * Circuit breaker pattern - stop retrying if too many failures
   */
  private circuitBreakers: Map<string, {
    failures: number;
    lastFailure: number;
    isOpen: boolean;
  }> = new Map();

  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: {
      failureThreshold: number;
      resetTimeout: number;
      retryConfig?: Partial<RetryConfig>;
    } = {
      failureThreshold: 5,
      resetTimeout: 60000 // 1 minute
    }
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(operationName) || {
      failures: 0,
      lastFailure: 0,
      isOpen: false
    };

    // Check if circuit breaker is open
    if (breaker.isOpen) {
      const now = Date.now();
      if (now - breaker.lastFailure < config.resetTimeout) {
        throw new Error(`Circuit breaker is open for ${operationName}. Try again later.`);
      } else {
        // Reset circuit breaker
        breaker.isOpen = false;
        breaker.failures = 0;
        logger.info('CIRCUIT_BREAKER', `Circuit breaker reset for ${operationName}`);
      }
    }

    try {
      const result = await this.executeWithRetry(
        operation,
        config.retryConfig || {},
        { operationName }
      );

      if (result.success) {
        // Reset failure count on success
        breaker.failures = 0;
        this.circuitBreakers.set(operationName, breaker);
        return result.result!;
      } else {
        throw result.error;
      }
    } catch (error) {
      breaker.failures++;
      breaker.lastFailure = Date.now();

      if (breaker.failures >= config.failureThreshold) {
        breaker.isOpen = true;
        logger.error('CIRCUIT_BREAKER', `Circuit breaker opened for ${operationName}`, error, {
          failures: breaker.failures,
          threshold: config.failureThreshold
        });
      }

      this.circuitBreakers.set(operationName, breaker);
      throw error;
    }
  }
}

// Export singleton instance
export const retryMechanism = RetryMechanism.getInstance();

// Convenience functions
export const withRetry = <T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  operationName?: string
) => retryMechanism.executeWithRetry(operation, config, { operationName });

export const withPaymentRetry = <T>(
  operation: () => Promise<T>,
  orderId: string,
  operationName: string,
  paymentId?: string
) => retryMechanism.retryPaymentOperation(operation, orderId, operationName, paymentId);

export const withNetworkRetry = <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxAttempts?: number
) => retryMechanism.retryNetworkOperation(operation, operationName, maxAttempts);

export const createRetryWrapper = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config?: Partial<RetryConfig>,
  operationName?: string
) => retryMechanism.createRetryWrapper(fn, config, operationName);

export default retryMechanism;