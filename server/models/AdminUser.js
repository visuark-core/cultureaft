const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const PermissionSchema = new mongoose.Schema({
  resource: {
    type: String,
    required: true,
    enum: ['users', 'products', 'orders', 'payments', 'analytics', 'content', 'system', 'admins']
  },
  actions: [{
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'approve', 'suspend', 'export', 'import']
  }],
  conditions: [{
    field: String,
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains']
    },
    value: mongoose.Schema.Types.Mixed
  }]
}, { _id: false });

const AdminRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['super_admin', 'admin', 'moderator', 'support', 'analyst']
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  permissions: [PermissionSchema],
  canCreateSubAdmins: {
    type: Boolean,
    default: false
  },
  description: String
}, { _id: false });

const AdminUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: AdminRoleSchema,
    required: true
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    avatar: String,
    phone: {
      type: String,
      trim: true
    }
  },
  security: {
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockedUntil: Date,
    mfaEnabled: {
      type: Boolean,
      default: false
    },
    mfaSecret: String,
    passwordChangedAt: {
      type: Date,
      default: Date.now
    },
    sessionTokens: [{
      token: String,
      createdAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    }]
  },
  audit: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    lastActivity: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    ipAddresses: [String],
    userAgents: [String],
    loginHistory: [{
      timestamp: Date,
      ipAddress: String,
      userAgent: String,
      success: Boolean
    }]
  }
}, {
  timestamps: true
});

// Indexes for efficient querying and performance
AdminUserSchema.index({ email: 1 }, { unique: true });
AdminUserSchema.index({ 'role.name': 1 });
AdminUserSchema.index({ 'role.level': 1 });
AdminUserSchema.index({ isActive: 1 });
AdminUserSchema.index({ 'audit.createdAt': -1 });
AdminUserSchema.index({ 'audit.lastActivity': -1 });
AdminUserSchema.index({ 'security.lastLogin': -1 });
AdminUserSchema.index({ 'security.lockedUntil': 1 });

// Compound indexes for complex queries
AdminUserSchema.index({ 'role.name': 1, isActive: 1 });
AdminUserSchema.index({ 'role.level': 1, isActive: 1 });

// Virtual for full name
AdminUserSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual to check if account is locked
AdminUserSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockedUntil && this.security.lockedUntil > Date.now());
});

// Pre-save middleware to hash password
AdminUserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    this.security.passwordChangedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamps
AdminUserSchema.pre('save', function(next) {
  this.audit.updatedAt = new Date();
  next();
});

// Method to compare password
AdminUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to check if user has permission
AdminUserSchema.methods.hasPermission = function(resource, action) {
  if (!this.isActive) return false;
  
  const permission = this.role.permissions.find(p => p.resource === resource);
  if (!permission) return false;
  
  return permission.actions.includes(action);
};

// Method to check if user can perform action on specific resource
AdminUserSchema.methods.canPerformAction = function(resource, action, conditions = {}) {
  if (!this.hasPermission(resource, action)) return false;
  
  const permission = this.role.permissions.find(p => p.resource === resource);
  if (!permission.conditions || permission.conditions.length === 0) return true;
  
  // Check conditions
  return permission.conditions.every(condition => {
    const fieldValue = conditions[condition.field];
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'contains':
        return Array.isArray(fieldValue) ? fieldValue.includes(condition.value) : 
               String(fieldValue).includes(String(condition.value));
      default:
        return false;
    }
  });
};

// Method to increment login attempts
AdminUserSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockedUntil && this.security.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockedUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'security.lockedUntil': Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
AdminUserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'security.lockedUntil': 1, 'security.loginAttempts': 1 }
  });
};

// Method to update last activity
AdminUserSchema.methods.updateLastActivity = function() {
  this.audit.lastActivity = new Date();
  return this.save();
};

// Method to add login history
AdminUserSchema.methods.addLoginHistory = function(ipAddress, userAgent, success = true) {
  this.metadata.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    success
  });
  
  // Keep only last 50 login attempts
  if (this.metadata.loginHistory.length > 50) {
    this.metadata.loginHistory = this.metadata.loginHistory.slice(-50);
  }
  
  // Update IP addresses and user agents arrays
  if (ipAddress && !this.metadata.ipAddresses.includes(ipAddress)) {
    this.metadata.ipAddresses.push(ipAddress);
  }
  if (userAgent && !this.metadata.userAgents.includes(userAgent)) {
    this.metadata.userAgents.push(userAgent);
  }
  
  return this.save();
};

// Static method to create default roles
AdminUserSchema.statics.getDefaultRoles = function() {
  return {
    super_admin: {
      name: 'super_admin',
      level: 1,
      canCreateSubAdmins: true,
      description: 'Full system access with all permissions',
      permissions: [
        { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'suspend', 'export', 'import'] },
        { resource: 'products', actions: ['create', 'read', 'update', 'delete', 'approve', 'export', 'import'] },
        { resource: 'orders', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
        { resource: 'payments', actions: ['read', 'update', 'approve', 'export'] },
        { resource: 'analytics', actions: ['read', 'export'] },
        { resource: 'content', actions: ['create', 'read', 'update', 'delete', 'approve'] },
        { resource: 'system', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'admins', actions: ['create', 'read', 'update', 'delete', 'suspend'] }
      ]
    },
    admin: {
      name: 'admin',
      level: 2,
      canCreateSubAdmins: true,
      description: 'Administrative access with most permissions',
      permissions: [
        { resource: 'users', actions: ['create', 'read', 'update', 'suspend', 'export'] },
        { resource: 'products', actions: ['create', 'read', 'update', 'delete', 'approve', 'export', 'import'] },
        { resource: 'orders', actions: ['read', 'update', 'approve', 'export'] },
        { resource: 'payments', actions: ['read', 'export'] },
        { resource: 'analytics', actions: ['read', 'export'] },
        { resource: 'content', actions: ['create', 'read', 'update', 'approve'] },
        { resource: 'admins', actions: ['read'] }
      ]
    },
    moderator: {
      name: 'moderator',
      level: 3,
      canCreateSubAdmins: false,
      description: 'Content and user moderation access',
      permissions: [
        { resource: 'users', actions: ['read', 'update', 'suspend'] },
        { resource: 'products', actions: ['read', 'update', 'approve'] },
        { resource: 'orders', actions: ['read', 'update'] },
        { resource: 'content', actions: ['read', 'update', 'approve'] }
      ]
    },
    support: {
      name: 'support',
      level: 4,
      canCreateSubAdmins: false,
      description: 'Customer support access',
      permissions: [
        { resource: 'users', actions: ['read', 'update'] },
        { resource: 'orders', actions: ['read', 'update'] },
        { resource: 'products', actions: ['read'] }
      ]
    },
    analyst: {
      name: 'analyst',
      level: 5,
      canCreateSubAdmins: false,
      description: 'Analytics and reporting access',
      permissions: [
        { resource: 'analytics', actions: ['read', 'export'] },
        { resource: 'users', actions: ['read'] },
        { resource: 'products', actions: ['read'] },
        { resource: 'orders', actions: ['read'] }
      ]
    }
  };
};

module.exports = mongoose.model('AdminUser', AdminUserSchema);