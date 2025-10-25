/**
 * Enhanced Authentication Middleware
 * Provides secure authentication with token validation and refresh mechanisms
 */

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { validateJWT } = require('../utils/validation');
const securityLogger = require('../utils/securityLogger');

// Token blacklist (in production, use Redis)
const tokenBlacklist = new Set();

/**
 * Enhanced JWT verification with security checks
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await securityLogger.logUnauthorizedAccess(req);
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        data: null
      });
    }
    
    const token = authHeader.substring(7);
    
    // Validate token format
    try {
      validateJWT(token);
    } catch (error) {
      await securityLogger.logSuspiciousActivity('INVALID_TOKEN_FORMAT', {
        token: token.substring(0, 20) + '...',
        error: error.message
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        data: null
      });
    }
    
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      await securityLogger.logSuspiciousActivity('BLACKLISTED_TOKEN_USED', {
        token: token.substring(0, 20) + '...'
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        data: null
      });
    }
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token expiration with buffer
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 300; // 5 minutes buffer
    
    if (decoded.exp && decoded.exp - bufferTime <= now) {
      await securityLogger.logSecurityEvent('TOKEN_NEAR_EXPIRY', {
        userId: decoded.userId,
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      }, req);
      
      // Add header to indicate token needs refresh
      res.setHeader('X-Token-Refresh-Required', 'true');
    }
    
    // Validate user ID format
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      await securityLogger.logSuspiciousActivity('INVALID_TOKEN_PAYLOAD', {
        payload: decoded
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
        data: null
      });
    }
    
    // Add user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      tokenIssuedAt: decoded.iat,
      tokenExpiresAt: decoded.exp
    };
    
    // Log successful authentication
    await securityLogger.logSecurityEvent('SUCCESSFUL_AUTHENTICATION', {
      userId: decoded.userId,
      email: decoded.email,
      ip: req.ip
    }, req);
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      await securityLogger.logSuspiciousActivity('INVALID_JWT', {
        error: error.message
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        data: null
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      await securityLogger.logSecurityEvent('EXPIRED_TOKEN', {
        expiredAt: error.expiredAt
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        data: null,
        code: 'TOKEN_EXPIRED'
      });
    }
    
    await securityLogger.logError(error, req);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      data: null
    });
  }
};

/**
 * Optional authentication middleware
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  // Use the same verification logic but don't fail if token is invalid
  try {
    await verifyToken(req, res, () => {});
  } catch (error) {
    // Log but don't fail the request
    await securityLogger.logSecurityEvent('OPTIONAL_AUTH_FAILED', {
      error: error.message
    }, req);
  }
  
  next();
};

/**
 * Role-based authorization middleware
 */
const requireRole = (roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        data: null
      });
    }
    
    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      await securityLogger.logUnauthorizedAccess(req);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        data: null
      });
    }
    
    next();
  };
};

/**
 * Token refresh endpoint with enhanced security
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
        data: null
      });
    }
    
    // Validate refresh token format
    try {
      validateJWT(refreshToken);
    } catch (error) {
      await securityLogger.logSuspiciousActivity('INVALID_REFRESH_TOKEN_FORMAT', {
        error: error.message
      }, req);
      return res.status(400).json({
        success: false,
        message: 'Invalid refresh token format',
        data: null
      });
    }
    
    // Check if refresh token is blacklisted
    if (tokenBlacklist.has(refreshToken)) {
      await securityLogger.logSuspiciousActivity('BLACKLISTED_REFRESH_TOKEN_USED', {
        token: refreshToken.substring(0, 20) + '...'
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked',
        data: null
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Generate new access token
    const accessTokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    const newAccessToken = jwt.sign(
      accessTokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // Optionally generate new refresh token (token rotation)
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, role: decoded.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // Blacklist old refresh token
    tokenBlacklist.add(refreshToken);
    
    // Log token refresh
    await securityLogger.logSecurityEvent('TOKEN_REFRESHED', {
      userId: decoded.userId,
      email: decoded.email
    }, req);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900 // 15 minutes
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      await securityLogger.logSuspiciousActivity('INVALID_REFRESH_JWT', {
        error: error.message
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        data: null
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      await securityLogger.logSecurityEvent('EXPIRED_REFRESH_TOKEN', {
        expiredAt: error.expiredAt
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired',
        data: null
      });
    }
    
    await securityLogger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      data: null
    });
  }
};

/**
 * Logout endpoint with token blacklisting
 */
const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      tokenBlacklist.add(token);
    }
    
    const { refreshToken } = req.body;
    if (refreshToken) {
      tokenBlacklist.add(refreshToken);
    }
    
    // Log logout
    if (req.user) {
      await securityLogger.logSecurityEvent('USER_LOGOUT', {
        userId: req.user.id,
        email: req.user.email
      }, req);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully',
      data: null
    });
  } catch (error) {
    await securityLogger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      data: null
    });
  }
};

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await securityLogger.logRateLimitExceeded(req);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      data: null
    });
  }
});

/**
 * Strict rate limiting for sensitive operations
 */
const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per hour
  message: {
    success: false,
    message: 'Too many attempts for this operation, please try again later.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await securityLogger.logRateLimitExceeded(req);
    res.status(429).json({
      success: false,
      message: 'Too many attempts for this operation, please try again later.',
      data: null
    });
  }
});

/**
 * Clean up expired tokens from blacklist periodically
 */
const cleanupBlacklist = () => {
  // In a real application, you would implement proper cleanup logic
  // For now, we'll clear the entire blacklist periodically
  if (tokenBlacklist.size > 10000) {
    tokenBlacklist.clear();
  }
};

// Clean up blacklist every hour
setInterval(cleanupBlacklist, 60 * 60 * 1000);

module.exports = {
  verifyToken,
  optionalAuth,
  requireRole,
  refreshToken,
  logout,
  authRateLimit,
  strictRateLimit,
  tokenBlacklist
};