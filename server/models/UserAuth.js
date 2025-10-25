const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * UserAuth Model - Authentication Only
 * 
 * This model stores ONLY authentication-related data for users.
 * All other user data (profile, orders, etc.) is stored in Google Sheets.
 */
const UserAuthSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Security fields
  lastLogin: {
    type: Date,
    index: true
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date,
    index: true
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  
  // Session management
  sessionTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    ipAddress: String,
    userAgent: String
  }],
  
  // MFA support
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: String,
  
  // Basic tracking (minimal)
  lastActiveAt: Date,
  ipAddresses: [String], // Last few IP addresses
  
}, {
  timestamps: true
});

// Indexes for performance
UserAuthSchema.index({ email: 1, isActive: 1 });
UserAuthSchema.index({ role: 1, isActive: 1 });
UserAuthSchema.index({ lockedUntil: 1 });
UserAuthSchema.index({ 'sessionTokens.token': 1 });
UserAuthSchema.index({ 'sessionTokens.expiresAt': 1 });

// Virtual to check if account is locked
UserAuthSchema.virtual('isLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
});

// Pre-save middleware to hash password
UserAuthSchema.pre('save', async function(next) {
  // Only hash if password is modified and not already hashed
  if (!this.isModified('passwordHash')) return next();
  
  // Check if it's already hashed (bcrypt hashes start with $2b$)
  if (this.passwordHash.startsWith('$2b$')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    this.passwordChangedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserAuthSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to increment login attempts
UserAuthSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockedUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockedUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserAuthSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { lockedUntil: 1, loginAttempts: 1 }
  });
};

// Method to update last activity
UserAuthSchema.methods.updateLastActivity = function(ipAddress) {
  const updates = {
    lastActiveAt: new Date(),
    lastLogin: new Date()
  };
  
  // Add IP address if provided and not already in list
  if (ipAddress && !this.ipAddresses.includes(ipAddress)) {
    // Keep only last 10 IP addresses
    const ipAddresses = [...this.ipAddresses, ipAddress].slice(-10);
    updates.ipAddresses = ipAddresses;
  }
  
  return this.updateOne(updates);
};

// Method to add session token
UserAuthSchema.methods.addSessionToken = function(token, expiresAt, ipAddress, userAgent) {
  this.sessionTokens.push({
    token,
    expiresAt,
    ipAddress,
    userAgent,
    isActive: true
  });
  
  // Keep only last 10 sessions
  if (this.sessionTokens.length > 10) {
    this.sessionTokens = this.sessionTokens.slice(-10);
  }
  
  return this.save();
};

// Method to revoke session token
UserAuthSchema.methods.revokeSessionToken = function(token) {
  const sessionToken = this.sessionTokens.find(st => st.token === token);
  if (sessionToken) {
    sessionToken.isActive = false;
  }
  return this.save();
};

// Method to revoke all session tokens
UserAuthSchema.methods.revokeAllSessionTokens = function() {
  this.sessionTokens.forEach(st => st.isActive = false);
  return this.save();
};

// Method to clean expired session tokens
UserAuthSchema.methods.cleanExpiredTokens = function() {
  const now = new Date();
  this.sessionTokens = this.sessionTokens.filter(st => st.expiresAt > now);
  return this.save();
};

// Static method to find by email
UserAuthSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active user by email
UserAuthSchema.statics.findActiveByEmail = function(email) {
  return this.findOne({ 
    email: email.toLowerCase(), 
    isActive: true 
  });
};

// Static method to cleanup expired sessions (for all users)
UserAuthSchema.statics.cleanupExpiredSessions = function() {
  const now = new Date();
  return this.updateMany(
    { 'sessionTokens.expiresAt': { $lt: now } },
    { $pull: { sessionTokens: { expiresAt: { $lt: now } } } }
  );
};

module.exports = mongoose.model('UserAuth', UserAuthSchema);