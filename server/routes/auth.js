const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { 
  authenticateToken, 
  authRateLimit, 
  strictAuthRateLimit,
  auditLogger,
  validateSession
} = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/**
 * @route   POST /api/auth/login
 * @desc    Admin login with email and password
 * @access  Public
 */
router.post('/login', 
  strictAuthRateLimit,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          data: null,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Authenticate admin
      const result = await authService.authenticateAdmin(
        email, 
        password, 
        ipAddress, 
        userAgent
      );

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          admin: result.admin,
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
        data: null
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh',
  authRateLimit,
  async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required',
          data: null
        });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      
      // Refresh access token
      const result = await authService.refreshAccessToken(refreshToken, ipAddress);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Clear invalid refresh token cookie
      res.clearCookie('refreshToken');
      
      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed',
        data: null
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout admin and invalidate refresh token
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  validateSession,
  auditLogger('LOGOUT', 'authentication'),
  async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Logout admin
      await authService.logoutAdmin(req.adminId, refreshToken, ipAddress);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logout successful',
        data: null
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Logout failed',
        data: null
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices (invalidate all refresh tokens)
 * @access  Private
 */
router.post('/logout-all',
  authenticateToken,
  validateSession,
  auditLogger('LOGOUT_ALL', 'authentication'),
  async (req, res) => {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Logout from all devices
      await authService.logoutAdmin(req.adminId, null, ipAddress);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
        data: null
      });

    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Logout failed',
        data: null
      });
    }
  }
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change admin password
 * @access  Private
 */
router.post('/change-password',
  authenticateToken,
  validateSession,
  [
    body('currentPassword')
      .isLength({ min: 1 })
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
  ],
  auditLogger('PASSWORD_CHANGE', 'authentication'),
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          data: null,
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Change password
      const result = await authService.changePassword(
        req.adminId,
        currentPassword,
        newPassword,
        ipAddress
      );

      // Clear all refresh tokens (force re-login)
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: result.message,
        data: null
      });

    } catch (error) {
      console.error('Password change error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Password change failed',
        data: null
      });
    }
  }
);

/**
 * @route   POST /api/auth/validate-password
 * @desc    Validate password strength
 * @access  Private
 */
router.post('/validate-password',
  authenticateToken,
  [
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          data: null,
          errors: errors.array()
        });
      }

      const { password } = req.body;
      
      // Validate password
      const validation = authService.validatePassword(password);

      res.status(200).json({
        success: true,
        message: 'Password validation completed',
        data: validation
      });

    } catch (error) {
      console.error('Password validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Password validation failed',
        data: null
      });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current admin profile
 * @access  Private
 */
router.get('/me',
  authenticateToken,
  validateSession,
  async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Admin profile retrieved successfully',
        data: {
          admin: {
            id: req.admin._id,
            email: req.admin.email,
            profile: req.admin.profile,
            role: req.admin.role,
            security: {
              lastLogin: req.admin.security.lastLogin,
              mfaEnabled: req.admin.security.mfaEnabled
            },
            audit: {
              lastActivity: req.admin.audit.lastActivity,
              sessionCount: req.admin.audit.sessionCount
            },
            isActive: req.admin.isActive
          }
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin profile',
        data: null
      });
    }
  }
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if access token is valid
 * @access  Private
 */
router.get('/verify',
  authenticateToken,
  validateSession,
  async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          adminId: req.admin._id,
          email: req.admin.email,
          role: req.admin.role.name,
          permissions: req.admin.role.permissions,
          isActive: req.admin.isActive
        }
      });

    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Token verification failed',
        data: null
      });
    }
  }
);

module.exports = router;