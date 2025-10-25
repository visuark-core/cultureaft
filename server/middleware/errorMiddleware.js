const { logManager } = require('../utils/logger');
const ErrorHandler = require('../utils/errorHandler');
const crypto = require('crypto');

/**
 * Middleware to add correlation IDs to requests for error tracking
 */
const addCorrelationId = (req, res, next) => {
  // Check if correlation ID already exists in headers
  let correlationId = req.headers['x-correlation-id'];
  
  // Generate new correlation ID if not provided
  if (!correlationId) {
    correlationId = crypto.randomBytes(16).toString('hex');
  }
  
  // Add correlation ID to request and response headers
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Set correlation ID in logger context
  logManager.setCorrelationId(correlationId);
  
  next();
};

/**
 * Enhanced error metrics collection middleware
 */
const collectErrorMetrics = (err, req, res, next) => {
  // Collect metrics about the error
  const errorMetrics = {
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode || 500,
    errorType: err.name,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    responseTime: Date.now() - req.startTime
  };

  // Log metrics for monitoring systems
  logManager.info('Error metrics collected', { metrics: errorMetrics });

  next(err);
};

/**
 * Request timing middleware for performance monitoring
 */
const addRequestTiming = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

/**
 * Enhanced global error middleware with sanitization and security
 */
const enhancedErrorHandler = (err, req, res, next) => {
  // Ensure correlation ID is present
  if (!req.correlationId) {
    req.correlationId = crypto.randomBytes(16).toString('hex');
    res.setHeader('X-Correlation-ID', req.correlationId);
  }

  // Collect error metrics before handling
  collectErrorMetrics(err, req, res, () => {
    // Use the enhanced ErrorHandler to process the error
    ErrorHandler.handle(err, req, res, next);
  });
};

/**
 * Middleware to sanitize error responses for security
 */
const sanitizeErrorResponse = (err, req, res, next) => {
  // Remove sensitive information from error messages in production
  if (process.env.NODE_ENV === 'production') {
    // List of sensitive patterns to remove from error messages
    const sensitivePatterns = [
      /mongodb:\/\/[^@]*@[^\s]*/gi, // MongoDB connection strings
      /mysql:\/\/[^@]*@[^\s]*/gi,   // MySQL connection strings
      /postgres:\/\/[^@]*@[^\s]*/gi, // PostgreSQL connection strings
      /redis:\/\/[^@]*@[^\s]*/gi,   // Redis connection strings
      /\/[a-zA-Z]:\\/gi,      // Windows file paths
      /\/home\/[^\/\s]*/gi,   // Unix home directories
      /\/var\/[^\/\s]*/gi,    // Unix var directories
      /process\.env\.[A-Z_]+/gi, // Environment variable references
      /password/gi,
      /token/gi,
      /secret/gi,
      /key/gi
    ];

    // Sanitize error message
    if (err.message) {
      sensitivePatterns.forEach(pattern => {
        err.message = err.message.replace(pattern, '[REDACTED]');
      });
    }

    // Sanitize stack trace
    if (err.stack) {
      sensitivePatterns.forEach(pattern => {
        err.stack = err.stack.replace(pattern, '[REDACTED]');
      });
    }
  }

  next(err);
};

/**
 * Middleware to handle unhandled promise rejections
 */
const handleUnhandledRejections = () => {
  process.on('unhandledRejection', (reason, promise) => {
    const error = new Error(`Unhandled Promise Rejection: ${reason}`);
    error.stack = reason.stack || error.stack;
    
    logManager.error('Unhandled Promise Rejection detected', error, {
      promise: promise.toString(),
      reason: reason.toString()
    });

    // In production, we might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      console.error('Unhandled Promise Rejection. Shutting down gracefully...');
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error) => {
    logManager.error('Uncaught Exception detected', error, {
      fatal: true
    });

    // Always exit on uncaught exceptions
    console.error('Uncaught Exception. Shutting down immediately...');
    process.exit(1);
  });
};

/**
 * Middleware to add security headers to error responses
 */
const addSecurityHeaders = (err, req, res, next) => {
  // Add security headers to prevent information disclosure
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next(err);
};

/**
 * Middleware to log request completion for monitoring
 */
const logRequestCompletion = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  // Override res.send to log completion
  res.send = function(data) {
    const responseTime = Date.now() - req.startTime;
    
    logManager.info('Request completed', {
      correlationId: req.correlationId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      contentLength: data ? data.length : 0
    });

    return originalSend.call(this, data);
  };

  // Override res.json to log completion
  res.json = function(data) {
    const responseTime = Date.now() - req.startTime;
    
    logManager.info('Request completed', {
      correlationId: req.correlationId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      dataSize: JSON.stringify(data).length
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Create a comprehensive error handling middleware stack
 */
const createErrorMiddlewareStack = () => {
  return [
    addRequestTiming,
    addCorrelationId,
    logRequestCompletion,
    // Error handling middleware (these run when errors occur)
    addSecurityHeaders,
    sanitizeErrorResponse,
    enhancedErrorHandler
  ];
};

module.exports = {
  addCorrelationId,
  collectErrorMetrics,
  addRequestTiming,
  enhancedErrorHandler,
  sanitizeErrorResponse,
  handleUnhandledRejections,
  addSecurityHeaders,
  logRequestCompletion,
  createErrorMiddlewareStack
};