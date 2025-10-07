const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// User Activity Schema
const UserActivitySchema = new mongoose.Schema({
  loginCount: {
    type: Number,
    default: 0
  },
  pageViews: {
    type: Number,
    default: 0
  },
  sessionDuration: {
    type: Number,
    default: 0 // in minutes
  },
  lastPageVisited: {
    type: String,
    default: null
  },
  deviceInfo: {
    userAgent: String,
    browser: String,
    os: String,
    device: String
  },
  ipAddresses: [{
    ip: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLogin: {
    type: Date,
    default: null
  }
}, { _id: false });

// User Flag Schema
const UserFlagSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'suspicious_activity',
      'multiple_failed_logins',
      'unusual_spending',
      'policy_violation',
      'fraud_suspected',
      'account_compromise',
      'spam_behavior',
      'manual_review',
      'payment_issues',
      'security_concern'
    ]
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// User Analytics Schema
const UserAnalyticsSchema = new mongoose.Schema({
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  lastOrderDate: {
    type: Date,
    default: null
  },
  favoriteCategories: [{
    category: String,
    count: Number
  }],
  paymentMethods: [{
    method: String,
    count: Number,
    lastUsed: Date
  }],
  engagementScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lifetimeValue: {
    type: Number,
    default: 0
  },
  churnRisk: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  segmentation: {
    type: String,
    enum: ['new', 'active', 'loyal', 'at_risk', 'churned', 'vip'],
    default: 'new'
  }
}, { _id: false });

// Enhanced User Schema
const UserSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  password: {
    type: String,
    required: true,
    select: false // Don't include in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  avatar: {
    type: String,
    default: null
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'India'
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false }
    },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'INR' }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned', 'pending_verification'],
    default: 'active',
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  verificationTokens: {
    email: {
      token: String,
      expiresAt: Date
    },
    phone: {
      token: String,
      expiresAt: Date
    }
  },
  passwordResetToken: {
    token: String,
    expiresAt: Date,
    method: {
      type: String,
      enum: ['email', 'sms']
    }
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    deviceInfo: {
      userAgent: String,
      ipAddress: String
    }
  }],
  registrationDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // Enhanced fields for admin management
  activity: UserActivitySchema,
  flags: [UserFlagSchema],
  analytics: UserAnalyticsSchema,
  
  // Admin management fields
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  source: {
    type: String,
    enum: ['web', 'mobile', 'social', 'referral', 'organic', 'paid', 'other'],
    default: 'web'
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
UserSchema.index({ status: 1, registrationDate: -1 });
UserSchema.index({ 'analytics.totalSpent': -1 });
UserSchema.index({ 'analytics.totalOrders': -1 });
UserSchema.index({ 'analytics.segmentation': 1 });
UserSchema.index({ 'activity.lastLogin': -1 });
UserSchema.index({ 'flags.type': 1, 'flags.resolved': 1 });
UserSchema.index({ tags: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
UserSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for account age in days
UserSchema.virtual('accountAge').get(function() {
  const today = new Date();
  const registrationDate = new Date(this.registrationDate);
  const diffTime = Math.abs(today - registrationDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Authentication Methods

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = function(method = 'email') {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = {
    token: crypto.createHash('sha256').update(resetToken).digest('hex'),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    method: method
  };
  
  return resetToken; // Return unhashed token
};

// Generate email verification token
UserSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.verificationTokens.email = {
    token: crypto.createHash('sha256').update(verificationToken).digest('hex'),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  };
  
  return verificationToken; // Return unhashed token
};

// Generate phone verification token (6-digit OTP)
UserSchema.methods.generatePhoneVerificationToken = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.verificationTokens.phone = {
    token: crypto.createHash('sha256').update(otp).digest('hex'),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
  
  return otp; // Return plain OTP
};

// Verify password reset token
UserSchema.methods.verifyPasswordResetToken = function(token) {
  if (!this.passwordResetToken || !this.passwordResetToken.token) {
    return false;
  }
  
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return (
    this.passwordResetToken.token === hashedToken &&
    this.passwordResetToken.expiresAt > new Date()
  );
};

// Verify email verification token
UserSchema.methods.verifyEmailToken = function(token) {
  if (!this.verificationTokens.email || !this.verificationTokens.email.token) {
    return false;
  }
  
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return (
    this.verificationTokens.email.token === hashedToken &&
    this.verificationTokens.email.expiresAt > new Date()
  );
};

// Verify phone verification token
UserSchema.methods.verifyPhoneToken = function(otp) {
  if (!this.verificationTokens.phone || !this.verificationTokens.phone.token) {
    return false;
  }
  
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  
  return (
    this.verificationTokens.phone.token === hashedOtp &&
    this.verificationTokens.phone.expiresAt > new Date()
  );
};

// Clear password reset token
UserSchema.methods.clearPasswordResetToken = function() {
  this.passwordResetToken = undefined;
};

// Clear verification tokens
UserSchema.methods.clearVerificationTokens = function() {
  this.verificationTokens = {
    email: undefined,
    phone: undefined
  };
};

// Add refresh token
UserSchema.methods.addRefreshToken = function(token, deviceInfo) {
  // Remove expired tokens
  this.refreshTokens = this.refreshTokens.filter(
    rt => rt.expiresAt > new Date()
  );
  
  // Limit to 5 active refresh tokens per user
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift(); // Remove oldest
  }
  
  this.refreshTokens.push({
    token: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    deviceInfo: deviceInfo
  });
};

// Remove refresh token
UserSchema.methods.removeRefreshToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== hashedToken);
};

// Verify refresh token
UserSchema.methods.verifyRefreshToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const refreshToken = this.refreshTokens.find(
    rt => rt.token === hashedToken && rt.expiresAt > new Date()
  );
  return !!refreshToken;
};

// Clear all refresh tokens
UserSchema.methods.clearAllRefreshTokens = function() {
  this.refreshTokens = [];
};

// Increment failed login attempts
UserSchema.methods.incrementFailedLoginAttempts = function() {
  this.activity.failedLoginAttempts += 1;
  this.activity.lastFailedLogin = new Date();
  
  // Lock account after 5 failed attempts
  if (this.activity.failedLoginAttempts >= 5) {
    this.status = 'suspended';
  }
};

// Reset failed login attempts
UserSchema.methods.resetFailedLoginAttempts = function() {
  this.activity.failedLoginAttempts = 0;
  this.activity.lastFailedLogin = null;
  
  // Unlock account if it was suspended due to failed attempts
  if (this.status === 'suspended') {
    this.status = 'active';
  }
};

// Method to update user activity
UserSchema.methods.updateActivity = function(activityData) {
  if (activityData.login) {
    this.activity.lastLogin = new Date();
    this.activity.loginCount += 1;
    this.activity.failedLoginAttempts = 0; // Reset on successful login
  }
  
  if (activityData.pageView) {
    this.activity.pageViews += 1;
    this.activity.lastPageVisited = activityData.pageView;
  }
  
  if (activityData.sessionDuration) {
    this.activity.sessionDuration += activityData.sessionDuration;
  }
  
  if (activityData.deviceInfo) {
    this.activity.deviceInfo = activityData.deviceInfo;
  }
  
  if (activityData.ipAddress) {
    this.activity.ipAddresses.push({
      ip: activityData.ipAddress,
      timestamp: new Date()
    });
    
    // Keep only last 10 IP addresses
    if (this.activity.ipAddresses.length > 10) {
      this.activity.ipAddresses = this.activity.ipAddresses.slice(-10);
    }
  }
  
  return this.save();
};

// Method to add flag
UserSchema.methods.addFlag = function(flagData, adminId = null) {
  const flag = {
    type: flagData.type,
    reason: flagData.reason,
    severity: flagData.severity || 'medium',
    createdBy: adminId,
    notes: flagData.notes,
    metadata: flagData.metadata || {}
  };
  
  this.flags.push(flag);
  return this.save();
};

// Method to resolve flag
UserSchema.methods.resolveFlag = function(flagId, adminId, notes = '') {
  const flag = this.flags.id(flagId);
  if (flag) {
    flag.resolved = true;
    flag.resolvedBy = adminId;
    flag.resolvedAt = new Date();
    if (notes) flag.notes = notes;
  }
  return this.save();
};

// Method to update analytics
UserSchema.methods.updateAnalytics = function(orderData) {
  if (orderData) {
    this.analytics.totalOrders += 1;
    this.analytics.totalSpent += orderData.amount;
    this.analytics.averageOrderValue = this.analytics.totalSpent / this.analytics.totalOrders;
    this.analytics.lastOrderDate = new Date();
    
    // Update lifetime value (could include other factors)
    this.analytics.lifetimeValue = this.analytics.totalSpent;
    
    // Update segmentation based on spending and activity
    this.updateSegmentation();
  }
  
  return this.save();
};

// Method to update user segmentation
UserSchema.methods.updateSegmentation = function() {
  const daysSinceRegistration = this.accountAge;
  const daysSinceLastOrder = this.analytics.lastOrderDate ? 
    Math.ceil((new Date() - this.analytics.lastOrderDate) / (1000 * 60 * 60 * 24)) : 
    daysSinceRegistration;
  
  if (this.analytics.totalSpent > 50000) {
    this.analytics.segmentation = 'vip';
  } else if (this.analytics.totalOrders >= 10 && daysSinceLastOrder <= 30) {
    this.analytics.segmentation = 'loyal';
  } else if (this.analytics.totalOrders >= 3 && daysSinceLastOrder <= 60) {
    this.analytics.segmentation = 'active';
  } else if (this.analytics.totalOrders >= 1 && daysSinceLastOrder > 90) {
    this.analytics.segmentation = 'at_risk';
  } else if (this.analytics.totalOrders >= 1 && daysSinceLastOrder > 180) {
    this.analytics.segmentation = 'churned';
  } else {
    this.analytics.segmentation = 'new';
  }
  
  // Update churn risk
  if (daysSinceLastOrder > 120) {
    this.analytics.churnRisk = 'high';
  } else if (daysSinceLastOrder > 60) {
    this.analytics.churnRisk = 'medium';
  } else {
    this.analytics.churnRisk = 'low';
  }
};

// Method to calculate engagement score
UserSchema.methods.calculateEngagementScore = function() {
  let score = 0;
  
  // Login frequency (30 points max)
  const daysSinceLastLogin = this.activity.lastLogin ? 
    Math.ceil((new Date() - this.activity.lastLogin) / (1000 * 60 * 60 * 24)) : 
    999;
  
  if (daysSinceLastLogin <= 7) score += 30;
  else if (daysSinceLastLogin <= 30) score += 20;
  else if (daysSinceLastLogin <= 90) score += 10;
  
  // Order frequency (40 points max)
  const daysSinceLastOrder = this.analytics.lastOrderDate ? 
    Math.ceil((new Date() - this.analytics.lastOrderDate) / (1000 * 60 * 60 * 24)) : 
    999;
  
  if (daysSinceLastOrder <= 30) score += 40;
  else if (daysSinceLastOrder <= 60) score += 30;
  else if (daysSinceLastOrder <= 90) score += 20;
  else if (daysSinceLastOrder <= 180) score += 10;
  
  // Total orders (20 points max)
  if (this.analytics.totalOrders >= 20) score += 20;
  else if (this.analytics.totalOrders >= 10) score += 15;
  else if (this.analytics.totalOrders >= 5) score += 10;
  else if (this.analytics.totalOrders >= 1) score += 5;
  
  // Profile completeness (10 points max)
  let profileScore = 0;
  if (this.phone) profileScore += 2;
  if (this.dateOfBirth) profileScore += 2;
  if (this.avatar) profileScore += 2;
  if (this.addresses.length > 0) profileScore += 2;
  if (this.emailVerified) profileScore += 1;
  if (this.phoneVerified) profileScore += 1;
  score += profileScore;
  
  this.analytics.engagementScore = Math.min(score, 100);
  return this.analytics.engagementScore;
};

// Static method to get user statistics
UserSchema.statics.getUserStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: {
            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
          }
        },
        suspendedUsers: {
          $sum: {
            $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0]
          }
        },
        bannedUsers: {
          $sum: {
            $cond: [{ $eq: ['$status', 'banned'] }, 1, 0]
          }
        },
        totalRevenue: { $sum: '$analytics.totalSpent' },
        averageOrderValue: { $avg: '$analytics.averageOrderValue' },
        totalOrders: { $sum: '$analytics.totalOrders' }
      }
    }
  ]);
  
  return stats[0] || {};
};

// Static method for advanced user search
UserSchema.statics.advancedSearch = function(filters, options = {}) {
  const query = {};
  
  // Text search
  if (filters.search) {
    query.$or = [
      { firstName: { $regex: filters.search, $options: 'i' } },
      { lastName: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { customerId: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }
  
  // Date range filters
  if (filters.registrationDateFrom || filters.registrationDateTo) {
    query.registrationDate = {};
    if (filters.registrationDateFrom) {
      query.registrationDate.$gte = new Date(filters.registrationDateFrom);
    }
    if (filters.registrationDateTo) {
      query.registrationDate.$lte = new Date(filters.registrationDateTo);
    }
  }
  
  // Order count range
  if (filters.minOrders || filters.maxOrders) {
    query['analytics.totalOrders'] = {};
    if (filters.minOrders) {
      query['analytics.totalOrders'].$gte = parseInt(filters.minOrders);
    }
    if (filters.maxOrders) {
      query['analytics.totalOrders'].$lte = parseInt(filters.maxOrders);
    }
  }
  
  // Spending range
  if (filters.minSpent || filters.maxSpent) {
    query['analytics.totalSpent'] = {};
    if (filters.minSpent) {
      query['analytics.totalSpent'].$gte = parseFloat(filters.minSpent);
    }
    if (filters.maxSpent) {
      query['analytics.totalSpent'].$lte = parseFloat(filters.maxSpent);
    }
  }
  
  // Segmentation filter
  if (filters.segmentation) {
    query['analytics.segmentation'] = filters.segmentation;
  }
  
  // Flag filters
  if (filters.hasFlags) {
    query['flags.0'] = { $exists: true };
  }
  
  if (filters.flagType) {
    query['flags.type'] = filters.flagType;
  }
  
  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  // Email/Phone verification
  if (filters.emailVerified !== undefined) {
    query.emailVerified = filters.emailVerified;
  }
  
  if (filters.phoneVerified !== undefined) {
    query.phoneVerified = filters.phoneVerified;
  }
  
  // Build the query with pagination and sorting
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 20;
  const skip = (page - 1) * limit;
  
  const sort = {};
  if (options.sortBy) {
    const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
    sort[options.sortBy] = sortOrder;
  } else {
    sort.createdAt = -1; // Default sort by creation date
  }
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('referredBy', 'firstName lastName email')
    .populate('flags.createdBy', 'profile email')
    .populate('flags.resolvedBy', 'profile email')
    .populate('notes.createdBy', 'profile email');
};

// Pre-save middleware to ensure analytics, flags, and notes are initialized
UserSchema.pre('save', function(next) {
  // Initialize analytics if not present
  if (!this.analytics) {
    this.analytics = {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lastOrderDate: null,
      favoriteCategories: [],
      paymentMethods: [],
      engagementScore: 0,
      lifetimeValue: 0,
      churnRisk: 'low',
      segmentation: 'new'
    };
  }
  
  // Initialize flags if not present
  if (!this.flags) {
    this.flags = [];
  }
  
  // Initialize notes if not present
  if (!this.notes) {
    this.notes = [];
  }
  
  // Initialize activity if not present
  if (!this.activity) {
    this.activity = {
      lastLogin: null,
      loginCount: 0,
      pageViews: 0,
      sessionDuration: 0,
      lastPageVisited: null,
      deviceInfo: {},
      ipAddresses: [],
      failedLoginAttempts: 0,
      lastFailedLogin: null
    };
  }
  
  next();
});

module.exports = mongoose.model('User', UserSchema);