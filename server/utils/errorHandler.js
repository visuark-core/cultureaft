const { logManager } = require('./logger');
const SecurityLogger = require('./securityLogger');

// Error categories for classification
const ERROR_CATEGORIES = {
  DATABASE: 'database',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  PAYMENT: 'payment',
  INVENTORY: 'inventory',
  VALIDATION: 'validation',
  NETWORK: 'network',
  SYSTEM: 'system',
  SECURITY: 'security'
};

// Error severity levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class ErrorHandler {
  constructor() {
    this.errorMetrics = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      lastReset: new Date()
    };
  }

  /**
   * Categorize error based on error type and context
   */
  categorizeError(err, req) {
    // Security errors (check first for priority)
    if (err.message.includes('security') || err.message.includes('attack') ||
        err.message.includes('suspicious') || err.message.includes('Security violation') ||
        err.message.includes('Suspicious activity detected')) {
      return ERROR_CATEGORIES.SECURITY;
    }

    // Database errors
    if (err.name === 'MongoError' || err.name === 'MongooseError' || 
        err.message.includes('connection') || err.message.includes('timeout')) {
      return ERROR_CATEGORIES.DATABASE;
    }

    // Authentication errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' ||
        err.message.includes('token') || err.message.includes('unauthorized')) {
      return ERROR_CATEGORIES.AUTHENTICATION;
    }

    // Authorization errors
    if (err.message.includes('forbidden') || err.message.includes('permission') ||
        err.statusCode === 403) {
      return ERROR_CATEGORIES.AUTHORIZATION;
    }

    // Payment errors
    if (err.message.includes('payment') ||
        req?.originalUrl?.includes('/payments')) {
      return ERROR_CATEGORIES.PAYMENT;
    }

    // Inventory errors
    if (err.message.includes('inventory') || err.message.includes('stock') ||
        req?.originalUrl?.includes('/inventory')) {
      return ERROR_CATEGORIES.INVENTORY;
    }

    // Validation errors
    if (err.name === 'ValidationError' || err.name === 'CastError' ||
        err.message.includes('validation')) {
      return ERROR_CATEGORIES.VALIDATION;
    }

    // Network errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' ||
        err.message.includes('network')) {
      return ERROR_CATEGORIES.NETWORK;
    }

    return ERROR_CATEGORIES.SYSTEM;
  }

  /**
   * Determine error severity based on category and status code
   */
  determineSeverity(err, category) {
    // Critical errors that require immediate attention
    if (category === ERROR_CATEGORIES.DATABASE && 
        (err.message.includes('connection') || err.message.includes('Connection failed'))) {
      return ERROR_SEVERITY.CRITICAL;
    }

    if (category === ERROR_CATEGORIES.SECURITY) {
      return ERROR_SEVERITY.HIGH;
    }

    if (err.statusCode >= 500) {
      return ERROR_SEVERITY.HIGH;
    }

    if (category === ERROR_CATEGORIES.PAYMENT) {
      return ERROR_SEVERITY.MEDIUM;
    }

    if (err.statusCode >= 400) {
      return ERROR_SEVERITY.MEDIUM;
    }

    return ERROR_SEVERITY.LOW;
  }

  /**
   * Generate user-friendly error messages
   */
  generateUserMessage(err, category, severity) {
    const userMessages = {
      [ERROR_CATEGORIES.DATABASE]: {
        [ERROR_SEVERITY.CRITICAL]: 'Our service is temporarily unavailable. Please try again in a few minutes.',
        [ERROR_SEVERITY.HIGH]: 'We\'re experiencing technical difficulties. Please try again shortly.',
        [ERROR_SEVERITY.MEDIUM]: 'Unable to process your request. Please try again.',
        [ERROR_SEVERITY.LOW]: 'A temporary issue occurred. Please refresh and try again.'
      },
      [ERROR_CATEGORIES.AUTHENTICATION]: {
        [ERROR_SEVERITY.HIGH]: 'Your session has expired. Please log in again.',
        [ERROR_SEVERITY.MEDIUM]: 'Authentication failed. Please check your credentials.',
        [ERROR_SEVERITY.LOW]: 'Please log in to continue.'
      },
      [ERROR_CATEGORIES.AUTHORIZATION]: {
        [ERROR_SEVERITY.HIGH]: 'You don\'t have permission to access this resource.',
        [ERROR_SEVERITY.MEDIUM]: 'Access denied. Please contact support if you believe this is an error.',
        [ERROR_SEVERITY.LOW]: 'Insufficient permissions for this action.'
      },
      [ERROR_CATEGORIES.PAYMENT]: {
        [ERROR_SEVERITY.HIGH]: 'Payment processing is currently unavailable. Please try again later.',
        [ERROR_SEVERITY.MEDIUM]: 'Payment failed. Please check your payment details and try again.',
        [ERROR_SEVERITY.LOW]: 'Unable to process payment. Please try again.'
      },
      [ERROR_CATEGORIES.INVENTORY]: {
        [ERROR_SEVERITY.MEDIUM]: 'Some items in your cart are no longer available. Please review your order.',
        [ERROR_SEVERITY.LOW]: 'Inventory information is temporarily unavailable.'
      },
      [ERROR_CATEGORIES.VALIDATION]: {
        [ERROR_SEVERITY.MEDIUM]: 'Please check your input and try again.',
        [ERROR_SEVERITY.LOW]: 'Invalid data provided.'
      },
      [ERROR_CATEGORIES.NETWORK]: {
        [ERROR_SEVERITY.HIGH]: 'Network connectivity issues detected. Please try again.',
        [ERROR_SEVERITY.MEDIUM]: 'Connection timeout. Please try again.',
        [ERROR_SEVERITY.LOW]: 'Network error occurred.'
      },
      [ERROR_CATEGORIES.SECURITY]: {
        [ERROR_SEVERITY.HIGH]: 'Security violation detected. This incident has been logged.',
        [ERROR_SEVERITY.MEDIUM]: 'Suspicious activity detected.',
        [ERROR_SEVERITY.LOW]: 'Security check failed.'
      },
      [ERROR_CATEGORIES.SYSTEM]: {
        [ERROR_SEVERITY.CRITICAL]: 'System error occurred. Our team has been notified.',
        [ERROR_SEVERITY.HIGH]: 'An unexpected error occurred. Please try again later.',
        [ERROR_SEVERITY.MEDIUM]: 'Service temporarily unavailable.',
        [ERROR_SEVERITY.LOW]: 'An error occurred. Please try again.'
      }
    };

    const categoryMessages = userMessages[category];
    if (!categoryMessages) {
      return 'An unexpected error occurred. Please try again later.';
    }
    return categoryMessages[severity] || categoryMessages[ERROR_SEVERITY.LOW] || 
           'An unexpected error occurred. Please try again later.';
  }

  /**
   * Log error with comprehensive context and categorization
   */
  logError(err, req, category, severity) {
    const correlationId = req?.headers['x-correlation-id'] || logManager.generateCorrelationId();
    logManager.setCorrelationId(correlationId);

    // Update metrics
    this.updateErrorMetrics(category, severity);

    // Prepare comprehensive error context
    const errorContext = {
      correlationId,
      category,
      severity,
      timestamp: new Date().toISOString(),
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code,
        statusCode: err.statusCode
      },
      request: req ? {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        adminId: req.admin?.id,
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeRequestBody(req.body),
        query: req.query
      } : null,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    // Log based on severity
    if (severity === ERROR_SEVERITY.CRITICAL) {
      logManager.error(`CRITICAL ERROR [${category}]: ${err.message}`, err, errorContext);
    } else if (severity === ERROR_SEVERITY.HIGH) {
      logManager.error(`HIGH SEVERITY [${category}]: ${err.message}`, err, errorContext);
    } else if (severity === ERROR_SEVERITY.MEDIUM) {
      logManager.warn(`MEDIUM SEVERITY [${category}]: ${err.message}`, errorContext);
    } else {
      logManager.info(`LOW SEVERITY [${category}]: ${err.message}`, errorContext);
    }

    // Log security events separately
    if (category === ERROR_CATEGORIES.SECURITY || category === ERROR_CATEGORIES.AUTHENTICATION) {
      SecurityLogger.logSecurityEvent('ERROR', {
        category,
        severity,
        error: err.message,
        ip: req?.ip,
        userAgent: req?.get('User-Agent'),
        endpoint: req?.originalUrl,
        userId: req?.user?.id,
        correlationId
      });
    }

    return correlationId;
  }

  /**
   * Update error metrics for monitoring
   */
  updateErrorMetrics(category, severity) {
    this.errorMetrics.totalErrors++;
    this.errorMetrics.errorsByCategory[category] = (this.errorMetrics.errorsByCategory[category] || 0) + 1;
    this.errorMetrics.errorsBySeverity[severity] = (this.errorMetrics.errorsBySeverity[severity] || 0) + 1;
  }

  /**
   * Sanitize request headers for logging
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = 'REDACTED';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize request body for logging
   */
  sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'creditcard', 'cvv', 'pin', 'otp'];

    const sanitizeRecursive = (obj) => {
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = 'REDACTED';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeRecursive(obj[key]);
        }
      }
    };

    sanitizeRecursive(sanitized);
    return sanitized;
  }

  /**
   * Main error handling method
   */
  handle(err, req, res, next) {
    // Prevent handling if response already sent
    if (res.headersSent) {
      return next(err);
    }

    // Categorize and assess severity
    const category = this.categorizeError(err, req);
    const severity = this.determineSeverity(err, category);

    // Log the error with full context
    const correlationId = this.logError(err, req, category, severity);

    // Generate appropriate response
    const statusCode = err.statusCode || this.getStatusCodeForCategory(category);
    const userMessage = err.isOperational ? err.message : this.generateUserMessage(err, category, severity);

    // Prepare error response
    const errorResponse = {
      success: false,
      error: {
        message: userMessage,
        category,
        severity,
        correlationId,
        timestamp: new Date().toISOString()
      }
    };

    // Add additional context for development environment
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.details = {
        originalMessage: err.message,
        stack: err.stack
      };
    }

    res.status(statusCode).json(errorResponse);
  }

  /**
   * Get appropriate status code for error category
   */
  getStatusCodeForCategory(category) {
    const statusCodes = {
      [ERROR_CATEGORIES.DATABASE]: 503,
      [ERROR_CATEGORIES.AUTHENTICATION]: 401,
      [ERROR_CATEGORIES.AUTHORIZATION]: 403,
      [ERROR_CATEGORIES.PAYMENT]: 402,
      [ERROR_CATEGORIES.INVENTORY]: 409,
      [ERROR_CATEGORIES.VALIDATION]: 400,
      [ERROR_CATEGORIES.NETWORK]: 503,
      [ERROR_CATEGORIES.SECURITY]: 403,
      [ERROR_CATEGORIES.SYSTEM]: 500
    };

    return statusCodes[category] || 500;
  }

  /**
   * Get error metrics for monitoring
   */
  getErrorMetrics() {
    return {
      ...this.errorMetrics,
      uptime: Date.now() - this.errorMetrics.lastReset.getTime()
    };
  }

  /**
   * Reset error metrics
   */
  resetErrorMetrics() {
    this.errorMetrics = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      lastReset: new Date()
    };
  }

  // Specific error handlers for different categories
  handleDatabaseError(err, req, res, next) {
    err.statusCode = 503;
    err.isOperational = true;
    this.handle(err, req, res, next);
  }

  handleAuthenticationError(err, req, res, next) {
    err.statusCode = 401;
    err.isOperational = true;
    this.handle(err, req, res, next);
  }

  handleAuthorizationError(err, req, res, next) {
    err.statusCode = 403;
    err.isOperational = true;
    this.handle(err, req, res, next);
  }

  handlePaymentError(err, req, res, next) {
    err.statusCode = 402;
    err.isOperational = true;
    this.handle(err, req, res, next);
  }

  handleInventoryError(err, req, res, next) {
    err.statusCode = 409;
    err.isOperational = true;
    this.handle(err, req, res, next);
  }

  handleValidationError(err, req, res, next) {
    err.statusCode = 400;
    err.isOperational = true;
    this.handle(err, req, res, next);
  }

  handleNetworkError(err, req, res, next) {
    err.statusCode = 503;
    err.isOperational = true;
    this.handle(err, req, res, next);
  }

  handleSecurityError(err, req, res, next) {
    err.statusCode = 403;
    err.isOperational = true;
    this.handle(err, req, res, next);
  }
}

// Export a singleton instance
module.exports = new ErrorHandler();