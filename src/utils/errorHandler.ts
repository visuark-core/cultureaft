/**
 * Comprehensive error handling utility for payment operations
 */

import { logger } from './logger';
import { PaymentError } from '../types/payment';

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  PAYMENT = 'PAYMENT',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  CONFIGURATION = 'CONFIGURATION',
  SYSTEM = 'SYSTEM',
  USER = 'USER'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string;
  orderId?: string;
  paymentId?: string;
  component?: string;
  action?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  additionalData?: any;
}

export interface ProcessedError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  originalError: Error | PaymentError | string;
  context: ErrorContext;
  isRetryable: boolean;
  retryAfter?: number;
  timestamp: string;
  stack?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCount: Map<string, number> = new Map();
  private lastErrorTime: Map<string, number> = new Map();

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Process and handle errors with comprehensive logging and user-friendly messages
   */
  handleError(
    error: Error | PaymentError | string,
    category: ErrorCategory,
    context: ErrorContext = {}
  ): ProcessedError {
    const processedError = this.processError(error, category, context);
    
    // Log the error
    this.logError(processedError);
    
    // Track error frequency
    this.trackErrorFrequency(processedError);
    
    // Handle specific error types
    this.handleSpecificError(processedError);
    
    return processedError;
  }

  private processError(
    error: Error | PaymentError | string,
    category: ErrorCategory,
    context: ErrorContext
  ): ProcessedError {
    const id = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    let message: string;
    let originalError: Error | PaymentError | string;
    let stack: string | undefined;

    if (typeof error === 'string') {
      message = error;
      originalError = error;
    } else if (error instanceof Error) {
      message = error.message;
      originalError = error;
      stack = error.stack;
    } else {
      // PaymentError
      message = error.message;
      originalError = error;
    }

    const severity = this.determineSeverity(error, category);
    const userMessage = this.generateUserMessage(error, category);
    const isRetryable = this.isErrorRetryable(error, category);
    const retryAfter = isRetryable ? this.calculateRetryDelay(error, category) : undefined;

    return {
      id,
      category,
      severity,
      message,
      userMessage,
      originalError,
      context: {
        ...context,
        timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      isRetryable,
      retryAfter,
      timestamp,
      stack
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private determineSeverity(
    error: Error | PaymentError | string,
    category: ErrorCategory
  ): ErrorSeverity {
    // Critical errors
    if (category === ErrorCategory.PAYMENT && this.isPaymentCriticalError(error)) {
      return ErrorSeverity.CRITICAL;
    }

    if (category === ErrorCategory.AUTHENTICATION || category === ErrorCategory.AUTHORIZATION) {
      return ErrorSeverity.HIGH;
    }

    // High severity errors
    if (category === ErrorCategory.SYSTEM || category === ErrorCategory.CONFIGURATION) {
      return ErrorSeverity.HIGH;
    }

    // Network errors are usually medium severity
    if (category === ErrorCategory.NETWORK) {
      return ErrorSeverity.MEDIUM;
    }

    // Validation and user errors are usually low severity
    if (category === ErrorCategory.VALIDATION || category === ErrorCategory.USER) {
      return ErrorSeverity.LOW;
    }

    return ErrorSeverity.MEDIUM;
  }

  private isPaymentCriticalError(error: Error | PaymentError | string): boolean {
    const criticalPatterns = [
      'signature verification failed',
      'payment verification failed',
      'duplicate payment',
      'amount mismatch',
      'currency mismatch'
    ];

    const errorMessage = typeof error === 'string' ? error : error.message;
    return criticalPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern)
    );
  }

  private generateUserMessage(
    error: Error | PaymentError | string,
    category: ErrorCategory
  ): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const lowerMessage = errorMessage.toLowerCase();

    // Payment-specific messages
    if (category === ErrorCategory.PAYMENT) {
      if (lowerMessage.includes('network') || lowerMessage.includes('timeout')) {
        return 'Payment processing is temporarily unavailable. Please check your internet connection and try again.';
      }
      
      if (lowerMessage.includes('declined') || lowerMessage.includes('insufficient')) {
        return 'Your payment was declined. Please try a different payment method or contact your bank.';
      }
      
      if (lowerMessage.includes('expired')) {
        return 'Your payment method has expired. Please use a different card or update your payment information.';
      }
      
      if (lowerMessage.includes('verification') || lowerMessage.includes('signature')) {
        return 'Payment verification failed. If money was deducted, it will be refunded within 5-7 business days.';
      }
      
      return 'Payment processing failed. Please try again or use a different payment method.';
    }

    // Network-specific messages
    if (category === ErrorCategory.NETWORK) {
      if (lowerMessage.includes('timeout')) {
        return 'Request timed out. Please check your internet connection and try again.';
      }
      
      if (lowerMessage.includes('offline') || lowerMessage.includes('network')) {
        return 'You appear to be offline. Please check your internet connection.';
      }
      
      return 'Network error occurred. Please check your connection and try again.';
    }

    // Validation messages
    if (category === ErrorCategory.VALIDATION) {
      return 'Please check your information and try again.';
    }

    // Configuration messages
    if (category === ErrorCategory.CONFIGURATION) {
      return 'Service is temporarily unavailable. Please try again later.';
    }

    // Generic fallback
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  private isErrorRetryable(
    error: Error | PaymentError | string,
    category: ErrorCategory
  ): boolean {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const lowerMessage = errorMessage.toLowerCase();

    // Never retry these errors
    const nonRetryablePatterns = [
      'invalid signature',
      'authentication failed',
      'unauthorized',
      'forbidden',
      'payment declined',
      'insufficient funds',
      'expired card',
      'invalid card',
      'duplicate payment'
    ];

    if (nonRetryablePatterns.some(pattern => lowerMessage.includes(pattern))) {
      return false;
    }

    // Retryable categories
    const retryableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.SYSTEM
    ];

    if (retryableCategories.includes(category)) {
      return true;
    }

    // Retryable payment errors
    if (category === ErrorCategory.PAYMENT) {
      const retryablePaymentPatterns = [
        'timeout',
        'network error',
        'server error',
        'gateway error',
        'temporary'
      ];
      
      return retryablePaymentPatterns.some(pattern => lowerMessage.includes(pattern));
    }

    return false;
  }

  private calculateRetryDelay(
    error: Error | PaymentError | string,
    category: ErrorCategory
  ): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    // Different delays for different categories
    switch (category) {
      case ErrorCategory.NETWORK:
        return Math.min(baseDelay * 2, maxDelay);
      case ErrorCategory.PAYMENT:
        return Math.min(baseDelay * 3, maxDelay);
      case ErrorCategory.SYSTEM:
        return Math.min(baseDelay * 5, maxDelay);
      default:
        return baseDelay;
    }
  }

  private logError(processedError: ProcessedError): void {
    const logData = {
      errorId: processedError.id,
      category: processedError.category,
      severity: processedError.severity,
      isRetryable: processedError.isRetryable,
      retryAfter: processedError.retryAfter,
      context: processedError.context
    };

    switch (processedError.severity) {
      case ErrorSeverity.CRITICAL:
        logger.critical(
          processedError.category,
          processedError.message,
          processedError.originalError instanceof Error ? processedError.originalError : undefined,
          logData,
          {
            orderId: processedError.context.orderId,
            paymentId: processedError.context.paymentId,
            userId: processedError.context.userId
          }
        );
        break;
      
      case ErrorSeverity.HIGH:
        logger.error(
          processedError.category,
          processedError.message,
          processedError.originalError instanceof Error ? processedError.originalError : undefined,
          logData,
          {
            orderId: processedError.context.orderId,
            paymentId: processedError.context.paymentId,
            userId: processedError.context.userId
          }
        );
        break;
      
      case ErrorSeverity.MEDIUM:
        logger.warn(processedError.category, processedError.message, logData);
        break;
      
      case ErrorSeverity.LOW:
        logger.info(processedError.category, processedError.message, logData);
        break;
    }
  }

  private trackErrorFrequency(processedError: ProcessedError): void {
    const key = `${processedError.category}_${processedError.message}`;
    const now = Date.now();
    
    // Update error count
    const currentCount = this.errorCount.get(key) || 0;
    this.errorCount.set(key, currentCount + 1);
    
    // Update last error time
    this.lastErrorTime.set(key, now);
    
    // Check for error spikes
    if (currentCount > 5) {
      const lastTime = this.lastErrorTime.get(key) || 0;
      const timeDiff = now - lastTime;
      
      // If more than 5 errors in 5 minutes, log as critical
      if (timeDiff < 5 * 60 * 1000) {
        logger.critical(
          'ERROR_SPIKE',
          `Error spike detected: ${processedError.message}`,
          undefined,
          {
            errorCount: currentCount,
            timeWindow: timeDiff,
            category: processedError.category
          }
        );
      }
    }
  }

  private handleSpecificError(processedError: ProcessedError): void {
    // Handle payment verification failures
    if (processedError.category === ErrorCategory.PAYMENT && 
        processedError.message.toLowerCase().includes('verification')) {
      logger.security(
        'payment_verification_failure',
        'failure',
        'high',
        'Payment verification failed - potential security issue',
        {
          errorId: processedError.id,
          orderId: processedError.context.orderId,
          paymentId: processedError.context.paymentId
        }
      );
    }

    // Handle authentication failures
    if (processedError.category === ErrorCategory.AUTHENTICATION) {
      logger.security(
        'authentication_failure',
        'failure',
        'medium',
        'Authentication failed',
        {
          errorId: processedError.id,
          userId: processedError.context.userId
        }
      );
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ProcessedError[];
  } {
    const totalErrors = Array.from(this.errorCount.values()).reduce((sum, count) => sum + count, 0);
    
    // This is a simplified version - in a real implementation,
    // you'd want to store more detailed error information
    return {
      totalErrors,
      errorsByCategory: {},
      errorsBySeverity: {},
      recentErrors: []
    };
  }

  /**
   * Clear error tracking data
   */
  clearErrorTracking(): void {
    this.errorCount.clear();
    this.lastErrorTime.clear();
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handlePaymentError = (
  error: Error | PaymentError | string,
  context: ErrorContext = {}
): ProcessedError => {
  return errorHandler.handleError(error, ErrorCategory.PAYMENT, context);
};

export const handleNetworkError = (
  error: Error | string,
  context: ErrorContext = {}
): ProcessedError => {
  return errorHandler.handleError(error, ErrorCategory.NETWORK, context);
};

export const handleValidationError = (
  error: Error | string,
  context: ErrorContext = {}
): ProcessedError => {
  return errorHandler.handleError(error, ErrorCategory.VALIDATION, context);
};

export const handleSystemError = (
  error: Error | string,
  context: ErrorContext = {}
): ProcessedError => {
  return errorHandler.handleError(error, ErrorCategory.SYSTEM, context);
};

export default errorHandler;