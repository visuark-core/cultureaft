const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      'user_create', 'user_update', 'user_delete', 'user_suspend', 'user_activate',
      'user_bulk_update', 'user_export', 'user_import',
      'UPDATE_USER', 'UPDATE_USER_STATUS', 'ADD_USER_FLAG', 'RESOLVE_USER_FLAG',
      'ADD_USER_NOTE', 'VIEW_USERS', 'VIEW_USER', 'VIEW_USER_ACTIVITY',
      'VIEW_USER_ANALYTICS', 'SEARCH_USERS', 'DELETE_USER',

      // Product actions
      'product_create', 'product_update', 'product_delete', 'product_bulk_update',
      'product_export', 'product_import', 'inventory_update',
      'CREATE_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT', 'VIEW_PRODUCT', 'SEARCH_PRODUCTS',
      'UPDATE_PRODUCT_STATUS', 'UPDATE_PRODUCT_INVENTORY', 'ADD_PRODUCT_FLAG', 'RESOLVE_PRODUCT_FLAG',
      'ADD_PRODUCT_NOTE', 'VIEW_PRODUCT_ANALYTICS', 'BULK_UPDATE_PRODUCTS', 'BULK_UPDATE_PRODUCT_STATUS',
      'EXPORT_PRODUCTS_CSV', 'VIEW_PRODUCTS',

      // Order actions
      'order_update', 'order_cancel', 'order_refund', 'order_export',

      // Payment actions
      'payment_refund', 'payment_reconcile',

      // Content actions
      'content_create', 'content_update', 'content_delete', 'content_moderate',
      'review_approve', 'review_reject', 'campaign_create', 'campaign_update',

      // System actions
      'system_config_update', 'admin_create', 'admin_update', 'admin_delete',
      'role_create', 'role_update', 'role_delete',

      // Authentication actions
      'login_success', 'login_failed', 'logout', 'password_change', 'mfa_enable', 'mfa_disable',
      'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_BLOCKED', 'TOKEN_REFRESHED', 'TOKEN_REFRESH_FAILED',
      'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAILED', 'ACCOUNT_LOCKED', 'LOGOUT',

      // Security actions
      'account_locked', 'account_unlocked', 'suspicious_activity', 'permission_denied',
      'PERMISSION_DENIED', 'PERMISSION_GRANTED', 'HIERARCHY_VIOLATION', 'OWNERSHIP_VIOLATION',
      'TIME_RESTRICTION_VIOLATION', 'BULK_LIMIT_EXCEEDED', 'UNAUTHORIZED_ACCESS',

      // Test actions
      'test_action', 'test_fail_action'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['user', 'users', 'product', 'products', 'order', 'payment', 'content', 'system', 'admin', 'role', 'auth']
  },
  resourceId: {
    type: String, // Can be ObjectId or other identifier
    default: null
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  metadata: {
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    affectedCount: Number,
    bulkOperation: Boolean,
    reason: String,
    notes: String
  },
  request: {
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      default: null
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'unknown'],
      default: null
    },
    endpoint: {
      type: String,
      default: null
    },
    requestId: {
      type: String,
      default: null
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance and querying
AuditLogSchema.index({ adminId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, createdAt: -1 });
AuditLogSchema.index({ resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });
AuditLogSchema.index({ 'request.ipAddress': 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 }); // For general time-based queries
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // Auto-delete after 1 year

// Virtual for formatted timestamp
AuditLogSchema.virtual('formattedTimestamp').get(function () {
  return this.createdAt.toISOString();
});

// Static method to log admin action with enhanced error handling
AuditLogSchema.statics.logAction = async function (data) {
  try {
    const logEntry = new this({
      adminId: data.adminId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      changes: data.changes,
      metadata: {
        ...data.metadata,
        timestamp: new Date(),
        source: 'middleware'
      },
      request: {
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        method: data.method,
        endpoint: data.endpoint,
        requestId: data.requestId || `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      severity: data.severity || 'low',
      status: data.status || 'success',
      errorMessage: data.errorMessage
    });

    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('Failed to create audit log:', error);

    // Attempt to create a minimal log entry if the full one fails
    try {
      const minimalEntry = new this({
        adminId: data.adminId,
        action: data.action || 'unknown',
        resource: data.resource || 'unknown',
        request: {
          ipAddress: data.ipAddress || 'unknown',
          userAgent: 'unknown',
          method: data.method || 'unknown',
          endpoint: data.endpoint || 'unknown',
          requestId: `fallback_${Date.now()}`
        },
        severity: 'medium',
        status: 'failed',
        errorMessage: `Logging failed: ${error.message}`
      });

      await minimalEntry.save();
      return minimalEntry;
    } catch (fallbackError) {
      console.error('Fallback audit logging also failed:', fallbackError);
      return null;
    }
  }
};

// Static method to get admin activity summary
AuditLogSchema.statics.getAdminActivity = function (adminId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        adminId: new mongoose.Types.ObjectId(adminId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        totalCount: { $sum: '$count' },
        dailyActivity: {
          $push: {
            date: '$_id.date',
            count: '$count'
          }
        }
      }
    },
    {
      $sort: { totalCount: -1 }
    }
  ]);
};

// Static method to get security events
AuditLogSchema.statics.getSecurityEvents = function (days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    createdAt: { $gte: startDate },
    $or: [
      { severity: { $in: ['high', 'critical'] } },
      { action: { $in: ['login_failed', 'account_locked', 'suspicious_activity', 'permission_denied'] } }
    ]
  })
    .populate('adminId', 'email profile.firstName profile.lastName')
    .sort({ createdAt: -1 })
    .limit(100);
};

// Static method to get resource activity
AuditLogSchema.statics.getResourceActivity = function (resource, resourceId, limit = 50) {
  return this.find({
    resource: resource,
    resourceId: resourceId
  })
    .populate('adminId', 'email profile.firstName profile.lastName')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to detect suspicious patterns
AuditLogSchema.statics.detectSuspiciousActivity = function (adminId, timeWindow = 60) {
  const startTime = new Date(Date.now() - timeWindow * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        adminId: new mongoose.Types.ObjectId(adminId),
        createdAt: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          ipAddress: '$request.ipAddress'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$createdAt' },
        severity: { $max: '$severity' }
      }
    },
    {
      $match: {
        $or: [
          { count: { $gte: 10 } }, // High frequency
          { severity: { $in: ['high', 'critical'] } }
        ]
      }
    },
    {
      $sort: { count: -1, lastActivity: -1 }
    }
  ]);
};

// Static method to get permission violations
AuditLogSchema.statics.getPermissionViolations = function (days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    createdAt: { $gte: startDate },
    action: { $in: ['PERMISSION_DENIED', 'HIERARCHY_VIOLATION', 'OWNERSHIP_VIOLATION'] }
  })
    .populate('adminId', 'email profile.firstName profile.lastName role')
    .sort({ createdAt: -1 })
    .limit(100);
};

// Static method to get bulk operation logs
AuditLogSchema.statics.getBulkOperations = function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    createdAt: { $gte: startDate },
    $or: [
      { action: { $regex: /bulk/i } },
      { 'metadata.bulkOperation': true },
      { 'metadata.affectedCount': { $gt: 1 } }
    ]
  })
    .populate('adminId', 'email profile.firstName profile.lastName')
    .sort({ createdAt: -1 })
    .limit(50);
};

// Static method to generate security report
AuditLogSchema.statics.generateSecurityReport = async function (days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    totalLogs,
    securityEvents,
    permissionViolations,
    suspiciousIPs,
    topAdmins
  ] = await Promise.all([
    // Total logs count
    this.countDocuments({ createdAt: { $gte: startDate } }),

    // Security events
    this.countDocuments({
      createdAt: { $gte: startDate },
      severity: { $in: ['high', 'critical'] }
    }),

    // Permission violations
    this.countDocuments({
      createdAt: { $gte: startDate },
      action: { $in: ['PERMISSION_DENIED', 'HIERARCHY_VIOLATION'] }
    }),

    // Suspicious IP addresses
    this.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          severity: { $in: ['medium', 'high', 'critical'] }
        }
      },
      {
        $group: {
          _id: '$request.ipAddress',
          count: { $sum: 1 },
          lastActivity: { $max: '$createdAt' }
        }
      },
      {
        $match: { count: { $gte: 5 } }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]),

    // Most active admins
    this.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$adminId',
          actionCount: { $sum: 1 },
          lastActivity: { $max: '$createdAt' },
          actions: { $addToSet: '$action' }
        }
      },
      {
        $sort: { actionCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'adminusers',
          localField: '_id',
          foreignField: '_id',
          as: 'admin'
        }
      }
    ])
  ]);

  return {
    period: `${days} days`,
    summary: {
      totalLogs,
      securityEvents,
      permissionViolations,
      suspiciousIPCount: suspiciousIPs.length
    },
    details: {
      suspiciousIPs,
      topAdmins
    },
    generatedAt: new Date()
  };
};

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

module.exports = AuditLog;