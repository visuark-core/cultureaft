const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

class UserAuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
    this.jwtExpiry = process.env.JWT_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
    this.maxRefreshTokens = 5; // Maximum refresh tokens per user
  }

  /**
   * Generate JWT access token
   * @param {Object} payload - Token payload
   * @returns {String} JWT token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiry,
      issuer: 'culturaft-app',
      audience: 'users'
    });
  }

  /**
   * Generate JWT refresh token
   * @param {Object} payload - Token payload
   * @returns {String} JWT refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'culturaft-app',
      audience: 'users'
    });
  }

  /**
   * Verify JWT access token
   * @param {String} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'culturaft-app',
        audience: 'users'
      });
    } catch (error) {
      throw new Error(`Invalid access token: ${error.message}`);
    }
  }

  /**
   * Verify JWT refresh token
   * @param {String} token - JWT refresh token to verify
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.jwtRefreshSecret, {
        issuer: 'culturaft-app',
        audience: 'users'
      });
    } catch (error) {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @param {String} ipAddress - Client IP address
   * @param {String} userAgent - Client user agent
   * @returns {Object} Registration result
   */
  async registerUser(userData, ipAddress, userAgent) {
    try {
      const { firstName, lastName, email, password, phone } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Generate customer ID
      const customerId = `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create new user
      const user = new User({
        customerId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: password,
        phone: phone?.trim(),
        registrationDate: new Date(),
        activity: {
          lastLogin: null,
          loginCount: 0,
          pageViews: 0,
          sessionDuration: 0,
          lastPageVisited: null,
          deviceInfo: {
            userAgent,
            browser: this.extractBrowser(userAgent),
            os: this.extractOS(userAgent),
            device: this.extractDevice(userAgent)
          },
          ipAddresses: [{
            ip: ipAddress,
            timestamp: new Date()
          }],
          failedLoginAttempts: 0,
          lastFailedLogin: null
        }
      });

      // Generate email verification token
      const emailVerificationToken = user.generateEmailVerificationToken();

      await user.save();

      // Log registration event
      await this.logUserEvent('USER_REGISTERED', user._id, {
        ipAddress,
        userAgent,
        email: user.email
      });

      return {
        success: true,
        user: {
          id: user._id,
          customerId: user.customerId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified
        },
        emailVerificationToken,
        message: 'User registered successfully. Please verify your email.'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Authenticate user with email and password
   * @param {String} email - User email
   * @param {String} password - User password
   * @param {String} ipAddress - Client IP address
   * @param {String} userAgent - Client user agent
   * @returns {Object} Authentication result with tokens
   */
  async authenticateUser(email, password, ipAddress, userAgent) {
    try {
      // Find user by email (include password for comparison)
      const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
      
      if (!user) {
        await this.logUserEvent('LOGIN_FAILED', null, { 
          email, 
          reason: 'User not found',
          ipAddress,
          userAgent 
        });
        throw new Error('Invalid credentials');
      }

      // Check if account is suspended
      if (user.status === 'suspended') {
        await this.logUserEvent('LOGIN_BLOCKED', user._id, { 
          reason: 'Account suspended',
          ipAddress,
          userAgent 
        });
        throw new Error('Account is temporarily suspended');
      }

      // Check if account is active
      if (user.status !== 'active') {
        await this.logUserEvent('LOGIN_BLOCKED', user._id, { 
          reason: 'Account inactive',
          ipAddress,
          userAgent 
        });
        throw new Error('Account is not active');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        user.incrementFailedLoginAttempts();
        await user.save();
        
        await this.logUserEvent('LOGIN_FAILED', user._id, { 
          reason: 'Invalid password',
          ipAddress,
          userAgent 
        });
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      user.resetFailedLoginAttempts();

      // Generate tokens
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: 'user'
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken({ userId: user._id });

      // Store refresh token
      user.addRefreshToken(refreshToken, {
        userAgent,
        ipAddress
      });

      // Update user activity
      user.updateActivity({
        login: true,
        ipAddress,
        deviceInfo: {
          userAgent,
          browser: this.extractBrowser(userAgent),
          os: this.extractOS(userAgent),
          device: this.extractDevice(userAgent)
        }
      });

      await user.save();

      // Log successful login
      await this.logUserEvent('LOGIN_SUCCESS', user._id, { 
        ipAddress,
        userAgent 
      });

      return {
        success: true,
        user: {
          id: user._id,
          customerId: user.customerId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          preferences: user.preferences,
          lastLogin: user.activity.lastLogin
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: this.jwtExpiry
        }
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {String} refreshToken - Valid refresh token
   * @param {String} ipAddress - Client IP address
   * @returns {Object} New access token
   */
  async refreshAccessToken(refreshToken, ipAddress) {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Find user
      const user = await User.findById(decoded.userId);
      
      if (!user || user.status !== 'active') {
        throw new Error('Invalid refresh token');
      }

      // Check if refresh token exists in user's tokens
      if (!user.verifyRefreshToken(refreshToken)) {
        await this.logUserEvent('TOKEN_REFRESH_FAILED', user._id, { 
          reason: 'Token not found or expired',
          ipAddress 
        });
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: 'user'
      };

      const newAccessToken = this.generateAccessToken(tokenPayload);

      // Update last activity
      user.updateActivity({ ipAddress });
      await user.save();

      // Log token refresh
      await this.logUserEvent('TOKEN_REFRESHED', user._id, { ipAddress });

      return {
        success: true,
        accessToken: newAccessToken,
        expiresIn: this.jwtExpiry
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user and invalidate tokens
   * @param {String} userId - User ID
   * @param {String} refreshToken - Refresh token to invalidate
   * @param {String} ipAddress - Client IP address
   * @returns {Object} Logout result
   */
  async logoutUser(userId, refreshToken, ipAddress) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Remove specific refresh token or all tokens
      if (refreshToken) {
        user.removeRefreshToken(refreshToken);
      } else {
        user.clearAllRefreshTokens();
      }

      await user.save();

      // Log logout event
      await this.logUserEvent('LOGOUT', userId, { ipAddress });

      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Initiate password reset
   * @param {String} identifier - Email or phone number
   * @param {String} method - 'email' or 'sms'
   * @param {String} ipAddress - Client IP address
   * @returns {Object} Password reset result
   */
  async initiatePasswordReset(identifier, method, ipAddress) {
    try {
      let user;
      
      // Find user by email or phone
      if (method === 'email') {
        user = await User.findOne({ email: identifier.toLowerCase() });
      } else if (method === 'sms') {
        user = await User.findOne({ phone: identifier });
      }

      if (!user) {
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message: `If an account exists with this ${method === 'email' ? 'email' : 'phone number'}, you will receive a reset ${method === 'email' ? 'link' : 'code'}.`
        };
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken(method);
      await user.save();

      // Log password reset initiation
      await this.logUserEvent('PASSWORD_RESET_INITIATED', user._id, {
        method,
        ipAddress
      });

      return {
        success: true,
        resetToken, // This would be sent via email/SMS in real implementation
        message: `Password reset ${method === 'email' ? 'link' : 'code'} sent successfully.`
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password using reset token
   * @param {String} token - Password reset token
   * @param {String} newPassword - New password
   * @param {String} ipAddress - Client IP address
   * @returns {Object} Password reset result
   */
  async resetPassword(token, newPassword, ipAddress) {
    try {
      // Find user with valid reset token
      const users = await User.find({
        'passwordResetToken.token': { $exists: true },
        'passwordResetToken.expiresAt': { $gt: new Date() }
      });

      let user = null;
      for (const u of users) {
        if (u.verifyPasswordResetToken(token)) {
          user = u;
          break;
        }
      }

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Update password
      user.passwordHash = newPassword; // Will be hashed by pre-save middleware
      user.clearPasswordResetToken();
      user.clearAllRefreshTokens(); // Force re-login on all devices

      await user.save();

      // Log password reset
      await this.logUserEvent('PASSWORD_RESET_COMPLETED', user._id, {
        ipAddress,
        strength: passwordValidation.strength
      });

      return {
        success: true,
        message: 'Password reset successfully. Please log in with your new password.'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email address
   * @param {String} token - Email verification token
   * @returns {Object} Verification result
   */
  async verifyEmail(token) {
    try {
      // Find user with valid email verification token
      const users = await User.find({
        'verificationTokens.email.token': { $exists: true },
        'verificationTokens.email.expiresAt': { $gt: new Date() }
      });

      let user = null;
      for (const u of users) {
        if (u.verifyEmailToken(token)) {
          user = u;
          break;
        }
      }

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      // Mark email as verified
      user.emailVerified = true;
      user.verificationTokens.email = undefined;

      await user.save();

      // Log email verification
      await this.logUserEvent('EMAIL_VERIFIED', user._id, {});

      return {
        success: true,
        message: 'Email verified successfully'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify phone number
   * @param {String} userId - User ID
   * @param {String} otp - Phone verification OTP
   * @returns {Object} Verification result
   */
  async verifyPhone(userId, otp) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.verifyPhoneToken(otp)) {
        throw new Error('Invalid or expired OTP');
      }

      // Mark phone as verified
      user.phoneVerified = true;
      user.verificationTokens.phone = undefined;

      await user.save();

      // Log phone verification
      await this.logUserEvent('PHONE_VERIFIED', user._id, {});

      return {
        success: true,
        message: 'Phone number verified successfully'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate password strength
   * @param {String} password - Password to validate
   * @returns {Object} Validation result
   */
  validatePassword(password) {
    const minLength = 8;
    const maxLength = 128;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (password.length > maxLength) {
      errors.push(`Password must not exceed ${maxLength} characters`);
    }
    
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  /**
   * Calculate password strength score
   * @param {String} password - Password to analyze
   * @returns {String} Password strength level
   */
  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 1; // Common sequences
    
    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    if (score < 7) return 'strong';
    return 'very-strong';
  }

  /**
   * Extract browser from user agent
   * @param {String} userAgent - User agent string
   * @returns {String} Browser name
   */
  extractBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown';
  }

  /**
   * Extract OS from user agent
   * @param {String} userAgent - User agent string
   * @returns {String} Operating system
   */
  extractOS(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Unknown';
  }

  /**
   * Extract device type from user agent
   * @param {String} userAgent - User agent string
   * @returns {String} Device type
   */
  extractDevice(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    
    return 'Desktop';
  }

  /**
   * Log user events for audit trail
   * @param {String} event - Event type
   * @param {String} userId - User ID
   * @param {Object} details - Event details
   */
  async logUserEvent(event, userId, details) {
    try {
      // In a real implementation, this would log to a user activity log
      // For now, we'll use console logging
      console.log(`User Event: ${event}`, {
        userId,
        timestamp: new Date().toISOString(),
        ...details
      });
    } catch (error) {
      // Silently fail logging to not interrupt main flow
      console.error('Failed to log user event:', error);
    }
  }
}

module.exports = new UserAuthService();