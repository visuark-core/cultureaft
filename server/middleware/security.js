/**
 * Enhanced Security Middleware
 * Comprehensive security measures for production deployment
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { validateIP, sanitizeInput } = require('../utils/validation');
const securityLogger = require('../utils/securityLogger');

// IP whitelist for admin operations (in production, use environment variables)
const adminWhitelist = process.env.ADMIN_IP_WHITELIST 
  ? process.env.ADMIN_IP_WHITELIST.split(',').map(ip => ip.trim())
  : [];

// Suspicious IP tracking
const suspiciousIPs = new Map();
const blockedIPs = new Set();

/**
 * Advanced input sanitization middleware
 */
const advancedSanitization = (req, res, next) => {
  try {
    // Sanitize all string inputs
    const sanitizeRecursive = (obj) => {
      if (typeof obj === 'string') {
        return sanitizeInput(obj, {
          allowHtml: false,
          maxLength: 10000,
          removeScripts: true,
          removeEvents: true
        });
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeRecursive);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          // Sanitize keys as well
          const sanitizedKey = sanitizeInput(key, { allowHtml: false, maxLength: 100 });
          sanitized[sanitizedKey] = sanitizeRecursive(value);
        }
        return sanitized;
      }
      
      return obj;
    };
    
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeRecursive(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeRecursive(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeRecursive(req.params);
    }
    
    next();
  } catch (error) {
    securityLogger.logError(error, req);
    res.status(400).json({
      success: false,
      message: 'Invalid input data',
      data: null
    });
  }
};

/**
 * SQL Injection detection middleware
 */
const sqlInjectionDetection = async (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /('|(\\')|(;)|(--)|(\s*\/\*)|(\*\/\s*))/i,
    /(\b(WAITFOR|DELAY)\b)/i,
    /(\b(CAST|CONVERT|SUBSTRING|ASCII|CHAR)\b)/i
  ];
  
  const checkForSQLInjection = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };
  
  const checkObject = (obj) => {
    if (typeof obj === 'string') {
      return checkForSQLInjection(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkObject);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkObject);
    }
    
    return false;
  };
  
  const hasSQLInjection = [
    req.originalUrl,
    JSON.stringify(req.query),
    JSON.stringify(req.body),
    JSON.stringify(req.params)
  ].some(checkForSQLInjection) || checkObject(req.body) || checkObject(req.query);
  
  if (hasSQLInjection) {
    await securityLogger.logSuspiciousActivity('SQL_INJECTION_ATTEMPT', {
      url: req.originalUrl,
      query: req.query,
      body: req.body,
      params: req.params
    }, req);
    
    // Track suspicious IP
    trackSuspiciousIP(req.ip, 'SQL_INJECTION');
    
    return res.status(400).json({
      success: false,
      message: 'Invalid request format',
      data: null
    });
  }
  
  next();
};

/**
 * XSS detection middleware
 */
const xssDetection = async (req, res, next) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi,
    /<svg[^>]*onload[^>]*>/gi
  ];
  
  const checkForXSS = (value) => {
    if (typeof value === 'string') {
      return xssPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };
  
  const checkObject = (obj) => {
    if (typeof obj === 'string') {
      return checkForXSS(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkObject);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkObject);
    }
    
    return false;
  };
  
  const hasXSS = checkObject(req.body) || checkObject(req.query) || checkObject(req.params);
  
  if (hasXSS) {
    await securityLogger.logSuspiciousActivity('XSS_ATTEMPT', {
      url: req.originalUrl,
      query: req.query,
      body: req.body,
      params: req.params
    }, req);
    
    // Track suspicious IP
    trackSuspiciousIP(req.ip, 'XSS');
    
    return res.status(400).json({
      success: false,
      message: 'Invalid request content',
      data: null
    });
  }
  
  next();
};

/**
 * Track suspicious IP addresses
 */
const trackSuspiciousIP = (ip, reason) => {
  if (!suspiciousIPs.has(ip)) {
    suspiciousIPs.set(ip, { count: 0, reasons: [], firstSeen: Date.now() });
  }
  
  const record = suspiciousIPs.get(ip);
  record.count++;
  record.reasons.push({ reason, timestamp: Date.now() });
  record.lastSeen = Date.now();
  
  // Block IP if too many suspicious activities
  if (record.count >= 5) {
    blockedIPs.add(ip);
    securityLogger.logSecurityEvent('IP_BLOCKED', {
      ip,
      count: record.count,
      reasons: record.reasons
    });
  }
};

/**
 * IP blocking middleware
 */
const ipBlocking = async (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (blockedIPs.has(clientIP)) {
    await securityLogger.logSuspiciousActivity('BLOCKED_IP_ACCESS_ATTEMPT', {
      ip: clientIP
    }, req);
    
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      data: null
    });
  }
  
  next();
};

/**
 * Admin IP whitelist middleware
 */
const adminIPWhitelist = async (req, res, next) => {
  if (adminWhitelist.length === 0) {
    return next(); // No whitelist configured
  }
  
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (!adminWhitelist.includes(clientIP)) {
    await securityLogger.logUnauthorizedAccess(req);
    return res.status(403).json({
      success: false,
      message: 'Access denied from this location',
      data: null
    });
  }
  
  next();
};

/**
 * Request size limiting middleware
 */
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = typeof maxSize === 'string' 
      ? parseInt(maxSize) * (maxSize.includes('mb') ? 1024 * 1024 : 1024)
      : maxSize;
    
    if (contentLength > maxBytes) {
      securityLogger.logSuspiciousActivity('OVERSIZED_REQUEST', {
        contentLength,
        maxAllowed: maxBytes
      }, req);
      
      return res.status(413).json({
        success: false,
        message: 'Request too large',
        data: null
      });
    }
    
    next();
  };
};

/**
 * Slow down middleware for brute force protection
 */
const bruteForceProtection = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // allow 2 requests per windowMs without delay
  delayMs: () => 500, // add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // max delay of 20 seconds
  skipSuccessfulRequests: true,
  validate: { delayMs: false } // disable delayMs validation warning
});

/**
 * File upload security middleware
 */
const fileUploadSecurity = (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }
  
  const files = req.files || [req.file];
  const dangerousTypes = [
    'application/x-executable',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-sh',
    'application/x-csh',
    'text/x-script',
    'application/javascript',
    'text/javascript'
  ];
  
  for (const file of files) {
    if (dangerousTypes.includes(file.mimetype)) {
      securityLogger.logSuspiciousActivity('DANGEROUS_FILE_UPLOAD', {
        filename: file.originalname,
        mimetype: file.mimetype
      }, req);
      
      return res.status(400).json({
        success: false,
        message: 'File type not allowed',
        data: null
      });
    }
  }
  
  next();
};

/**
 * Security headers middleware
 */
const enhancedSecurityHeaders = (req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Download-Options', 'noopen');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()'
  );
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://sheets.googleapis.com https://accounts.google.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'CultureAft');
  
  next();
};

/**
 * Clean up old suspicious IP records
 */
const cleanupSuspiciousIPs = () => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [ip, record] of suspiciousIPs.entries()) {
    if (now - record.lastSeen > maxAge) {
      suspiciousIPs.delete(ip);
      blockedIPs.delete(ip);
    }
  }
};

// Clean up every hour
setInterval(cleanupSuspiciousIPs, 60 * 60 * 1000);

module.exports = {
  advancedSanitization,
  sqlInjectionDetection,
  xssDetection,
  ipBlocking,
  adminIPWhitelist,
  requestSizeLimit,
  bruteForceProtection,
  fileUploadSecurity,
  enhancedSecurityHeaders,
  trackSuspiciousIP,
  suspiciousIPs,
  blockedIPs
};