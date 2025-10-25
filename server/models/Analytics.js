const mongoose = require('mongoose');

// Sub-schemas for analytics data organization
const OrderMetricsSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  new: { type: Number, default: 0 },
  completed: { type: Number, default: 0 },
  cancelled: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  processing: { type: Number, default: 0 },
  shipped: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  returned: { type: Number, default: 0 }
}, { _id: false });

const RevenueMetricsSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  online: { type: Number, default: 0 },
  cod: { type: Number, default: 0 },
  refunded: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },
  growth: { type: Number, default: 0 } // Percentage growth from previous period
}, { _id: false });

const CustomerMetricsSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  new: { type: Number, default: 0 },
  returning: { type: Number, default: 0 },
  active: { type: Number, default: 0 },
  averageLifetimeValue: { type: Number, default: 0 },
  repeatPurchaseRate: { type: Number, default: 0 },
  churnRate: { type: Number, default: 0 }
}, { _id: false });

const ProductMetricsSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  category: String,
  quantitySold: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 }
}, { _id: false });

const CategoryMetricsSchema = new mongoose.Schema({
  category: String,
  quantitySold: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 }
}, { _id: false });

const DeliveryMetricsSchema = new mongoose.Schema({
  successRate: { type: Number, default: 0 },
  averageTime: { type: Number, default: 0 }, // in hours
  failedDeliveries: { type: Number, default: 0 },
  onTimeDeliveries: { type: Number, default: 0 },
  totalAttempts: { type: Number, default: 0 }
}, { _id: false });

const PaymentMetricsSchema = new mongoose.Schema({
  online: {
    count: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }
  },
  cod: {
    count: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    collectionRate: { type: Number, default: 0 }
  },
  wallet: {
    count: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  totalTransactions: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  failureRate: { type: Number, default: 0 }
}, { _id: false });

const HourlyMetricsSchema = new mongoose.Schema({
  hour: { type: Number, required: true, min: 0, max: 23 },
  orders: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  customers: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 }
}, { _id: false });

const GeographicMetricsSchema = new mongoose.Schema({
  state: String,
  city: String,
  pincode: String,
  orderCount: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  customerCount: { type: Number, default: 0 }
}, { _id: false });

// Main Analytics Schema
const AnalyticsSchema = new mongoose.Schema({
  // Time period for this analytics record
  date: {
    type: Date,
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    required: true,
    index: true
  },
  
  // Core metrics
  metrics: {
    orders: OrderMetricsSchema,
    revenue: RevenueMetricsSchema,
    customers: CustomerMetricsSchema,
    delivery: DeliveryMetricsSchema,
    payments: PaymentMetricsSchema
  },
  
  // Product and category performance
  products: {
    totalSold: { type: Number, default: 0 },
    topSelling: [ProductMetricsSchema],
    categories: [CategoryMetricsSchema],
    newProducts: { type: Number, default: 0 },
    outOfStock: { type: Number, default: 0 }
  },
  
  // Time-based breakdown
  hourlyBreakdown: [HourlyMetricsSchema],
  
  // Geographic distribution
  geographic: [GeographicMetricsSchema],
  
  // Operational metrics
  operational: {
    averageProcessingTime: { type: Number, default: 0 }, // in hours
    averageShippingTime: { type: Number, default: 0 }, // in hours
    customerSatisfactionScore: { type: Number, default: 0 },
    returnRate: { type: Number, default: 0 },
    cancellationRate: { type: Number, default: 0 }
  },
  
  // Real-time flags
  isRealTime: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now },
  dataSource: {
    type: String,
    enum: ['batch', 'realtime', 'manual'],
    default: 'batch'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying and real-time performance
AnalyticsSchema.index({ date: -1, period: 1 });
AnalyticsSchema.index({ period: 1, createdAt: -1 });
AnalyticsSchema.index({ isRealTime: 1, lastUpdated: -1 });
AnalyticsSchema.index({ date: 1, period: 1 }, { unique: true });

// Compound indexes for analytics queries
AnalyticsSchema.index({ 'metrics.orders.total': -1, date: -1 });
AnalyticsSchema.index({ 'metrics.revenue.total': -1, date: -1 });
AnalyticsSchema.index({ 'metrics.customers.total': -1, date: -1 });

// Text search for product analytics
AnalyticsSchema.index({
  'products.topSelling.name': 'text',
  'products.categories.category': 'text'
});

// Static methods for analytics operations
AnalyticsSchema.statics.getTrendData = function(metric, period, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        period: period,
        date: { $gte: startDate }
      }
    },
    {
      $project: {
        date: 1,
        value: `$metrics.${metric}`
      }
    },
    { $sort: { date: 1 } }
  ]);
};

AnalyticsSchema.statics.getRealtimeMetrics = function() {
  return this.findOne({
    isRealTime: true,
    period: 'daily'
  }).sort({ lastUpdated: -1 });
};

AnalyticsSchema.statics.updateRealtimeMetrics = function(metricsData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.findOneAndUpdate(
    {
      date: today,
      period: 'daily',
      isRealTime: true
    },
    {
      $set: {
        ...metricsData,
        lastUpdated: new Date(),
        dataSource: 'realtime'
      }
    },
    {
      upsert: true,
      new: true
    }
  );
};

AnalyticsSchema.statics.getComparisonData = function(metric, currentPeriod, previousPeriod) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { date: currentPeriod, period: 'daily' },
          { date: previousPeriod, period: 'daily' }
        ]
      }
    },
    {
      $group: {
        _id: '$date',
        value: { $first: `$metrics.${metric}` }
      }
    }
  ]);
};

AnalyticsSchema.statics.getTopPerformers = function(metric, limit = 10) {
  return this.aggregate([
    { $unwind: '$products.topSelling' },
    {
      $group: {
        _id: '$products.topSelling.productId',
        name: { $first: '$products.topSelling.name' },
        category: { $first: '$products.topSelling.category' },
        totalValue: { $sum: `$products.topSelling.${metric}` }
      }
    },
    { $sort: { totalValue: -1 } },
    { $limit: limit }
  ]);
};

// Instance methods
AnalyticsSchema.methods.calculateGrowth = function(previousMetrics) {
  if (!previousMetrics) return 0;
  
  const current = this.metrics.revenue.total;
  const previous = previousMetrics.metrics.revenue.total;
  
  if (previous === 0) return current > 0 ? 100 : 0;
  
  return ((current - previous) / previous) * 100;
};

AnalyticsSchema.methods.updateHourlyData = function(hour, orderCount, revenue) {
  const hourlyData = this.hourlyBreakdown.find(h => h.hour === hour);
  
  if (hourlyData) {
    hourlyData.orders += orderCount;
    hourlyData.revenue += revenue;
  } else {
    this.hourlyBreakdown.push({
      hour,
      orders: orderCount,
      revenue
    });
  }
  
  return this.save();
};

// Pre-save middleware
AnalyticsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Post-save middleware for real-time updates
AnalyticsSchema.post('save', function(doc) {
  if (doc.isRealTime) {
    // Emit real-time update event (can be used with WebSocket)
    console.log(`Real-time analytics updated: ${doc.date}`);
  }
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);