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
      'login', 'logout', 'create', 'read', 'update', 'delete', 
      'approve', 'reject', 'suspend', 'activate', 'export', 
      'import', 'bulk_operation', 'password_change', 'role_change',
      'assign', 'updateLocation', 'assign_order', 'update_location',
      'record_delivery_attempt', 'upload_delivery_proof', 'auto_assign_orders',
      'handle_failed_delivery'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['users', 'products', 'orders', 'payments', 'analytics', 'content', 'system', 'admins', 'auth', 'deliveryAgents', 'delivery_agents']
  },
  resourceId: {
    type: String,
    required: false
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  previousValues: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
AuditLogSchema.index({ adminId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, timestamp: -1 });
AuditLogSchema.index({ resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ ipAddress: 1, timestamp: -1 });

// Compound indexes for complex queries
AuditLogSchema.index({ adminId: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, action: 1, timestamp: -1 });

// TTL index to automatically delete old logs after 2 years
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

// Static method to log admin action
AuditLogSchema.statics.logAction = async function(adminId, action, resource, options = {}) {
  const {
    resourceId,
    changes,
    previousValues,
    ipAddress,
    userAgent,
    severity = 'low',
    description,
    metadata = {}
  } = options;

  const logEntry = new this({
    adminId,
    action,
    resource,
    resourceId,
    changes,
    previousValues,
    ipAddress,
    userAgent,
    severity,
    description: description || `${action} performed on ${resource}`,
    metadata
  });

  return logEntry.save();
};

// Static method to get admin activity summary
AuditLogSchema.statics.getAdminActivitySummary = async function(adminId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const pipeline = [
    {
      $match: {
        adminId: new mongoose.Types.ObjectId(adminId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          resource: '$resource'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  return this.aggregate(pipeline);
};

// Static method to get security events
AuditLogSchema.statics.getSecurityEvents = async function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    timestamp: { $gte: startDate },
    $or: [
      { severity: { $in: ['high', 'critical'] } },
      { action: { $in: ['login', 'password_change', 'role_change'] } }
    ]
  })
  .populate('adminId', 'email profile.firstName profile.lastName')
  .sort({ timestamp: -1 })
  .limit(100);
};

// Static method to detect suspicious activity
AuditLogSchema.statics.detectSuspiciousActivity = async function(adminId, hours = 1) {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hours);

  const activityCount = await this.countDocuments({
    adminId: new mongoose.Types.ObjectId(adminId),
    timestamp: { $gte: startTime }
  });

  // Flag if more than 100 actions in an hour
  const isSuspicious = activityCount > 100;

  if (isSuspicious) {
    // Log suspicious activity
    await this.logAction(adminId, 'suspicious_activity_detected', 'system', {
      ipAddress: 'system',
      userAgent: 'system',
      severity: 'high',
      description: `Suspicious activity detected: ${activityCount} actions in ${hours} hour(s)`,
      metadata: { activityCount, timeWindow: hours }
    });
  }

  return { isSuspicious, activityCount };
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);