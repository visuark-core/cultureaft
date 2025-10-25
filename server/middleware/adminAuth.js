const authService = require('../services/authService');
const AdminUser = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');
const SecurityLogger = require('../utils/securityLogger');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Enhanced authentication middleware with token refresh and detailed logging
const authenticateAdmin = async (req, res, next) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    // Development bypass for testing Google Sheets integration
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_ADMIN_AUTH === 'true') {
      req.admin = {
        id: 'dev-admin',
        email: 'admin@cultureaft.com',
        role: {
          name: 'super_admin',
          level: 1,
          permissions: [
            { resource: 'orders', actions: ['create', 'read', 'update', 'delete', 'export', 'approve'] },
            { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'admins', actions: ['create', 'read', 'update', 'delete', 'suspend'] },
            { resource: 'system', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'analytics', actions: ['read'] },
            { resource: 'content', actions: ['create', 'read', 'update', 'delete', 'approve'] }
          ]
        },
        permissions: [
          { resource: 'orders', actions: ['create', 'read', 'update', 'delete', 'export', 'approve'] },
          { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'admins', actions: ['create', 'read', 'update', 'delete', 'suspend'] },
          { resource: 'system', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'analytics', actions: ['read'] },
          { resource: 'content', actions: ['create', 'read', 'update', 'delete', 'approve'] }
        ]
      };
      return next();
    }

    // Add request context for logging
    req.requestContext = {
      requestId,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl
    };

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const errorContext = {
        ...req.requestContext,
        errorType: 'MISSING_TOKEN',
        severity: 'medium',
        description: 'Authentication attempt without Bearer token'
      };

      SecurityLogger.logSecurityEvent('authentication_failure', errorContext);

      return res.status(401).json({
        success: false,
        message: 'Access token required',
        errorCode: 'MISSING_TOKEN',
        requestId
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Enhanced token verification with detailed error handling
    let decoded;
    let tokenValidationError = null;

    try {
      decoded = authService.verifyToken(token);
    } catch (error) {
      tokenValidationError = error;

      const errorContext = {
        ...req.requestContext,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...',
        errorName: error.name,
        errorMessage: error.message,
        severity: 'high'
      };

      if (error instanceof jwt.TokenExpiredError) {
        // Check if token is near expiry and attempt refresh
        const expiredDecoded = jwt.decode(token);
        if (expiredDecoded && expiredDecoded.id) {
          const timeExpired = Date.now() - (expiredDecoded.exp * 1000);
          const refreshWindow = 5 * 60 * 1000; // 5 minutes grace period

          if (timeExpired <= refreshWindow) {
            // Token recently expired, attempt auto-refresh if refresh token available
            const refreshToken = req.headers['x-refresh-token'];
            if (refreshToken) {
              try {
                const refreshResult = await authService.refreshAccessToken(
                  refreshToken,
                  req.requestContext.ip,
                  req.requestContext.userAgent
                );

                if (refreshResult.success) {
                  // Set new token in response header for client to update
                  res.setHeader('X-New-Access-Token', refreshResult.accessToken);

                  // Continue with refreshed token
                  decoded = authService.verifyToken(refreshResult.accessToken);
                  tokenValidationError = null;

                  SecurityLogger.logSecurityEvent('token_auto_refresh', {
                    ...req.requestContext,
                    adminId: expiredDecoded.id,
                    severity: 'low',
                    description: 'Token automatically refreshed during authentication'
                  });
                }
              } catch (refreshError) {
                SecurityLogger.logSecurityEvent('token_refresh_failed', {
                  ...errorContext,
                  refreshError: refreshError.message,
                  description: 'Failed to auto-refresh expired token'
                });
              }
            }
          }
        }

        if (tokenValidationError) {
          SecurityLogger.logSecurityEvent('token_expired', {
            ...errorContext,
            description: 'JWT token has expired'
          });

          return res.status(401).json({
            success: false,
            message: 'Token expired',
            errorCode: 'TOKEN_EXPIRED',
            requestId,
            refreshRequired: true
          });
        }
      } else if (error instanceof jwt.JsonWebTokenError) {
        SecurityLogger.logSecurityEvent('invalid_token_signature', {
          ...errorContext,
          description: 'JWT token has invalid signature or format'
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          errorCode: 'INVALID_TOKEN',
          requestId
        });
      } else if (error instanceof jwt.NotBeforeError) {
        SecurityLogger.logSecurityEvent('token_not_active', {
          ...errorContext,
          description: 'JWT token is not active yet'
        });

        return res.status(401).json({
          success: false,
          message: 'Token not active',
          errorCode: 'TOKEN_NOT_ACTIVE',
          requestId
        });
      } else {
        SecurityLogger.logSecurityEvent('token_verification_error', {
          ...errorContext,
          description: 'Unknown JWT token verification error'
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
          errorCode: 'TOKEN_VERIFICATION_FAILED',
          requestId
        });
      }
    }

    // Get fresh admin data from database with enhanced error handling
    let adminUser;
    try {
      // First get the UserAuth record to get the email
      const UserAuth = require('../models/UserAuth');
      const userAuth = await UserAuth.findById(decoded.id).select('email role isActive');
      
      if (!userAuth || !userAuth.isActive) {
        throw new Error('User authentication record not found or inactive');
      }
      
      // Then find the AdminUser by email
      adminUser = await AdminUser.findOne({ email: userAuth.email }).select('-passwordHash');
    } catch (dbError) {
      SecurityLogger.logSecurityEvent('database_error_during_auth', {
        ...req.requestContext,
        adminId: decoded.id,
        dbError: dbError.message,
        severity: 'critical',
        description: 'Database error while fetching admin user during authentication'
      });

      return res.status(500).json({
        success: false,
        message: 'Authentication service temporarily unavailable',
        errorCode: 'DATABASE_ERROR',
        requestId
      });
    }

    if (!adminUser) {
      SecurityLogger.logSecurityEvent('admin_not_found', {
        ...req.requestContext,
        adminId: decoded.id,
        severity: 'high',
        description: 'Valid JWT token but admin user not found in database'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid admin account',
        errorCode: 'ADMIN_NOT_FOUND',
        requestId
      });
    }

    if (!adminUser.isActive) {
      SecurityLogger.logSecurityEvent('inactive_admin_access', {
        ...req.requestContext,
        adminId: adminUser._id,
        adminEmail: adminUser.email,
        severity: 'high',
        description: 'Inactive admin account attempted to access system'
      });

      return res.status(401).json({
        success: false,
        message: 'Admin account is inactive',
        errorCode: 'ACCOUNT_INACTIVE',
        requestId
      });
    }

    // Check if account is locked
    if (adminUser.isLocked) {
      const lockReason = adminUser.security?.lockReason || 'Multiple failed login attempts';
      const lockExpiry = adminUser.security?.lockExpiry;

      SecurityLogger.logSecurityEvent('locked_admin_access', {
        ...req.requestContext,
        adminId: adminUser._id,
        adminEmail: adminUser.email,
        lockReason,
        lockExpiry,
        severity: 'high',
        description: 'Locked admin account attempted to access system'
      });

      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked',
        errorCode: 'ACCOUNT_LOCKED',
        requestId,
        lockReason: lockReason,
        lockExpiry: lockExpiry
      });
    }

    // Check for suspicious activity patterns
    const suspiciousActivity = await checkSuspiciousActivity(adminUser, req.requestContext);
    if (suspiciousActivity.isSuspicious) {
      SecurityLogger.logSecurityEvent('suspicious_activity_detected', {
        ...req.requestContext,
        adminId: adminUser._id,
        adminEmail: adminUser.email,
        suspiciousIndicators: suspiciousActivity.indicators,
        severity: 'critical',
        description: 'Suspicious activity pattern detected during authentication'
      });

      // Don't block but add warning header
      res.setHeader('X-Security-Warning', 'Suspicious activity detected');
    }

    // Attach enhanced admin info to request
    req.admin = {
      id: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.role.permissions,
      fullName: adminUser.fullName,
      lastActivity: adminUser.security?.lastActivity,
      trustLevel: adminUser.security?.trustLevel || 'normal'
    };

    // Update last activity with enhanced tracking
    try {
      await adminUser.updateLastActivity();

      // Track successful authentication
      SecurityLogger.logSecurityEvent('authentication_success', {
        ...req.requestContext,
        adminId: adminUser._id,
        adminEmail: adminUser.email,
        adminRole: adminUser.role.name,
        severity: 'low',
        description: 'Admin successfully authenticated',
        responseTime: Date.now() - startTime
      });

    } catch (updateError) {
      // Log but don't fail authentication for activity update errors
      SecurityLogger.logSecurityEvent('activity_update_failed', {
        ...req.requestContext,
        adminId: adminUser._id,
        updateError: updateError.message,
        severity: 'medium',
        description: 'Failed to update admin last activity'
      });
    }

    next();
  } catch (error) {
    SecurityLogger.logSecurityEvent('authentication_system_error', {
      ...req.requestContext,
      systemError: error.message,
      stack: error.stack,
      severity: 'critical',
      description: 'System error during authentication process'
    });

    return res.status(500).json({
      success: false,
      message: 'Authentication service error',
      errorCode: 'SYSTEM_ERROR',
      requestId
    });
  }
};

// Helper function to detect suspicious activity patterns
async function checkSuspiciousActivity(adminUser, requestContext) {
  const indicators = [];

  try {
    // Check for rapid successive requests from different IPs
    const recentActivity = adminUser.security?.recentActivity || [];
    const recentIPs = recentActivity
      .filter(activity => Date.now() - activity.timestamp < 300000) // Last 5 minutes
      .map(activity => activity.ip);

    const uniqueIPs = [...new Set(recentIPs)];
    if (uniqueIPs.length > 3) {
      indicators.push('multiple_ips_short_timeframe');
    }

    // Check for unusual user agent patterns
    const currentUA = requestContext.userAgent;
    const recentUAs = recentActivity
      .filter(activity => Date.now() - activity.timestamp < 3600000) // Last hour
      .map(activity => activity.userAgent);

    const uniqueUAs = [...new Set(recentUAs)];
    if (uniqueUAs.length > 2 && !uniqueUAs.includes(currentUA)) {
      indicators.push('unusual_user_agent');
    }

    // Check for access outside normal hours (if pattern exists)
    const currentHour = new Date().getHours();
    const normalHours = adminUser.security?.normalAccessHours;
    if (normalHours && (currentHour < normalHours.start || currentHour > normalHours.end)) {
      indicators.push('unusual_access_time');
    }

    return {
      isSuspicious: indicators.length > 0,
      indicators
    };

  } catch (error) {
    // Don't fail authentication for suspicious activity check errors
    return { isSuspicious: false, indicators: [] };
  }
}

// Authorization middleware - checks permissions
const requirePermission = (resource, action, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { allowSelfAccess = false, resourceIdParam = null } = options;

      // Check if admin has the required permission
      const hasPermission = req.admin.permissions.some(permission => {
        if (permission.resource !== resource || !permission.actions.includes(action)) {
          return false;
        }

        // If no conditions, permission is granted
        if (!permission.conditions || permission.conditions.length === 0) {
          return true;
        }

        // Evaluate conditions
        const context = {
          adminId: req.admin.id,
          adminRole: req.admin.role.name,
          adminLevel: req.admin.role.level,
          resourceId: resourceIdParam ? req.params[resourceIdParam] : null,
          ...req.body,
          ...req.query
        };

        return permission.conditions.every(condition => {
          const fieldValue = context[condition.field];

          switch (condition.operator) {
            case 'equals':
              return fieldValue === condition.value;
            case 'not_equals':
              return fieldValue !== condition.value;
            case 'greater_than':
              return Number(fieldValue) > Number(condition.value);
            case 'less_than':
              return Number(fieldValue) < Number(condition.value);
            case 'contains':
              return String(fieldValue).includes(String(condition.value));
            case 'in':
              return Array.isArray(condition.value) && condition.value.includes(fieldValue);
            case 'not_in':
              return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
            default:
              return false;
          }
        });
      });

      // Check for self-access permission (e.g., admin can modify their own profile)
      if (!hasPermission && allowSelfAccess && resourceIdParam) {
        const resourceId = req.params[resourceIdParam];
        if (resourceId === req.admin.id) {
          // Skip audit logging in development
          if (process.env.NODE_ENV !== 'development') {
            // Log self-access
            await AuditLog.logAction(
              req.admin.id,
              action,
              resource,
              {
                resourceId,
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                severity: 'low',
                description: `Self-access: ${action} on ${resource}`,
                metadata: { selfAccess: true }
              }
            );
          }
          return next();
        }
      }

      if (!hasPermission) {
        // Skip audit logging in development
        if (process.env.NODE_ENV !== 'development') {
          // Log unauthorized access attempt
          await AuditLog.logAction(
            req.admin.id,
            'unauthorized_access_attempt',
            resource,
            {
              resourceId: resourceIdParam ? req.params[resourceIdParam] : null,
              ipAddress: req.ip || 'unknown',
              userAgent: req.get('User-Agent') || 'unknown',
              severity: 'high',
              description: `Unauthorized attempt to ${action} on ${resource}`,
              metadata: {
                requiredPermission: `${resource}:${action}`,
                adminRole: req.admin.role.name,
                adminLevel: req.admin.role.level
              }
            }
          );
        }

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions for this action'
        });
      }

      // Skip audit logging in development
      if (process.env.NODE_ENV !== 'development') {
        // Log authorized action
        await AuditLog.logAction(
          req.admin.id,
          action,
          resource,
          {
            resourceId: resourceIdParam ? req.params[resourceIdParam] : null,
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            severity: 'low',
            description: `Authorized ${action} on ${resource}`
          }
        );
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

// Role-based middleware - checks minimum role level
const requireRole = (minimumLevel) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.admin.role.level > minimumLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role level for this action'
      });
    }

    next();
  };
};

// Hierarchical access middleware - checks if admin can manage target admin
const requireHierarchicalAccess = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const targetAdminId = req.params.adminId || req.body.adminId;

    if (!targetAdminId) {
      return res.status(400).json({
        success: false,
        message: 'Target admin ID required'
      });
    }

    // Super admins can manage anyone
    if (req.admin.role.name === 'super_admin') {
      return next();
    }

    // Get target admin
    const targetAdmin = await AdminUser.findById(targetAdminId);

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Target admin not found'
      });
    }

    // Admins cannot manage other admins of equal or higher level
    if (req.admin.role.level >= targetAdmin.role.level) {
      // Skip audit logging in development
      if (process.env.NODE_ENV !== 'development') {
        await AuditLog.logAction(
          req.admin.id,
          'hierarchical_access_denied',
          'admins',
          {
            resourceId: targetAdminId,
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            severity: 'high',
            description: 'Attempted to manage admin with equal or higher privileges',
            metadata: {
              currentAdminLevel: req.admin.role.level,
              targetAdminLevel: targetAdmin.role.level,
              currentAdminRole: req.admin.role.name,
              targetAdminRole: targetAdmin.role.name
            }
          }
        );
      }

      return res.status(403).json({
        success: false,
        message: 'Cannot manage admin with equal or higher privileges'
      });
    }

    // Check if current admin can create sub-admins
    if (!req.admin.role.canCreateSubAdmins) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage admin accounts'
      });
    }

    next();
  } catch (error) {
    console.error('Hierarchical access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access check failed'
    });
  }
};

// Audit logging middleware - logs all admin actions
const auditLogger = (action, resource) => {
  return async (req, res, next) => {
    // Skip audit logging in development mode
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    // Store original res.json to intercept response
    const originalJson = res.json;

    res.json = function (data) {
      // Log the action after successful response
      if (req.admin && data.success !== false) {
        setImmediate(async () => {
          try {
            await AuditLog.logAction(
              req.admin.id,
              action,
              resource,
              {
                resourceId: req.params.id || req.params.adminId || req.params.userId,
                changes: req.method === 'PUT' || req.method === 'PATCH' ? req.body : undefined,
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                severity: getSeverityLevel(action, resource),
                description: `${action} performed on ${resource}`,
                metadata: {
                  method: req.method,
                  path: req.path,
                  query: req.query,
                  responseStatus: res.statusCode
                }
              }
            );
          } catch (error) {
            console.error('Audit logging error:', error);
          }
        });
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Helper function to determine severity level
const getSeverityLevel = (action, resource) => {
  const highSeverityActions = ['delete', 'suspend', 'create'];
  const criticalResources = ['admins', 'system'];

  if (criticalResources.includes(resource) && highSeverityActions.includes(action)) {
    return 'critical';
  }

  if (highSeverityActions.includes(action)) {
    return 'high';
  }

  if (action === 'update') {
    return 'medium';
  }

  return 'low';
};

// Rate limiting for sensitive operations
const sensitiveOperationLimiter = (windowMs = 60000, max = 10) => {
  const rateLimit = require('express-rate-limit');

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many sensitive operations, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Remove custom keyGenerator to use default IP-based limiting
    skip: (req) => {
      // Skip rate limiting for authenticated admin users with high trust level
      return req.admin && req.admin.trustLevel === 'high';
    }
  });
};

module.exports = {
  authenticateAdmin,
  requirePermission,
  requireRole,
  requireHierarchicalAccess,
  auditLogger,
  sensitiveOperationLimiter
};