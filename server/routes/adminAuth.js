const express = require('express');
const rateLimit = require('express-rate-limit');
const authService = require('../services/authService');
const { body, validationResult } = require('express-validator');
const { authenticateAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password changes per hour
  message: {
    success: false,
    message: 'Too many password change attempts, please try again later'
  }
});

// Validation middleware
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

const passwordChangeValidation = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Helper function to get client info
const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
  userAgent: req.get('User-Agent') || 'unknown'
});

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @route   POST /api/admin/auth/login
// @desc    Admin login
// @access  Public
router.post('/login', authLimiter, loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    const result = await authService.adminLogin(email, password, ipAddress, userAgent);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: 15 * 60 // 15 minutes in seconds
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// @route   POST /api/admin/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
    }

    const { ipAddress, userAgent } = getClientInfo(req);
    const result = await authService.refreshAccessToken(refreshToken, ipAddress, userAgent);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        adminUser: result.adminUser
      }
    });

  } catch (error) {
    // Clear invalid refresh token cookie
    res.clearCookie('refreshToken');
    
    res.status(401).json({
      success: false,
      message: error.message || 'Token refresh failed'
    });
  }
});

// @route   POST /api/admin/auth/logout
// @desc    Admin logout
// @access  Private
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const { ipAddress, userAgent } = getClientInfo(req);

    await authService.logout(refreshToken, ipAddress, userAgent);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }
});

// @route   POST /api/admin/auth/logout-all
// @desc    Logout from all devices
// @access  Private (requires authentication middleware)
router.post('/logout-all', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.admin?.id; // Assuming auth middleware sets req.admin
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { ipAddress, userAgent } = getClientInfo(req);
    await authService.logoutFromAllDevices(adminId, ipAddress, userAgent);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Logout from all devices failed'
    });
  }
});

// @route   POST /api/admin/auth/change-password
// @desc    Change admin password
// @access  Private
router.post('/change-password', authenticateAdmin, passwordChangeLimiter, passwordChangeValidation, handleValidationErrors, async (req, res) => {
  try {
    const adminId = req.admin?.id;
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { currentPassword, newPassword } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    await authService.changePassword(adminId, currentPassword, newPassword, ipAddress, userAgent);

    // Clear all cookies to force re-login
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Password change failed'
    });
  }
});

// @route   GET /api/admin/auth/sessions
// @desc    Get active sessions
// @access  Private
router.get('/sessions', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.admin?.id;
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const sessions = await authService.getActiveSessions(adminId);

    res.json({
      success: true,
      message: 'Active sessions retrieved successfully',
      data: sessions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve sessions'
    });
  }
});

// @route   DELETE /api/admin/auth/sessions/:sessionId
// @desc    Revoke specific session
// @access  Private
router.delete('/sessions/:sessionId', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const { sessionId } = req.params;
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { ipAddress, userAgent } = getClientInfo(req);
    await authService.revokeSession(adminId, sessionId, ipAddress, userAgent);

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to revoke session'
    });
  }
});

// @route   GET /api/admin/auth/me
// @desc    Get current admin user info
// @access  Private
router.get('/me', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.admin?.id;
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get auth data from UserAuth model using email (since IDs don't match)
    const UserAuth = require('../models/UserAuth');
    const userAuth = await UserAuth.findOne({ email: req.admin.email }).select('-passwordHash -sessionTokens');

    if (!userAuth) {
      return res.status(404).json({
        success: false,
        message: 'User authentication not found'
      });
    }

    // Use the admin user from req.admin (already loaded by middleware)
    const adminUser = {
      _id: req.admin.id,
      email: req.admin.email,
      role: req.admin.role,
      fullName: req.admin.fullName,
      profile: {
        firstName: req.admin.fullName?.split(' ')[0] || '',
        lastName: req.admin.fullName?.split(' ').slice(1).join(' ') || ''
      }
    };

    res.json({
      success: true,
      message: 'Admin user info retrieved successfully',
      data: {
        id: userAuth._id,
        email: userAuth.email,
        fullName: adminUser.fullName || `${adminUser.profile?.firstName} ${adminUser.profile?.lastName}`,
        role: adminUser.role,
        profile: adminUser.profile,
        lastLogin: userAuth.lastLogin,
        isActive: userAuth.isActive && adminUser.isActive
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve admin user info'
    });
  }
});

module.exports = router;