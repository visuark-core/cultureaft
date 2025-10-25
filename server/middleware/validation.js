/**
 * Validation middleware for analytics API endpoints
 */

// Validate query parameters for analytics endpoints
const validateAnalyticsQuery = (req, res, next) => {
  const { days, limit } = req.query;
  
  // Validate days parameter
  if (days !== undefined) {
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        success: false,
        message: 'Days parameter must be a number between 1 and 365',
        data: null
      });
    }
    req.query.days = daysNum;
  }
  
  // Validate limit parameter
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit parameter must be a number between 1 and 100',
        data: null
      });
    }
    req.query.limit = limitNum;
  }
  
  next();
};

// Sanitize string inputs to prevent injection attacks
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove potentially dangerous characters
  return str
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[{}]/g, '') // Remove curly braces
    .replace(/[$]/g, '') // Remove dollar signs (MongoDB operators)
    .trim();
};

// Validate date range parameters
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format. Use ISO 8601 format (YYYY-MM-DD)',
        data: null
      });
    }
    req.query.startDate = start;
  }
  
  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format. Use ISO 8601 format (YYYY-MM-DD)',
        data: null
      });
    }
    req.query.endDate = end;
  }
  
  // Validate date range logic
  if (startDate && endDate) {
    if (req.query.startDate >= req.query.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date',
        data: null
      });
    }
    
    // Prevent excessively large date ranges (more than 2 years)
    const daysDiff = (req.query.endDate - req.query.startDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 730) {
      return res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 2 years',
        data: null
      });
    }
  }
  
  next();
};

// Rate limiting for analytics endpoints
const analyticsRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting (in production, use Redis)
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 60; // Max 60 requests per minute
  
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }
  
  const clientData = global.rateLimitStore.get(clientIP) || { count: 0, resetTime: now + windowMs };
  
  // Reset counter if window has passed
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + windowMs;
  }
  
  clientData.count++;
  global.rateLimitStore.set(clientIP, clientData);
  
  if (clientData.count > maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      data: null,
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': maxRequests,
    'X-RateLimit-Remaining': Math.max(0, maxRequests - clientData.count),
    'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
  });
  
  next();
};

// Validate MongoDB ObjectId format
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
        data: null
      });
    }
    next();
  };
};

// General request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Sanitize query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = sanitizeString(req.query[key]);
    }
  }
  
  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  
  next();
};

// Error handling middleware for validation errors
const handleValidationError = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
      data: null
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format',
      data: null
    });
  }
  
  next(error);
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
};

module.exports = {
  validateAnalyticsQuery,
  validateDateRange,
  analyticsRateLimit,
  validateObjectId,
  sanitizeRequest,
  handleValidationError,
  securityHeaders,
  sanitizeString
};