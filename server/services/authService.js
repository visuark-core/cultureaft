const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AdminUser } = require('../models/AdminUser');

class AuthService {
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
      issuer: 'admin-system',
      audience: 'admin-users'
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
      issuer: 'admin-system',
      audience: 'admin-users'
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
        issuer: 'admin-system',
        audience: 'admin-users'
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
        issuer: 'admin-system',
        audience: 'admin-users'
      });
    } catch (error) {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
  }

  /**
   * Authenticate admin user with email and password
   * @param {String} email - Admin email
   * @param {String} password - Admin password
   * @param {String} ipAddress - Client IP address
   * @param {String} userAgent - Client user agent
   * @returns {Object} Authentication result with tokens
   */
  async authenticateAdmin(email, password, ipAddress, userAgent) {
    try {
      // Find admin user by email
      const admin = await AdminUser.findByEmail(email);
      
      if (!admin) {
        await this.logSecurityEvent('LOGIN_FAILED', null, { 
          email, 
          reason: 'User not found',
          ipAddress,
          userAgent 
        });
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (admin.isLocked) {
        await this.logSecurityEvent('LOGIN_BLOCKED', admin._id, { 
          reason: 'Account locked',
          ipAddress,
          userAgent 
        });
        throw new Error('Account is temporarily locked due to multiple failed login attempts');
      }

      // Check if account is active
      if (!admin.isActive) {
        await this.logSecurityEvent('LOGIN_BLOCKED', admin._id, { 
          reason: 'Account inactive',
          ipAddress,
          userAgent 
        });
        throw new Error('Account is inactive');
      }

      // Verify password
      const isPasswordValid = await admin.comparePassword(password);
      
      if (!isPasswordValid) {
        await admin.incrementLoginAttempts();
        await this.logSecurityEvent('LOGIN_FAILED', admin._id, { 
          reason: 'Invalid password',
          ipAddress,
          userAgent 
        });
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      await admin.resetLoginAttempts();

      // Generate tokens
      const tokenPayload = {
        adminId: admin._id,
        email: admin.email,
        role: admin.role.name,
        level: admin.role.level,
        permissions: admin.role.permissions
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken({ adminId: admin._id });

      // Store refresh token in database
      await this.storeRefreshToken(admin._id, refreshToken);

      // Update admin activity
      await admin.updateActivity(ipAddress);
      admin.security.lastLogin = new Date();
      await admin.save();

      // Log successful login
      await this.logSecurityEvent('LOGIN_SUCCESS', admin._id, { 
        ipAddress,
        userAgent 
      });

      return {
        success: true,
        admin: {
          id: admin._id,
          email: admin.email,
          profile: admin.profile,
          role: admin.role,
          lastLogin: admin.security.lastLogin
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
      
      // Find admin user
      const admin = await AdminUser.findById(decoded.adminId).populate('role');
      
      if (!admin || !admin.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Check if refresh token exists in database
      const tokenExists = admin.security.refreshTokens.some(
        token => token.token === refreshToken
      );

      if (!tokenExists) {
        await this.logSecurityEvent('TOKEN_REFRESH_FAILED', admin._id, { 
          reason: 'Token not found in database',
          ipAddress 
        });
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const tokenPayload = {
        adminId: admin._id,
        email: admin.email,
        role: admin.role.name,
        level: admin.role.level,
        permissions: admin.role.permissions
      };

      const newAccessToken = this.generateAccessToken(tokenPayload);

      // Update last activity
      await admin.updateActivity(ipAddress);

      // Log token refresh
      await this.logSecurityEvent('TOKEN_REFRESHED', admin._id, { ipAddress });

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
   * Logout admin user and invalidate tokens
   * @param {String} adminId - Admin user ID
   * @param {String} refreshToken - Refresh token to invalidate
   * @param {String} ipAddress - Client IP address
   * @returns {Object} Logout result
   */
  async logoutAdmin(adminId, refreshToken, ipAddress) {
    try {
      const admin = await AdminUser.findById(adminId);
      
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Remove specific refresh token
      if (refreshToken) {
        admin.security.refreshTokens = admin.security.refreshTokens.filter(
          token => token.token !== refreshToken
        );
      } else {
        // Remove all refresh tokens (logout from all devices)
        admin.security.refreshTokens = [];
      }

      await admin.save();

      // Log logout event
      await this.logSecurityEvent('LOGOUT', adminId, { ipAddress });

      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Store refresh token in database
   * @param {String} adminId - Admin user ID
   * @param {String} refreshToken - Refresh token to store
   */
  async storeRefreshToken(adminId, refreshToken) {
    const admin = await AdminUser.findById(adminId);
    
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Remove expired tokens and limit active tokens
    const now = new Date();
    admin.security.refreshTokens = admin.security.refreshTokens
      .filter(token => token.createdAt > new Date(now - 7 * 24 * 60 * 60 * 1000)) // Keep only tokens from last 7 days
      .slice(-(this.maxRefreshTokens - 1)); // Keep only latest tokens

    // Add new refresh token
    admin.security.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date()
    });

    await admin.save();
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
   * Log security events for audit trail with enhanced details
   * @param {String} event - Event type
   * @param {String} adminId - Admin user ID
   * @param {Object} details - Event details
   */
  async logSecurityEvent(event, adminId, details) {
    try {
      const AuditLog = require('../models/AuditLog');
      
      await AuditLog.logAction({
        adminId,
        action: event,
        resource: details.resource || 'auth',
        resourceId: details.resourceId || adminId,
        changes: {
          event,
          ...details
        },
        metadata: {
          source: 'authService',
          timestamp: new Date(),
          ...details.metadata
        },
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        method: details.method,
        endpoint: details.url || details.endpoint,
        requestId: details.requestId,
        severity: details.severity || this.getEventSeverity(event),
        status: details.success !== false ? 'success' : 'failed',
        errorMessage: details.errorMessage || details.reason
      });
    } catch (error) {
      // Silently fail in test environment or if AuditLog is not available
      if (process.env.NODE_ENV !== 'test') {
        console.error('Failed to log security event:', error);
      }
    }
  }

  /**
   * Get event severity level
   * @param {String} event - Event type
   * @returns {String} Severity level
   */
  getEventSeverity(event) {
    const severityMap = {
      'LOGIN_SUCCESS': 'low',
      'LOGIN_FAILED': 'medium',
      'LOGIN_BLOCKED': 'high',
      'TOKEN_REFRESHED': 'low',
      'TOKEN_REFRESH_FAILED': 'medium',
      'LOGOUT': 'low',
      'PASSWORD_CHANGED': 'medium',
      'ACCOUNT_LOCKED': 'high',
      'SUSPICIOUS_ACTIVITY': 'critical'
    };
    
    return severityMap[event] || 'medium';
  }

  /**
   * Change admin password
   * @param {String} adminId - Admin user ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @param {String} ipAddress - Client IP address
   * @returns {Object} Password change result
   */
  async changePassword(adminId, currentPassword, newPassword, ipAddress) {
    try {
      const admin = await AdminUser.findById(adminId);
      
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        await this.logSecurityEvent('PASSWORD_CHANGE_FAILED', adminId, { 
          reason: 'Invalid current password',
          ipAddress 
        });
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Update password
      admin.passwordHash = newPassword; // Will be hashed by pre-save middleware
      admin.security.passwordChangedAt = new Date();
      
      // Invalidate all refresh tokens to force re-login
      admin.security.refreshTokens = [];
      
      await admin.save();

      // Log password change
      await this.logSecurityEvent('PASSWORD_CHANGED', adminId, { 
        ipAddress,
        strength: passwordValidation.strength 
      });

      return {
        success: true,
        message: 'Password changed successfully. Please log in again.'
      };

    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();