const mongoose = require('mongoose');

// Sub-schemas for delivery agent data organization
const AddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' }
}, { _id: false });

const WorkingHoursSchema = new mongoose.Schema({
  monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
  tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
  wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
  thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
  friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
  saturday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
  sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
}, { _id: false });

const GeoLocationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: Number,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const PerformanceMetricsSchema = new mongoose.Schema({
  totalDeliveries: { type: Number, default: 0 },
  successfulDeliveries: { type: Number, default: 0 },
  failedDeliveries: { type: Number, default: 0 },
  averageDeliveryTime: { type: Number, default: 0 }, // in minutes
  customerRating: { type: Number, default: 0, min: 0, max: 5 },
  deliverySuccessRate: { type: Number, default: 0 }, // percentage
  onTimeDeliveryRate: { type: Number, default: 0 }, // percentage
  totalRatings: { type: Number, default: 0 },
  ratingSum: { type: Number, default: 0 },
  
  // Monthly performance tracking
  monthlyStats: [{
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    deliveries: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 }
  }],
  
  // Performance trends
  lastWeekDeliveries: { type: Number, default: 0 },
  lastMonthDeliveries: { type: Number, default: 0 },
  performanceTrend: {
    type: String,
    enum: ['improving', 'stable', 'declining'],
    default: 'stable'
  }
}, { _id: false });

const VehicleInfoSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bike', 'scooter', 'bicycle', 'car', 'van', 'truck'],
    required: true
  },
  model: String,
  registrationNumber: String,
  insuranceExpiry: Date,
  licenseExpiry: Date,
  capacity: {
    weight: Number, // in kg
    volume: Number  // in cubic meters
  }
}, { _id: false });

const DeliveryZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pincodes: [String],
  cities: [String],
  priority: {
    type: String,
    enum: ['primary', 'secondary'],
    default: 'primary'
  }
}, { _id: false });

const EarningsSchema = new mongoose.Schema({
  totalEarnings: { type: Number, default: 0 },
  currentMonthEarnings: { type: Number, default: 0 },
  lastMonthEarnings: { type: Number, default: 0 },
  perDeliveryRate: { type: Number, default: 0 },
  bonusEarnings: { type: Number, default: 0 },
  
  // Payment details
  bankAccount: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  
  // Earnings history
  paymentHistory: [{
    amount: Number,
    period: String, // e.g., "2024-01"
    paidAt: Date,
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    }
  }]
}, { _id: false });

// Main DeliveryAgent Schema
const DeliveryAgentSchema = new mongoose.Schema({
  // Basic profile information
  profile: {
    employeeId: {
      type: String,
      required: true,
      unique: true
    },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    photo: String,
    address: AddressSchema,
    dateOfBirth: Date,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  
  // Employment details
  employment: {
    joinDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'terminated'],
      default: 'active'
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'freelance'],
      default: 'full_time'
    },
    department: { type: String, default: 'delivery' },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    }
  },
  
  // Performance tracking
  performance: PerformanceMetricsSchema,
  
  // Availability and scheduling
  availability: {
    isAvailable: { type: Boolean, default: true },
    currentOrders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }],
    maxOrders: { type: Number, default: 5 },
    workingHours: WorkingHoursSchema,
    currentShift: {
      start: Date,
      end: Date,
      isActive: { type: Boolean, default: false }
    },
    
    // Leave and time-off
    leaveRequests: [{
      startDate: Date,
      endDate: Date,
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser'
      }
    }]
  },
  
  // Location and logistics
  location: {
    current: GeoLocationSchema,
    lastUpdated: { type: Date, default: Date.now },
    trackingEnabled: { type: Boolean, default: true },
    
    // Delivery zones
    assignedZones: [DeliveryZoneSchema],
    homeBase: {
      name: String,
      address: AddressSchema,
      coordinates: GeoLocationSchema
    }
  },
  
  // Vehicle information
  vehicle: VehicleInfoSchema,
  
  // Financial information
  earnings: EarningsSchema,
  
  // Ratings and feedback
  feedback: {
    customerRatings: [{
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      ratedAt: { type: Date, default: Date.now }
    }],
    
    // Internal feedback from supervisors
    internalFeedback: [{
      feedbackBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser'
      },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      category: {
        type: String,
        enum: ['punctuality', 'customer_service', 'vehicle_maintenance', 'overall']
      },
      feedbackDate: { type: Date, default: Date.now }
    }]
  },
  
  // Training and certifications
  training: {
    completedCourses: [String],
    certifications: [{
      name: String,
      issuedBy: String,
      issuedDate: Date,
      expiryDate: Date,
      certificateUrl: String
    }],
    trainingScore: { type: Number, default: 0 }
  },
  
  // Administrative fields
  notes: String,
  tags: [String],
  
  // Audit trail
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    timestamp: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying and real-time performance
// Note: profile.employeeId, profile.phone, and profile.email already have unique indexes from schema definition
DeliveryAgentSchema.index({ 'employment.status': 1 });
DeliveryAgentSchema.index({ 'availability.isAvailable': 1 });
DeliveryAgentSchema.index({ 'availability.currentOrders': 1 });

// Location-based indexes
DeliveryAgentSchema.index({ 'location.current.latitude': 1, 'location.current.longitude': 1 });
DeliveryAgentSchema.index({ 'location.assignedZones.pincodes': 1 });
DeliveryAgentSchema.index({ 'location.assignedZones.cities': 1 });

// Performance indexes
DeliveryAgentSchema.index({ 'performance.customerRating': -1 });
DeliveryAgentSchema.index({ 'performance.onTimeDeliveryRate': -1 });
DeliveryAgentSchema.index({ 'performance.totalDeliveries': -1 });

// Compound indexes for complex queries
DeliveryAgentSchema.index({ 'employment.status': 1, 'availability.isAvailable': 1 });
DeliveryAgentSchema.index({ 'location.assignedZones.pincodes': 1, 'availability.isAvailable': 1 });

// Text search index
DeliveryAgentSchema.index({
  'profile.name': 'text',
  'profile.employeeId': 'text',
  'profile.phone': 'text',
  'profile.email': 'text'
});

// Pre-save middleware
DeliveryAgentSchema.pre('save', function(next) {
  // Initialize performance object if it doesn't exist
  if (!this.performance) {
    this.performance = {};
  }
  
  // Initialize availability object if it doesn't exist
  if (!this.availability) {
    this.availability = {};
  }
  
  // Calculate customer rating average
  if (this.isModified('performance.ratingSum') || this.isModified('performance.totalRatings')) {
    if (this.performance.totalRatings > 0) {
      this.performance.customerRating = this.performance.ratingSum / this.performance.totalRatings;
    }
  }
  
  // Calculate success rate
  if (this.isModified('performance.totalDeliveries') || this.isModified('performance.successfulDeliveries')) {
    if (this.performance.totalDeliveries > 0) {
      this.performance.deliverySuccessRate = (this.performance.successfulDeliveries / this.performance.totalDeliveries) * 100;
    }
  }
  
  // Calculate on-time delivery rate (assuming 'onTimeDeliveries' field will be added later)
  // For now, we can set it to deliverySuccessRate or a placeholder
  if (this.isModified('performance.totalDeliveries') || this.isModified('performance.successfulDeliveries')) {
    if (this.performance.totalDeliveries > 0) {
      this.performance.onTimeDeliveryRate = (this.performance.successfulDeliveries / this.performance.totalDeliveries) * 100; // Placeholder
    }
  }
  
  // Update availability based on current orders
  if (this.isModified('availability.currentOrders')) {
    this.availability.isAvailable = this.availability.currentOrders.length < this.availability.maxOrders;
  }
  
  next();
});

// Instance methods
DeliveryAgentSchema.methods.assignOrder = function(orderId) {
  if (this.availability.currentOrders.length >= this.availability.maxOrders) {
    throw new Error('Agent has reached maximum order capacity');
  }
  
  this.availability.currentOrders.push(orderId);
  this.availability.isAvailable = this.availability.currentOrders.length < this.availability.maxOrders;
  
  return this.save();
};

DeliveryAgentSchema.methods.completeOrder = function(orderId, deliveryTime, customerRating = null) {
  // Initialize performance and availability if they don't exist
  if (!this.performance) {
    this.performance = {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0,
      customerRating: 0,
      deliverySuccessRate: 0,
      onTimeDeliveryRate: 0,
      totalRatings: 0,
      ratingSum: 0
    };
  }
  
  if (!this.availability) {
    this.availability = {
      currentOrders: [],
      maxOrders: 5,
      isAvailable: true
    };
  }
  
  // Remove from current orders
  this.availability.currentOrders = this.availability.currentOrders.filter(
    id => !id.equals(orderId)
  );
  
  // Update performance metrics
  this.performance.totalDeliveries += 1;
  this.performance.successfulDeliveries += 1;
  
  // Update average delivery time
  const totalTime = this.performance.averageDeliveryTime * (this.performance.totalDeliveries - 1);
  this.performance.averageDeliveryTime = (totalTime + deliveryTime) / this.performance.totalDeliveries;
  
  // Recalculate delivery success rate
  this.performance.deliverySuccessRate = (this.performance.successfulDeliveries / this.performance.totalDeliveries) * 100;
  
  // Add customer rating if provided
  if (customerRating) {
    this.performance.totalRatings += 1;
    this.performance.ratingSum += customerRating;
  }
  
  // Update availability
  this.availability.isAvailable = this.availability.currentOrders.length < this.availability.maxOrders;
  
  return this.save();
};

DeliveryAgentSchema.methods.failOrder = function(orderId, reason) {
  // Remove from current orders
  this.availability.currentOrders = this.availability.currentOrders.filter(
    id => !id.equals(orderId)
  );
  
  // Update performance metrics
  this.performance.totalDeliveries += 1;
  this.performance.failedDeliveries += 1;
  
  // Update availability
  this.availability.isAvailable = this.availability.currentOrders.length < this.availability.maxOrders;
  
  // Add audit log entry
  this.auditLog.push({
    action: 'delivery_failed',
    details: { orderId, reason },
    timestamp: new Date()
  });
  
  return this.save();
};

DeliveryAgentSchema.methods.updateLocation = function(latitude, longitude, accuracy = null) {
  this.location.current = {
    latitude,
    longitude,
    accuracy,
    timestamp: new Date()
  };
  this.location.lastUpdated = new Date();
  
  return this.save();
};

DeliveryAgentSchema.methods.setAvailability = function(isAvailable, reason = null) {
  this.availability.isAvailable = isAvailable;
  
  // Add audit log entry
  this.auditLog.push({
    action: 'availability_changed',
    details: { isAvailable, reason },
    timestamp: new Date()
  });
  
  return this.save();
};

DeliveryAgentSchema.methods.addCustomerRating = function(orderId, rating, comment = null) {
  this.feedback.customerRatings.push({
    orderId,
    rating,
    comment,
    ratedAt: new Date()
  });
  
  // Update performance metrics
  this.performance.totalRatings += 1;
  this.performance.ratingSum += rating;
  
  return this.save();
};

// Static methods
DeliveryAgentSchema.statics.findAvailableAgents = function(pincode = null, maxDistance = null) {
  const query = {
    'employment.status': 'active',
    'availability.isAvailable': true
  };
  
  if (pincode) {
    query['location.assignedZones.pincodes'] = pincode;
  }
  
  return this.find(query).sort({ 'performance.customerRating': -1 });
};

DeliveryAgentSchema.statics.getPerformanceStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        'employment.status': 'active',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalAgents: { $sum: 1 },
        averageRating: { $avg: '$performance.customerRating' },
        averageDeliveries: { $avg: '$performance.totalDeliveries' },
        totalDeliveries: { $sum: '$performance.totalDeliveries' },
        successfulDeliveries: { $sum: '$performance.successfulDeliveries' },
        deliverySuccessRate: { $avg: '$performance.deliverySuccessRate' }
      }
    }
  ]);
};

DeliveryAgentSchema.statics.getTopPerformers = function(limit = 10) {
  return this.find({
    'employment.status': 'active',
    'performance.totalDeliveries': { $gte: 10 }
  })
  .sort({
    'performance.customerRating': -1,
    'performance.onTimeDeliveryRate': -1
  })
  .limit(limit);
};

DeliveryAgentSchema.statics.getAgentsByZone = function(pincode) {
  return this.find({
    'employment.status': 'active',
    'location.assignedZones.pincodes': pincode
  }).sort({ 'performance.customerRating': -1 });
};

module.exports = mongoose.model('DeliveryAgent', DeliveryAgentSchema);