const jwt = require('jsonwebtoken');
const UserAuth = require('../models/UserAuth');
const dataService = require('./dataService');
const SecurityLogger = require('../utils/securityLogger');

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET;
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
    this.ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
    this.REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token, isRefreshToken = false) {
    const secret = isRefreshToken ? this.JWT_REFRESH_SECRET : this.JWT_SECRET;
    return jwt.verify(token, secret);
  }

  /**
   * User login
   */
  async login(email, password, ipAddress = 'unknown', userAgent = 'unknown') {
    try {
      // Find user by email
      const user = await UserAuth.findActiveByEmail(email);
      
      if (!user) {
        SecurityLogger.logSecurityEvent('LOGIN_FAILED', {
          email,
          reason: 'User not found',
          ipAddress,
          userAgent
        });
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (user.isLocked) {
        SecurityLogger.logSecurityEvent('LOGIN_BLOCKED', {
          email,
          reason: 'Account locked',
          ipAddress,
          userAgent
        });
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        await user.incrementLoginAttempts();
        SecurityLogger.logSecurityEvent('LOGIN_FAILED', {
          email,
          reason: 'Invalid password',
          ipAddress,
          userAgent,
          loginAttempts: user.loginAttempts + 1
        });
        throw new Error('Invalid email or password');
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      // Store refresh token in user's session tokens
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await user.addSessionToken(refreshToken, refreshTokenExpiry, ipAddress, userAgent);

      // Update last activity
      await user.updateLastActivity(ipAddress);

      // Get user profile data
      let userProfile = null;
      try {
        if (user.role === 'admin' || user.role === 'super_admin') {
          // Get admin profile from MongoDB
          userProfile = await dataService.findAdminUserByEmail(user.email);
        } else {
          // Get customer profile from Google Sheets
          userProfile = await dataService.findCustomerByEmail(user.email);
        }
      } catch (error) {
        console.warn('Could not fetch user profile:', error.message);
      }

      SecurityLogger.logSecurityEvent('LOGIN_SUCCESS', {
        userId: user._id,
        email,
        role: user.role,
        ipAddress,
        userAgent
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: userProfile ? {
            firstName: userProfile.profile?.firstName,
            lastName: userProfile.profile?.lastName
          } : null
        }
      };

    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  }

  /**
   * Admin login (alias for login with role check)
   */
  async adminLogin(email, password, ipAddress = 'unknown', userAgent = 'unknown') {
    const result = await this.login(email, password, ipAddress, userAgent);
    
    if (!['admin', 'super_admin'].includes(result.user.role)) {
      SecurityLogger.logSecurityEvent('ADMIN_LOGIN_DENIED', {
        email,
        role: result.user.role,
        ipAddress,
        userAgent
      });
      throw new Error('Access denied: Admin privileges required');
    }

    return result;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken, ipAddress = 'unknown', userAgent = 'unknown') {
    try {
      // Verify refresh token
      const decoded = this.verifyToken(refreshToken, true);
      
      // Find user
      const user = await UserAuth.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Check if refresh token exists in user's session tokens
      const sessionToken = user.sessionTokens.find(st => 
        st.token === refreshToken && st.isActive && st.expiresAt > new Date()
      );

      if (!sessionToken) {
        SecurityLogger.logSecurityEvent('TOKEN_REFRESH_FAILED', {
          userId: user._id,
          email: user.email,
          reason: 'Invalid refresh token',
          ipAddress,
          userAgent
        });
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const { accessToken } = this.generateTokens(user);

      // Update last activity
      await user.updateLastActivity(ipAddress);

      // Get user profile data
      let userProfile = null;
      try {
        if (user.role === 'admin' || user.role === 'super_admin') {
          // Get admin profile from MongoDB
          userProfile = await dataService.findAdminUserByEmail(user.email);
        } else {
          // Get customer profile from Google Sheets
          userProfile = await dataService.findCustomerByEmail(user.email);
        }
      } catch (error) {
        console.warn('Could not fetch user profile:', error.message);
      }

      SecurityLogger.logSecurityEvent('TOKEN_REFRESHED', {
        userId: user._id,
        email: user.email,
        ipAddress,
        userAgent
      });

      return {
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: userProfile
        }
      };

    } catch (error) {
      console.error('Token refresh error:', error.message);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken, ipAddress = 'unknown', userAgent = 'unknown') {
    try {
      if (!refreshToken) {
        return { success: true, message: 'No token to logout' };
      }

      // Decode token to get user info (don't verify expiry for logout)
      const decoded = jwt.decode(refreshToken);
      if (!decoded) {
        return { success: true, message: 'Invalid token' };
      }

      // Find user and revoke the specific token
      const user = await UserAuth.findById(decoded.id);
      if (user) {
        await user.revokeSessionToken(refreshToken);
        
        SecurityLogger.logSecurityEvent('LOGOUT', {
          userId: user._id,
          email: user.email,
          ipAddress,
          userAgent
        });
      }

      return { success: true, message: 'Logged out successfully' };

    } catch (error) {
      console.error('Logout error:', error.message);
      return { success: true, message: 'Logout completed with errors' };
    }
  }

  /**
   * Logout from all devices
   */
  async logoutFromAllDevices(userId, ipAddress = 'unknown', userAgent = 'unknown') {
    try {
      const user = await UserAuth.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.revokeAllSessionTokens();

      SecurityLogger.logSecurityEvent('LOGOUT_ALL_DEVICES', {
        userId: user._id,
        email: user.email,
        ipAddress,
        userAgent
      });

      return { success: true, message: 'Logged out from all devices' };

    } catch (error) {
      console.error('Logout all devices error:', error.message);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword, ipAddress = 'unknown', userAgent = 'unknown') {
    try {
      const user = await UserAuth.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        SecurityLogger.logSecurityEvent('PASSWORD_CHANGE_FAILED', {
          userId: user._id,
          email: user.email,
          reason: 'Invalid current password',
          ipAddress,
          userAgent
        });
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.passwordHash = newPassword; // Will be hashed by pre-save middleware
      await user.save();

      // Revoke all existing sessions to force re-login
      await user.revokeAllSessionTokens();

      SecurityLogger.logSecurityEvent('PASSWORD_CHANGED', {
        userId: user._id,
        email: user.email,
        ipAddress,
        userAgent
      });

      return { success: true, message: 'Password changed successfully' };

    } catch (error) {
      console.error('Change password error:', error.message);
      throw error;
    }
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId) {
    try {
      const user = await UserAuth.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Clean expired tokens first
      await user.cleanExpiredTokens();

      const activeSessions = user.sessionTokens
        .filter(st => st.isActive && st.expiresAt > new Date())
        .map(st => ({
          id: st._id,
          createdAt: st.createdAt,
          expiresAt: st.expiresAt,
          ipAddress: st.ipAddress,
          userAgent: st.userAgent
        }));

      return activeSessions;

    } catch (error) {
      console.error('Get active sessions error:', error.message);
      throw error;
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(userId, sessionId, ipAddress = 'unknown', userAgent = 'unknown') {
    try {
      const user = await UserAuth.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const sessionToken = user.sessionTokens.find(st => st._id.toString() === sessionId);
      if (!sessionToken) {
        throw new Error('Session not found');
      }

      sessionToken.isActive = false;
      await user.save();

      SecurityLogger.logSecurityEvent('SESSION_REVOKED', {
        userId: user._id,
        email: user.email,
        sessionId,
        ipAddress,
        userAgent
      });

      return { success: true, message: 'Session revoked successfully' };

    } catch (error) {
      console.error('Revoke session error:', error.message);
      throw error;
    }
  }

  /**
   * Register new user (creates auth record and profile in Google Sheets)
   */
  async register(userData, ipAddress = 'unknown', userAgent = 'unknown') {
    try {
      const { email, password, firstName, lastName, phone, role = 'user' } = userData;

      // Check if user already exists
      const existingUser = await UserAuth.findByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create authentication record
      const userAuth = new UserAuth({
        email,
        passwordHash: password, // Will be hashed by pre-save middleware
        role,
        isActive: true
      });

      await userAuth.save();

      // Create profile
      try {
        if (role === 'admin' || role === 'super_admin') {
          // Create admin profile in MongoDB
          await dataService.createAdminUser({
            email,
            role: {
              name: role,
              level: role === 'super_admin' ? 1 : 2,
              permissions: role === 'super_admin' ? 
                AdminUser.getDefaultRoles().super_admin.permissions :
                AdminUser.getDefaultRoles().admin.permissions
            },
            profile: {
              firstName,
              lastName,
              phone
            },
            isActive: true
          });
        } else {
          // Create customer profile in Google Sheets
          await dataService.createCustomer({
            firstName,
            lastName,
            email,
            phone,
            status: 'active'
          });
        }
      } catch (profileError) {
        // If profile creation fails, remove the auth record
        await UserAuth.findByIdAndDelete(userAuth._id);
        throw new Error(`Registration failed: ${profileError.message}`);
      }

      SecurityLogger.logSecurityEvent('USER_REGISTERED', {
        userId: userAuth._id,
        email,
        role,
        ipAddress,
        userAgent
      });

      return {
        success: true,
        message: 'User registered successfully',
        user: {
          id: userAuth._id,
          email: userAuth.email,
          role: userAuth.role
        }
      };

    } catch (error) {
      console.error('Registration error:', error.message);
      throw error;
    }
  }

  /**
   * Cleanup expired sessions (maintenance task)
   */
  async cleanupExpiredSessions() {
    try {
      await UserAuth.cleanupExpiredSessions();
      console.log('Expired sessions cleaned up successfully');
    } catch (error) {
      console.error('Cleanup expired sessions error:', error.message);
    }
  }

  /**
   * Get user by ID (auth data only)
   */
  async getUserById(userId) {
    try {
      const user = await UserAuth.findById(userId).select('-passwordHash -sessionTokens');
      return user;
    } catch (error) {
      console.error('Get user by ID error:', error.message);
      throw error;
    }
  }

  /**
   * Verify user has required role
   */
  async verifyUserRole(userId, requiredRoles) {
    try {
      const user = await UserAuth.findById(userId);
      if (!user || !user.isActive) {
        return false;
      }

      if (Array.isArray(requiredRoles)) {
        return requiredRoles.includes(user.role);
      }

      return user.role === requiredRoles;
    } catch (error) {
      console.error('Verify user role error:', error.message);
      return false;
    }
  }
}

module.exports = new AuthService();