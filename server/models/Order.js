const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
    default: 'pending',
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cash_on_delivery'],
    default: 'razorpay',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  // Razorpay specific fields
  razorpayOrderId: {
    type: String,
    sparse: true,
    index: true
  },
  transactionId: {
    type: String,
    sparse: true,
    index: true
  },
  paymentDate: {
    type: Date,
    sparse: true
  },
  // Enhanced customer information
  customerInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  // Tax and final amount calculations
  taxAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  // Admin management fields
  flags: [{
    type: {
      type: String,
      enum: ['fraud_review', 'payment_issue', 'customer_complaint', 'high_value', 'manual_review'],
      required: true
    },
    reason: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    resolvedAt: Date,
    notes: String
  }],
  // Refund information
  refundInfo: {
    amount: Number,
    reason: String,
    refundType: {
      type: String,
      enum: ['full', 'partial']
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    processedAt: Date
  },
  // Status tracking
  statusUpdateReason: String,
  statusUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  statusUpdatedAt: Date,
  // Estimated delivery
  estimatedDelivery: Date,
  actualDelivery: Date,
  // Shipping tracking
  trackingNumber: String,
  shippingCarrier: String,
}, {
  timestamps: true,
});

// Indexes for efficient querying
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ 'products.productId': 1 });
OrderSchema.index({ 'products.category': 1 });
OrderSchema.index({ createdAt: -1 });

// Payment-related indexes
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ razorpayOrderId: 1 });
OrderSchema.index({ transactionId: 1 });
OrderSchema.index({ paymentMethod: 1, paymentStatus: 1 });

// Compound indexes for analytics queries
OrderSchema.index({ status: 1, orderDate: -1 });
OrderSchema.index({ status: 1, 'products.category': 1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });

// Instance methods
OrderSchema.methods.markAsPaid = function(transactionId, paymentDate = new Date()) {
  this.paymentStatus = 'paid';
  this.transactionId = transactionId;
  this.paymentDate = paymentDate;
  if (this.status === 'pending') {
    this.status = 'processing';
  }
  return this.save();
};

OrderSchema.methods.markPaymentFailed = function() {
  this.paymentStatus = 'failed';
  return this.save();
};

OrderSchema.methods.addFlag = function(flagData, adminId) {
  this.flags.push({
    ...flagData,
    createdBy: adminId,
    createdAt: new Date()
  });
  return this.save();
};

OrderSchema.methods.resolveFlag = function(flagId, adminId, notes) {
  const flag = this.flags.id(flagId);
  if (flag) {
    flag.resolved = true;
    flag.resolvedBy = adminId;
    flag.resolvedAt = new Date();
    flag.notes = notes;
  }
  return this.save();
};

OrderSchema.methods.processRefund = function(refundData, adminId) {
  this.paymentStatus = 'refunded';
  this.status = 'cancelled';
  this.refundInfo = {
    ...refundData,
    processedBy: adminId,
    processedAt: new Date()
  };
  return this.save();
};

OrderSchema.methods.updateShipping = function(trackingNumber, carrier, estimatedDelivery) {
  this.trackingNumber = trackingNumber;
  this.shippingCarrier = carrier;
  this.estimatedDelivery = estimatedDelivery;
  if (this.status === 'processing') {
    this.status = 'shipped';
  }
  return this.save();
};

OrderSchema.methods.markDelivered = function(deliveryDate = new Date()) {
  this.status = 'delivered';
  this.actualDelivery = deliveryDate;
  return this.save();
};

// Static methods
OrderSchema.statics.findByRazorpayOrderId = function(razorpayOrderId) {
  return this.findOne({ razorpayOrderId });
};

OrderSchema.statics.getPaymentStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$finalAmount' }
      }
    }
  ]);
};

OrderSchema.statics.getRevenueByPeriod = function(startDate, endDate, groupBy = 'day') {
  const groupFormat = {
    day: '%Y-%m-%d',
    week: '%Y-%U',
    month: '%Y-%m',
    year: '%Y'
  };

  return this.aggregate([
    {
      $match: {
        orderDate: { $gte: startDate, $lte: endDate },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat[groupBy], date: '$orderDate' } },
        revenue: { $sum: '$finalAmount' },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: '$finalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

OrderSchema.statics.getTopCustomers = function(limit = 10, startDate, endDate) {
  const matchStage = { paymentStatus: 'paid' };
  if (startDate && endDate) {
    matchStage.orderDate = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$customerId',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$finalAmount' },
        avgOrderValue: { $avg: '$finalAmount' },
        lastOrderDate: { $max: '$orderDate' },
        customerInfo: { $first: '$customerInfo' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit }
  ]);
};

OrderSchema.statics.getFlaggedOrders = function() {
  return this.find({
    $or: [
      { 'flags.resolved': false },
      { finalAmount: { $gt: 50000 } },
      { paymentStatus: 'failed' },
      { status: 'cancelled' }
    ]
  }).populate('customerId', 'firstName lastName email');
};

OrderSchema.statics.getOrdersByStatus = function(startDate, endDate) {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.orderDate = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$finalAmount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', OrderSchema);