const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  razorpayPaymentId: {
    type: String,
    sparse: true, // Only set after successful payment
    index: true
  },
  amount: {
    type: Number,
    required: true, // Amount in paisa
    min: 1
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['created', 'attempted', 'paid', 'failed', 'cancelled'],
    default: 'created',
    index: true
  },
  signature: {
    type: String,
    sparse: true // Only set after payment attempt
  },
  receipt: {
    type: String,
    required: true,
    index: true
  },
  notes: {
    type: Map,
    of: String,
    default: {}
  },
  webhookEvents: [{
    eventId: {
      type: String,
      required: true
    },
    event: {
      type: String,
      required: true
    },
    processedAt: {
      type: Date,
      default: Date.now
    },
    payload: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  failureReason: {
    type: String,
    sparse: true
  },
  paymentMethod: {
    type: String,
    sparse: true // e.g., 'card', 'netbanking', 'wallet', 'upi'
  },
  bank: {
    type: String,
    sparse: true
  },
  cardId: {
    type: String,
    sparse: true
  },
  // Customer details for reference
  customerInfo: {
    name: String,
    email: String,
    contact: String
  },
  // Refund information
  refunds: [{
    refundId: String,
    amount: Number,
    status: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1, status: 1 });
paymentSchema.index({ orderId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for amount in rupees
paymentSchema.virtual('amountInRupees').get(function() {
  return this.amount / 100;
});

// Instance methods
paymentSchema.methods.markAsPaid = function(paymentId, signature) {
  this.status = 'paid';
  this.razorpayPaymentId = paymentId;
  this.signature = signature;
  return this.save();
};

paymentSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

paymentSchema.methods.addWebhookEvent = function(eventId, event, payload) {
  // Check if event already processed (idempotency)
  const existingEvent = this.webhookEvents.find(e => e.eventId === eventId);
  if (existingEvent) {
    return this;
  }

  this.webhookEvents.push({
    eventId,
    event,
    payload,
    processedAt: new Date()
  });
  
  return this.save();
};

// Static methods
paymentSchema.statics.findByRazorpayOrderId = function(razorpayOrderId) {
  return this.findOne({ razorpayOrderId });
};

paymentSchema.statics.findByOrderId = function(orderId) {
  return this.findOne({ orderId });
};

paymentSchema.statics.getPaymentStats = function(startDate, endDate) {
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
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Generate receipt if not provided
  if (!this.receipt && this.isNew) {
    this.receipt = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Post-save middleware for logging
paymentSchema.post('save', function(doc) {
  console.log(`Payment ${doc._id} saved with status: ${doc.status}`);
});

module.exports = mongoose.model('Payment', paymentSchema);