const express = require('express');
const router = express.Router();
const userAuthService = require('../services/userAuthService');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting for authentication routes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Strict rate limiting for failed attempts
const strictAuthRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 failed attempts per hour
  message: {
    success: false,
    message: 'Too many failed attempts, please try again in an hour',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => res.statusCode < 400
});

/**
 * @route   POST /api/user-auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register',
  authRateLimit,
  [
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number')
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

      const { firstName, lastName, email, password, phone } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Validate password strength
      const passwordValidation = userAuthService.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          data: null,
          errors: passwordValidation.errors
        });
      }

      // Register user
      const result = await userAuthService.registerUser({
        firstName,
        lastName,
        email,
        password,
        phone
      }, ipAddress, userAgent);

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          emailVerificationRequired: true
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
        data: null
      });
    }
  }
);

/**
 * @route   POST /api/user-auth/login
 * @desc    User login with email and password
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

      // Authenticate user
      const result = await userAuthService.authenticateUser(
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
          user: result.user,
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
 * @route   POST /api/user-auth/refresh
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
      const result = await userAuthService.refreshAccessToken(refreshToken, ipAddress);

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
 * @route   POST /api/user-auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Private
 */
router.post('/logout',
  async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userId = req.body.userId; // This would come from auth middleware in real implementation

      if (userId) {
        // Logout user
        await userAuthService.logoutUser(userId, refreshToken, ipAddress);
      }

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
 * @route   POST /api/user-auth/forgot-password
 * @desc    Initiate password reset
 * @access  Public
 */
router.post('/forgot-password',
  authRateLimit,
  [
    body('identifier')
      .isLength({ min: 1 })
      .withMessage('Email or phone number is required'),
    body('method')
      .isIn(['email', 'sms'])
      .withMessage('Method must be either email or sms')
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

      const { identifier, method } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Validate identifier based on method
      if (method === 'email') {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(identifier)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address',
            data: null
          });
        }
      }

      // Initiate password reset
      const result = await userAuthService.initiatePasswordReset(
        identifier,
        method,
        ipAddress
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: null
      });

    } catch (error) {
      console.error('Password reset initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate password reset',
        data: null
      });
    }
  }
);

/**
 * @route   POST /api/user-auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
router.post('/reset-password',
  authRateLimit,
  [
    body('token')
      .isLength({ min: 1 })
      .withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
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

      const { token, newPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Validate new password
      const passwordValidation = userAuthService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          data: null,
          errors: passwordValidation.errors
        });
      }

      // Reset password
      const result = await userAuthService.resetPassword(
        token,
        newPassword,
        ipAddress
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: null
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Password reset failed',
        data: null
      });
    }
  }
);

/**
 * @route   POST /api/user-auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email',
  [
    body('token')
      .isLength({ min: 1 })
      .withMessage('Verification token is required')
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

      const { token } = req.body;

      // Verify email
      const result = await userAuthService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: result.message,
        data: null
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Email verification failed',
        data: null
      });
    }
  }
);

/**
 * @route   POST /api/user-auth/verify-phone
 * @desc    Verify phone number
 * @access  Private
 */
router.post('/verify-phone',
  [
    body('userId')
      .isLength({ min: 1 })
      .withMessage('User ID is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
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

      const { userId, otp } = req.body;

      // Verify phone
      const result = await userAuthService.verifyPhone(userId, otp);

      res.status(200).json({
        success: true,
        message: result.message,
        data: null
      });

    } catch (error) {
      console.error('Phone verification error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Phone verification failed',
        data: null
      });
    }
  }
);

/**
 * @route   POST /api/user-auth/validate-password
 * @desc    Validate password strength
 * @access  Public
 */
router.post('/validate-password',
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
      const validation = userAuthService.validatePassword(password);

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

module.exports = router;