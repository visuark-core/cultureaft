const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Permission Schema
const PermissionSchema = new mongoose.Schema({
  resource: {
    type: String,
    required: true,
    enum: ['users', 'products', 'orders', 'payments', 'analytics', 'content', 'system', 'reports', 'admin']
  },
  actions: [{
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'approve', 'moderate', 'export', 'import']
  }],
  conditions: [{
    field: String,
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']
    },
    value: mongoose.Schema.Types.Mixed
  }]
}, { _id: false });

// Admin Role Schema
const AdminRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
    // 1=SuperAdmin, 2=Admin, 3=Moderator, 4=Support
  },
  permissions: [PermissionSchema],
  canCreateSubAdmins: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Admin User Schema
const AdminUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminRole',
    required: true
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    avatar: {
      type: String,
      default: null
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    }
  },
  security: {
    lastLogin: {
      type: Date,
      default: null
    },
    loginAttempts: {
      type: Number,
      default: 0,
      max: 10
    },
    lockedUntil: {
      type: Date,
      default: null
    },
    mfaEnabled: {
      type: Boolean,
      default: false
    },
    mfaSecret: {
      type: String,
      default: null
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now
    },
    refreshTokens: [{
      token: String,
      createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800 // 7 days
      }
    }]
  },
  audit: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    ipAddresses: [{
      ip: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    sessionCount: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    department: String,
    employeeId: String,
    notes: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Indexes for performance (avoiding duplicates with unique constraints)
AdminUserSchema.index({ 'role': 1 });
AdminUserSchema.index({ isActive: 1 });
AdminUserSchema.index({ 'security.lastLogin': -1 });
AdminUserSchema.index({ 'audit.lastActivity': -1 });
AdminRoleSchema.index({ level: 1 });

// Virtual for full name
AdminUserSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for account locked status
AdminUserSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockedUntil && this.security.lockedUntil > Date.now());
});

// Pre-save middleware to hash password
AdminUserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    this.security.passwordChangedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
AdminUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
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
    updates.$set = { 'security.lockedUntil': Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
AdminUserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      'security.loginAttempts': 1,
      'security.lockedUntil': 1
    }
  });
};

// Method to update last activity
AdminUserSchema.methods.updateActivity = function(ipAddress) {
  const updates = {
    'audit.lastActivity': Date.now(),
    $inc: { 'audit.sessionCount': 1 }
  };
  
  if (ipAddress) {
    updates.$push = {
      'audit.ipAddresses': {
        $each: [{ ip: ipAddress, timestamp: Date.now() }],
        $slice: -10 // Keep only last 10 IP addresses
      }
    };
  }
  
  return this.updateOne(updates);
};

// Static method to find by email
AdminUserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).populate('role');
};

// Static method to create default roles
AdminUserSchema.statics.createDefaultRoles = async function() {
  const AdminRole = mongoose.model('AdminRole');
  
  const defaultRoles = [
    {
      name: 'Super Admin',
      level: 1,
      canCreateSubAdmins: true,
      permissions: [
        { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { resource: 'products', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { resource: 'orders', actions: ['create', 'read', 'update', 'delete', 'export'] },
        { resource: 'payments', actions: ['read', 'update', 'export'] },
        { resource: 'analytics', actions: ['read', 'export'] },
        { resource: 'content', actions: ['create', 'read', 'update', 'delete', 'moderate'] },
        { resource: 'system', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'reports', actions: ['create', 'read', 'export'] }
      ],
      description: 'Full system access with all permissions'
    },
    {
      name: 'Admin',
      level: 2,
      canCreateSubAdmins: true,
      permissions: [
        { resource: 'users', actions: ['read', 'update', 'export'] },
        { resource: 'products', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { resource: 'orders', actions: ['read', 'update', 'export'] },
        { resource: 'payments', actions: ['read', 'export'] },
        { resource: 'analytics', actions: ['read', 'export'] },
        { resource: 'content', actions: ['create', 'read', 'update', 'moderate'] },
        { resource: 'reports', actions: ['create', 'read', 'export'] }
      ],
      description: 'Administrative access with product and content management'
    },
    {
      name: 'Moderator',
      level: 3,
      canCreateSubAdmins: false,
      permissions: [
        { resource: 'users', actions: ['read'] },
        { resource: 'products', actions: ['read', 'update'] },
        { resource: 'orders', actions: ['read', 'update'] },
        { resource: 'content', actions: ['read', 'moderate'] },
        { resource: 'reports', actions: ['read'] }
      ],
      description: 'Content moderation and basic management access'
    },
    {
      name: 'Support',
      level: 4,
      canCreateSubAdmins: false,
      permissions: [
        { resource: 'users', actions: ['read'] },
        { resource: 'orders', actions: ['read', 'update'] },
        { resource: 'reports', actions: ['read'] }
      ],
      description: 'Customer support access with limited permissions'
    }
  ];
  
  for (const roleData of defaultRoles) {
    await AdminRole.findOneAndUpdate(
      { name: roleData.name },
      roleData,
      { upsert: true, new: true }
    );
  }
};

const AdminRole = mongoose.model('AdminRole', AdminRoleSchema);
const AdminUser = mongoose.model('AdminUser', AdminUserSchema);

module.exports = { AdminUser, AdminRole };