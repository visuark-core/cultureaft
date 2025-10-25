const mongoose = require('mongoose');

// Sub-schemas for better organization
const AddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
  landmark: String,
  addressType: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  }
}, { _id: false });

const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  variant: {
    size: String,
    color: String,
    material: String,
    other: mongoose.Schema.Types.Mixed
  },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 }
}, { _id: false });

const TimelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  notes: String,
  automated: { type: Boolean, default: false },
  location: String,
  metadata: mongoose.Schema.Types.Mixed
}, { _id: false });

const DeliveryAttemptSchema = new mongoose.Schema({
  attemptNumber: { type: Number, required: true },
  attemptDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['successful', 'failed', 'rescheduled'],
    required: true
  },
  reason: String,
  notes: String,
  deliveryAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryAgent'
  },
  customerFeedback: String,
  nextAttemptDate: Date
}, { _id: false });

const DeliveryProofSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['signature', 'photo', 'otp', 'biometric'],
    required: true
  },
  data: String, // Base64 encoded image or signature data
  timestamp: { type: Date, default: Date.now },
  location: {
    latitude: Number,
    longitude: Number
  },
  verifiedBy: String // Customer name or ID who received
}, { _id: false });

const RefundSchema = new mongoose.Schema({
  refundId: String,
  amount: { type: Number, required: true },
  reason: String,
  status: {
    type: String,
    enum: ['initiated', 'processing', 'completed', 'failed'],
    default: 'initiated'
  },
  method: {
    type: String,
    enum: ['original_payment', 'bank_transfer', 'cash'],
    default: 'original_payment'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  processedAt: Date,
  notes: String
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: {
    type: String,
    unique: true
  },
  orderId: {
    type: String,
    unique: true
  },
  
  // Customer information (backward compatibility)
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customer: {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    name: String,
    email: String,
    phone: String
  },
  
  // Order items (backward compatibility with products field)
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    category: { type: String, required: true },
  }],
  items: [OrderItemSchema],
  
  // Backward compatibility fields
  totalAmount: { type: Number, required: true },
  finalAmount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  
  // Enhanced pricing breakdown
  pricing: {
    subtotal: Number,
    shippingCharges: { type: Number, default: 0 },
    codCharges: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: Number
  },
  
  // Backward compatibility payment fields
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cash_on_delivery', 'cod', 'wallet', 'bank_transfer'],
    default: 'razorpay',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'completed', 'partially_refunded'],
    default: 'pending',
  },
  razorpayOrderId: { type: String, sparse: true },
  transactionId: { type: String, sparse: true },
  paymentDate: { type: Date, sparse: true },
  
  // Enhanced payment information
  payment: {
    method: {
      type: String,
      enum: ['razorpay', 'cod', 'wallet', 'bank_transfer'],
      default: 'razorpay'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    razorpayOrderId: { type: String, sparse: true },
    razorpayPaymentId: { type: String, sparse: true },
    transactionId: { type: String, sparse: true },
    paidAmount: { type: Number, default: 0 },
    paidAt: Date,
    refunds: [RefundSchema],
    failureReason: String,
    retryCount: { type: Number, default: 0 }
  },
  
  // Backward compatibility shipping fields
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
  },
  
  // Enhanced shipping information
  shipping: {
    address: AddressSchema,
    method: {
      type: String,
      enum: ['standard', 'express', 'same_day', 'pickup'],
      default: 'standard'
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    trackingNumber: String,
    carrier: String,
    shippingCost: { type: Number, default: 0 }
  },
  
  // Order status and timeline (backward compatibility)
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'completed'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  timeline: [TimelineEventSchema],
  
  // Delivery management
  delivery: {
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryAgent'
    },
    attempts: [DeliveryAttemptSchema],
    proof: DeliveryProofSchema,
    specialInstructions: String,
    deliveryWindow: {
      start: Date,
      end: Date
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      timestamp: Date
    },
    trackingEnabled: { type: Boolean, default: true },
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    deliveryStatus: {
      type: String,
      enum: ['pending', 'assigned', 'out_for_delivery', 'attempted', 'delivered', 'failed', 'rescheduled', 'cancelled'],
      default: 'pending'
    }
  },
  
  // Inventory management
  inventory: {
    reserved: { type: Boolean, default: false },
    reservedAt: Date,
    released: { type: Boolean, default: false },
    releasedAt: Date,
    reservationExpiry: Date
  },
  
  // Customer feedback
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    reviewDate: Date,
    wouldRecommend: Boolean
  },
  
  // Administrative fields
  notes: String,
  tags: [String],
  source: {
    type: String,
    enum: ['website', 'mobile_app', 'phone', 'admin'],
    default: 'website'
  },
  
  // Cancellation information
  cancellation: {
    reason: String,
    cancelledBy: {
      type: String,
      enum: ['customer', 'admin', 'system']
    },
    cancelledAt: Date,
    refundStatus: String
  }
}, {
  timestamps: true,
});

// Comprehensive indexes for efficient querying and real-time performance
// Note: orderNumber and orderId already have unique indexes from schema definition
OrderSchema.index({ 'customer.customerId': 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ updatedAt: -1 });

// Payment-related indexes
OrderSchema.index({ 'payment.status': 1 });
// Note: razorpay and transaction IDs already have sparse indexes from schema definition
OrderSchema.index({ 'payment.method': 1, 'payment.status': 1 });

// Product and category indexes
OrderSchema.index({ 'items.productId': 1 });
OrderSchema.index({ 'items.category': 1 });
OrderSchema.index({ 'items.sku': 1 });

// Delivery and logistics indexes
OrderSchema.index({ 'delivery.assignedAgent': 1 });
OrderSchema.index({ 'shipping.estimatedDelivery': 1 });
OrderSchema.index({ 'shipping.trackingNumber': 1 });
OrderSchema.index({ 'delivery.deliveryStatus': 1 });
OrderSchema.index({ 'delivery.estimatedDeliveryTime': 1 });

// Compound indexes for analytics and real-time queries
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'payment.status': 1, createdAt: -1 });
OrderSchema.index({ status: 1, 'items.category': 1 });
OrderSchema.index({ 'customer.customerId': 1, status: 1 });
OrderSchema.index({ 'payment.method': 1, 'payment.status': 1, createdAt: -1 });
OrderSchema.index({ 'delivery.assignedAgent': 1, status: 1 });

// Text search index for order search functionality
OrderSchema.index({
  orderNumber: 'text',
  'customer.name': 'text',
  'customer.email': 'text',
  'customer.phone': 'text',
  'items.name': 'text'
});

// Geospatial index for delivery location tracking
OrderSchema.index({ 'shipping.address.pincode': 1 });
OrderSchema.index({ 'shipping.address.city': 1, 'shipping.address.state': 1 });

// Pre-save middleware
OrderSchema.pre('save', function(next) {
  // Generate order number if not provided
  if (!this.orderNumber && this.isNew) {
    this.orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  
  // Auto-generate orderId if not provided (backward compatibility)
  if (!this.orderId && this.isNew) {
    this.orderId = this.orderNumber || `ORD${Date.now()}`;
  }
  
  // Sync customer information between old and new fields
  if (this.customerId && !this.customer.customerId) {
    this.customer.customerId = this.customerId;
  }
  
  // Sync payment information between old and new fields
  if (this.paymentMethod && !this.payment.method) {
    this.payment.method = this.paymentMethod === 'cash_on_delivery' ? 'cod' : this.paymentMethod;
  }
  if (this.paymentStatus && !this.payment.status) {
    this.payment.status = this.paymentStatus === 'paid' ? 'completed' : this.paymentStatus;
  }
  
  // Sync shipping address between old and new fields
  if (this.shippingAddress && !this.shipping.address) {
    this.shipping.address = this.shippingAddress;
  }
  
  // Calculate pricing totals if items exist
  if (this.items && this.items.length > 0) {
    if (this.isModified('items') || this.isModified('pricing')) {
      this.pricing.subtotal = this.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      this.pricing.total = this.pricing.subtotal + (this.pricing.shippingCharges || 0) + 
                          (this.pricing.codCharges || 0) + (this.pricing.taxes || 0) - (this.pricing.discount || 0);
    }
  }
  
  // Backward compatibility: sync totalAmount and finalAmount
  if (this.pricing && this.pricing.total) {
    this.totalAmount = this.pricing.total;
    this.finalAmount = this.pricing.total;
  }
  
  // Initialize inventory object if it doesn't exist
  if (!this.inventory) {
    this.inventory = {};
  }
  
  // Set inventory reservation expiry (24 hours from creation)
  if (this.isNew && !this.inventory.reservationExpiry) {
    this.inventory.reservationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Instance methods
OrderSchema.methods.addTimelineEvent = function(status, notes = '', updatedBy = null, automated = false) {
  this.timeline.push({
    status,
    timestamp: new Date(),
    updatedBy,
    notes,
    automated
  });
  this.status = status;
  return this.save();
};

OrderSchema.methods.markAsPaid = function(paymentId, transactionId, paidAmount) {
  this.payment.status = 'completed';
  this.payment.razorpayPaymentId = paymentId;
  this.payment.transactionId = transactionId;
  this.payment.paidAmount = paidAmount;
  this.payment.paidAt = new Date();
  
  // Add timeline event without saving
  this.timeline.push({
    status: 'confirmed',
    timestamp: new Date(),
    updatedBy: null,
    notes: 'Payment completed successfully',
    automated: true
  });
  this.status = 'confirmed';
  
  return this.save();
};

OrderSchema.methods.markPaymentFailed = function(reason) {
  this.payment.status = 'failed';
  this.payment.failureReason = reason;
  this.payment.retryCount += 1;
  
  // Add timeline event
  this.addTimelineEvent('pending', `Payment failed: ${reason}`, null, true);
  
  return this.save();
};

OrderSchema.methods.assignDeliveryAgent = function(agentId, estimatedDelivery) {
  this.delivery.assignedAgent = agentId;
  this.shipping.estimatedDelivery = estimatedDelivery;
  this.delivery.deliveryStatus = 'assigned';
  this.delivery.estimatedDeliveryTime = estimatedDelivery;
  
  // Add timeline event without saving
  this.timeline.push({
    status: 'assigned',
    timestamp: new Date(),
    updatedBy: null,
    notes: 'Delivery agent assigned',
    automated: true
  });
  this.status = 'assigned';
  
  return this.save();
};

OrderSchema.methods.addDeliveryAttempt = function(attemptData) {
  const attemptNumber = this.delivery.attempts.length + 1;
  this.delivery.attempts.push({
    attemptNumber,
    ...attemptData
  });
  
  if (attemptData.status === 'successful') {
    this.status = 'delivered';
    this.shipping.actualDelivery = new Date();
    this.delivery.deliveryStatus = 'delivered';
    this.delivery.actualDeliveryTime = new Date();
    this.addTimelineEvent('delivered', 'Order delivered successfully', attemptData.deliveryAgent, true);
  } else {
    this.delivery.deliveryStatus = 'attempted';
    this.addTimelineEvent('attempted', `Delivery attempt ${attemptNumber} ${attemptData.status}`, attemptData.deliveryAgent, true);
  }
  
  return this.save();
};

OrderSchema.methods.reserveInventory = function() {
  this.inventory.reserved = true;
  this.inventory.reservedAt = new Date();
  return this.save();
};

OrderSchema.methods.releaseInventory = function() {
  this.inventory.released = true;
  this.inventory.releasedAt = new Date();
  return this.save();
};

OrderSchema.methods.cancelOrder = function(reason, cancelledBy, refundAmount = 0) {
  this.status = 'cancelled';
  this.cancellation = {
    reason,
    cancelledBy,
    cancelledAt: new Date(),
    refundStatus: refundAmount > 0 ? 'pending' : 'not_applicable'
  };
  
  // Release inventory
  this.releaseInventory();
  
  // Add timeline event
  this.addTimelineEvent('cancelled', `Order cancelled: ${reason}`, null, false);
  
  return this.save();
};

// Static methods
OrderSchema.statics.findByRazorpayOrderId = function(razorpayOrderId) {
  return this.findOne({ 'payment.razorpayOrderId': razorpayOrderId });
};

OrderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber });
};

OrderSchema.statics.getOrderStats = function(startDate, endDate) {
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
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.total' }
      }
    }
  ]);
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
        _id: {
          method: '$payment.method',
          status: '$payment.status'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.total' }
      }
    }
  ]);
};

OrderSchema.statics.getRevenueMetrics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        'payment.status': 'completed'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalRevenue: { $sum: '$pricing.total' },
        orderCount: { $sum: 1 },
        averageOrderValue: { $avg: '$pricing.total' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

OrderSchema.statics.getCustomerMetrics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$customer.customerId',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$pricing.total' },
        lastOrderDate: { $max: '$createdAt' }
      }
    },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        averageOrdersPerCustomer: { $avg: '$orderCount' },
        averageCustomerValue: { $avg: '$totalSpent' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', OrderSchema);