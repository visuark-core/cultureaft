export interface ErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'validation' | 'authentication' | 'authorization' | 'business' | 'system' | 'unknown';
  timestamp: string;
  context?: any;
  stack?: string;
  recoverable: boolean;
  retryable: boolean;
}

export interface ErrorRecoveryAction {
  type: 'retry' | 'redirect' | 'refresh' | 'logout' | 'fallback' | 'ignore';
  label: string;
  action: () => void | Promise<void>;
}

class ErrorHandlingService {
  private errorLog: ErrorDetails[] = [];
  private readonly maxLogSize = 1000;
  private errorListeners: ((error: ErrorDetails) => void)[] = [];

  /**
   * Process and categorize an error
   */
  processError(error: any, context?: any): ErrorDetails {
    const errorDetails = this.categorizeError(error, context);
    
    // Log the error
    this.logError(errorDetails);
    
    // Notify listeners
    this.notifyListeners(errorDetails);
    
    return errorDetails;
  }

  /**
   * Categorize error and create ErrorDetails
   */
  private categorizeError(error: any, context?: any): ErrorDetails {
    const timestamp = new Date().toISOString();
    let errorDetails: ErrorDetails;

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      errorDetails = {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network connection failed',
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        severity: 'high',
        category: 'network',
        timestamp,
        context,
        recoverable: true,
        retryable: true
      };
    }
    // Timeout errors
    else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorDetails = {
        code: 'TIMEOUT_ERROR',
        message: error.message || 'Request timeout',
        userMessage: 'The request is taking too long. Please try again.',
        severity: 'medium',
        category: 'network',
        timestamp,
        context,
        recoverable: true,
        retryable: true
      };
    }
    // Authentication errors
    else if (error.response?.status === 401) {
      errorDetails = {
        code: 'AUTHENTICATION_ERROR',
        message: error.response.data?.message || 'Authentication failed',
        userMessage: 'Your session has expired. Please log in again.',
        severity: 'high',
        category: 'authentication',
        timestamp,
        context,
        recoverable: true,
        retryable: false
      };
    }
    // Authorization errors
    else if (error.response?.status === 403) {
      errorDetails = {
        code: 'AUTHORIZATION_ERROR',
        message: error.response.data?.message || 'Access denied',
        userMessage: 'You do not have permission to perform this action.',
        severity: 'medium',
        category: 'authorization',
        timestamp,
        context,
        recoverable: false,
        retryable: false
      };
    }
    // Validation errors
    else if (error.response?.status === 400) {
      errorDetails = {
        code: 'VALIDATION_ERROR',
        message: error.response.data?.message || 'Invalid request data',
        userMessage: error.response.data?.userMessage || 'Please check your input and try again.',
        severity: 'low',
        category: 'validation',
        timestamp,
        context,
        recoverable: true,
        retryable: false
      };
    }
    // Not found errors
    else if (error.response?.status === 404) {
      errorDetails = {
        code: 'NOT_FOUND_ERROR',
        message: error.response.data?.message || 'Resource not found',
        userMessage: 'The requested resource could not be found.',
        severity: 'medium',
        category: 'business',
        timestamp,
        context,
        recoverable: false,
        retryable: false
      };
    }
    // Server errors
    else if (error.response?.status >= 500) {
      errorDetails = {
        code: 'SERVER_ERROR',
        message: error.response.data?.message || 'Internal server error',
        userMessage: 'Something went wrong on our end. Please try again later.',
        severity: 'critical',
        category: 'system',
        timestamp,
        context,
        recoverable: true,
        retryable: true
      };
    }
    // JavaScript errors
    else if (error instanceof Error) {
      errorDetails = {
        code: 'JAVASCRIPT_ERROR',
        message: error.message,
        userMessage: 'An unexpected error occurred. Please refresh the page and try again.',
        severity: 'high',
        category: 'system',
        timestamp,
        context,
        stack: error.stack,
        recoverable: true,
        retryable: false
      };
    }
    // Unknown errors
    else {
      errorDetails = {
        code: 'UNKNOWN_ERROR',
        message: error.toString() || 'Unknown error occurred',
        userMessage: 'An unexpected error occurred. Please try again.',
        severity: 'medium',
        category: 'unknown',
        timestamp,
        context,
        recoverable: true,
        retryable: true
      };
    }

    return errorDetails;
  }

  /**
   * Log error to internal storage
   */
  private logError(errorDetails: ErrorDetails): void {
    this.errorLog.push(errorDetails);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group(`🚨 Error: ${errorDetails.code}`);
      console.error('Message:', errorDetails.message);
      console.error('User Message:', errorDetails.userMessage);
      console.error('Severity:', errorDetails.severity);
      console.error('Category:', errorDetails.category);
      console.error('Context:', errorDetails.context);
      if (errorDetails.stack) {
        console.error('Stack:', errorDetails.stack);
      }
      console.groupEnd();
    }
  }

  /**
   * Get recovery actions for an error
   */
  getRecoveryActions(errorDetails: ErrorDetails): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    // Retry action for retryable errors
    if (errorDetails.retryable) {
      actions.push({
        type: 'retry',
        label: 'Try Again',
        action: () => {
          // This will be implemented by the calling component
          window.location.reload();
        }
      });
    }

    // Logout action for authentication errors
    if (errorDetails.category === 'authentication') {
      actions.push({
        type: 'logout',
        label: 'Log In Again',
        action: () => {
          localStorage.removeItem('authToken');
          sessionStorage.clear();
          window.location.href = '/login';
        }
      });
    }

    // Refresh action for system errors
    if (errorDetails.category === 'system' && errorDetails.severity === 'critical') {
      actions.push({
        type: 'refresh',
        label: 'Refresh Page',
        action: () => {
          window.location.reload();
        }
      });
    }

    // Redirect to home for not found errors
    if (errorDetails.code === 'NOT_FOUND_ERROR') {
      actions.push({
        type: 'redirect',
        label: 'Go Home',
        action: () => {
          window.location.href = '/';
        }
      });
    }

    return actions;
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (error: ErrorDetails) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeErrorListener(listener: (error: ErrorDetails) => void): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of an error
   */
  private notifyListeners(errorDetails: ErrorDetails): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorDetails);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * Get error log
   */
  getErrorLog(): ErrorDetails[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recentErrors: ErrorDetails[];
  } {
    const total = this.errorLog.length;
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.errorLog.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });

    const recentErrors = this.errorLog
      .slice(-10)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      total,
      byCategory,
      bySeverity,
      recentErrors
    };
  }

  /**
   * Handle global unhandled errors
   */
  setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.processError(event.reason, {
        type: 'unhandledrejection',
        promise: event.promise
      });
      
      // Prevent default browser behavior
      event.preventDefault();
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.processError(event.error || new Error(event.message), {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }
}

export const errorHandlingService = new ErrorHandlingService();