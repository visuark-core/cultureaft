const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  registrationDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home',
    },
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    isDefault: {
      type: Boolean,
      default: false,
    },
  }],
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  lastOrderDate: {
    type: Date,
  },
  preferences: {
    newsletter: {
      type: Boolean,
      default: true,
    },
    orderUpdates: {
      type: Boolean,
      default: true,
    },
    promotions: {
      type: Boolean,
      default: true,
    },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
// Note: customerId and email already have unique indexes from schema definition
CustomerSchema.index({ registrationDate: -1 });
CustomerSchema.index({ totalOrders: -1 });
CustomerSchema.index({ totalSpent: -1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ createdAt: -1 });

// Virtual for full name
CustomerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to update customer stats
CustomerSchema.methods.updateStats = async function(orderAmount) {
  this.totalOrders += 1;
  this.totalSpent += orderAmount;
  this.lastOrderDate = new Date();
  return this.save();
};

module.exports = mongoose.model('Customer', CustomerSchema);