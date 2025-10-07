const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { AdminUser, AdminRole } = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');
const authService = require('../services/authService');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = authService.verifyToken(token);
    const admin = await AdminUser.findById(decoded.adminId).populate('role');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    req.admin = admin;
    req.adminRole = admin.role;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const validateSession = (req, res, next) => {
  // This is a placeholder for session validation logic.
  // In a real application, you would check if the session is still valid in your database.
  next();
};

const requireRole = (minLevel) => (req, res, next) => {
  if (req.adminRole.level <= minLevel) {
    return next();
  }
  res.status(403).json({ message: 'Insufficient permissions' });
};

const requirePermission = (resource, action) => (req, res, next) => {
  const hasPermission = req.adminRole.permissions.some(
    (p) => p.resource === resource && p.actions.includes(action)
  );
  if (hasPermission) {
    return next();
  }
  res.status(403).json({ message: `Permission denied: ${action} on ${resource}` });
};

const auditLogger = (action, resource, options = {}) => async (req, res, next) => {
  const originalSend = res.send;
  let responseBody;

  res.send = function (body) {
    responseBody = body;
    return originalSend.apply(res, arguments);
  };

  res.on('finish', async () => {
    try {
      await AuditLog.create({
        adminId: req.admin._id,
        action,
        resource,
        resourceId: req.params.id || req.body.id,
        status: res.statusCode >= 400 ? 'failed' : 'success',
        request: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          method: req.method,
          endpoint: req.originalUrl,
        },
        changes: {
          requestData: req.body,
          responseData: responseBody,
        },
        severity: res.statusCode >= 400 ? 'medium' : 'low',
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  });

  next();
};

const enforceHierarchy = (targetLevelField) => async (req, res, next) => {
  const targetLevel = req.body[targetLevelField];
  if (req.adminRole.level >= targetLevel) {
    await AuditLog.create({
      adminId: req.admin._id,
      action: 'HIERARCHY_VIOLATION',
      severity: 'high',
    });
    return res.status(403).json({ message: 'Cannot manage users of equal or higher hierarchy level' });
  }
  next();
};

const bulkOperationProtection = (maxItems) => (req, res, next) => {
  const itemCount = req.body.items?.length || 0;
  if (itemCount > maxItems) {
    return res.status(400).json({ message: 'Bulk operation limit exceeded' });
  }
  next();
};

const timeBasedAccess = (timeWindow) => (req, res, next) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  if (
    currentHour >= timeWindow.startHour &&
    currentHour < timeWindow.endHour &&
    timeWindow.allowedDays.includes(currentDay)
  ) {
    return next();
  }
  res.status(403).json({ message: 'Access denied: outside allowed time window' });
};

const checkResourceOwnership = (ownerField) => async (req, res, next) => {
  // This is a placeholder for resource ownership logic.
  // You would typically fetch the resource and check if req.admin._id matches the ownerField.
  next();
};

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

const strictAuthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
});

// Backwards-compatible alias: some routes expect `authenticateAdmin`
// which previously existed in the codebase. Point it to the
// current `authenticateToken` implementation so older imports work.
const authenticateAdmin = authenticateToken;

module.exports = {
  authenticateToken,
  authenticateAdmin,
  validateSession,
  requireRole,
  requirePermission,
  auditLogger,
  enforceHierarchy,
  bulkOperationProtection,
  timeBasedAccess,
  checkResourceOwnership,
  authRateLimit,
  strictAuthRateLimit,
};