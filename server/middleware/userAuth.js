const userAuthService = require('../services/userAuthService');
const User = require('../models/User');

/**
 * JWT Authentication Middleware for Users
 * Validates JWT token and attaches user to request
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        data: null
      });
    }

    // Verify token
    const decoded = userAuthService.verifyAccessToken(token);
    
    // Get user
    const user = await User.findById(decoded.userId);

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        data: null
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error('User authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      data: null
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user to request if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = userAuthService.verifyAccessToken(token);
        const user = await User.findById(decoded.userId);
        
        if (user && user.status === 'active') {
          req.user = user;
          req.userId = user._id;
        }
      } catch (error) {
        // Silently fail for optional auth
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Email Verification Required Middleware
 * Ensures user has verified their email address
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      data: null
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      data: {
        requiresEmailVerification: true
      }
    });
  }

  next();
};

/**
 * Phone Verification Required Middleware
 * Ensures user has verified their phone number
 */
const requirePhoneVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      data: null
    });
  }

  if (!req.user.phoneVerified) {
    return res.status(403).json({
      success: false,
      message: 'Phone verification required',
      data: {
        requiresPhoneVerification: true
      }
    });
  }

  next();
};

/**
 * Account Status Check Middleware
 * Ensures user account is in good standing
 */
const checkAccountStatus = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      data: null
    });
  }

  switch (req.user.status) {
    case 'active':
      next();
      break;
    case 'suspended':
      return res.status(403).json({
        success: false,
        message: 'Account is temporarily suspended',
        data: null
      });
    case 'banned':
      return res.status(403).json({
        success: false,
        message: 'Account has been banned',
        data: null
      });
    case 'pending_verification':
      return res.status(403).json({
        success: false,
        message: 'Account verification pending',
        data: {
          requiresVerification: true
        }
      });
    default:
      return res.status(403).json({
        success: false,
        message: 'Account is not active',
        data: null
      });
  }
};

/**
 * Session Validation Middleware
 * Validates that the user session is still active and updates activity
 */
const validateUserSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Update user activity
    const ipAddress = req.ip || req.connection.remoteAddress;
    req.user.updateActivity({
      pageView: req.originalUrl,
      ipAddress
    });

    // Save activity update (don't wait for it)
    req.user.save().catch(error => {
      console.error('Failed to update user activity:', error);
    });

    next();
  } catch (error) {
    console.error('Session validation error:', e