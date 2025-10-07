const mongoose = require('mongoose');

// Product Variation Schema
const ProductVariationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['size', 'color', 'style', 'material', 'quantity'],
    required: true
  },
  value: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

// Inventory Schema
const InventorySchema = new mongoose.Schema({
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  reserved: {
    type: Number,
    default: 0,
    min: 0
  },
  available: {
    type: Number,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  autoReorderPoint: {
    type: Number,
    default: 5,
    min: 0
  },
  autoReorderEnabled: {
    type: Boolean,
    default: false
  },
  lastRestocked: {
    type: Date,
    default: null
  },
  nextRestockDate: {
    type: Date,
    default: null
  },
  suppliers: [{
    name: String,
    contactEmail: String,
    contactPhone: String,
    leadTime: Number, // in days
    minimumOrderQuantity: Number,
    unitCost: Number,
    isPreferred: {
      type: Boolean,
      default: false
    }
  }],
  warehouseLocation: {
    type: String,
    default: 'Main Warehouse'
  },
  trackingEnabled: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Pricing Schema
const PricingSchema = new mongoose.Schema({
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    default: null,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  priceHistory: [{
    price: Number,
    type: {
      type: String,
      enum: ['base', 'sale', 'bulk']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  bulkPricing: [{
    minQuantity: Number,
    maxQuantity: Number,
    price: Number,
    discountPercentage: Number
  }]
}, { _id: false });

// Media Schema
const MediaSchema = new mongoose.Schema({
  images: [{
    url: String,
    alt: String,
    type: {
      type: String,
      enum: ['main', 'gallery', 'lifestyle', 'infographic'],
      default: 'gallery'
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  videos: [{
    url: String,
    title: String,
    type: {
      type: String,
      enum: ['product', 'demo', 'review'],
      default: 'product'
    },
    thumbnail: String
  }],
  documents: [{
    url: String,
    name: String,
    type: {
      type: String,
      enum: ['manual', 'certificate', 'warranty', 'specification'],
      default: 'manual'
    }
  }]
}, { _id: false });

// SEO Schema
const SEOSchema = new mongoose.Schema({
  metaTitle: {
    type: String,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    maxlength: 160
  },
  keywords: [{
    type: String,
    trim: true
  }],
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  canonicalUrl: String,
  structuredData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

// Analytics Schema
const AnalyticsSchema = new mongoose.Schema({
  views: {
    type: Number,
    default: 0
  },
  purchases: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  revenue: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  wishlistCount: {
    type: Number,
    default: 0
  },
  cartAdditions: {
    type: Number,
    default: 0
  },
  lastSold: {
    type: Date,
    default: null
  },
  popularityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { _id: false });

// Product Flag Schema
const ProductFlagSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'quality_issue',
      'inventory_discrepancy',
      'pricing_error',
      'compliance_violation',
      'negative_reviews',
      'supplier_issue',
      'manual_review',
      'discontinued',
      'seasonal_unavailable'
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

// Enhanced Product Schema
const ProductSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 100
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  productId: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  modelNumber: {
    type: String,
    trim: true
  },
  
  // Description and Content
  description: {
    type: String,
    maxlength: 5000
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  keyFeatures: [{
    type: String,
    maxlength: 200
  }],
  highlights: [{
    type: String,
    maxlength: 100
  }],
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Physical Properties
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'inch', 'm'],
      default: 'cm'
    }
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['g', 'kg', 'lb', 'oz'],
      default: 'kg'
    }
  },
  materials: [{
    type: String,
    trim: true
  }],
  colors: [{
    name: String,
    code: String // hex color code
  }],
  
  // Pricing and Inventory
  pricing: PricingSchema,
  inventory: InventorySchema,
  
  // Media and SEO
  media: MediaSchema,
  seo: SEOSchema,
  
  // Analytics and Performance
  analytics: AnalyticsSchema,
  
  // Product Variations
  hasVariations: {
    type: Boolean,
    default: false
  },
  variations: [ProductVariationSchema],
  parentProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  
  // Status and Flags
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'out_of_stock', 'pending_approval'],
    default: 'active'
  },
  flags: [ProductFlagSchema],
  
  // Compliance and Legal
  countryOfOrigin: {
    type: String,
    trim: true
  },
  manufacturer: {
    name: String,
    address: String,
    contactInfo: String
  },
  warranty: {
    duration: Number, // in months
    type: {
      type: String,
      enum: ['manufacturer', 'seller', 'extended'],
      default: 'manufacturer'
    },
    terms: String
  },
  certifications: [{
    name: String,
    issuedBy: String,
    validUntil: Date,
    documentUrl: String
  }],
  safetyWarnings: [{
    type: String,
    maxlength: 200
  }],
  ageRestrictions: {
    minAge: Number,
    maxAge: Number,
    reason: String
  },
  
  // Admin Management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
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
  
  // Legacy fields for backward compatibility
  craftsman: {
    type: String,
    trim: true
  },
  origin: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  isNew: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  image: {
    type: String
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
ProductSchema.index({ category: 1, subcategory: 1 });
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ productId: 1 }, { sparse: true });
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ 'pricing.basePrice': 1 });
ProductSchema.index({ 'inventory.stock': 1 });
ProductSchema.index({ 'analytics.popularityScore': -1 });
ProductSchema.index({ 'analytics.revenue': -1 });
ProductSchema.index({ brand: 1, category: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ 'flags.type': 1, 'flags.resolved': 1 });
ProductSchema.index({ 'variations.sku': 1 }, { sparse: true });

// Text index for search
ProductSchema.index({
  name: 'text',
  description: 'text',
  'keyFeatures': 'text',
  brand: 'text',
  category: 'text'
});

// Virtual for available stock
ProductSchema.virtual('availableStock').get(function() {
  return Math.max(0, this.inventory.stock - this.inventory.reserved);
});

// Virtual for is low stock
ProductSchema.virtual('isLowStock').get(function() {
  return this.availableStock <= this.inventory.lowStockThreshold;
});

// Virtual for current price
ProductSchema.virtual('currentPrice').get(function() {
  return this.pricing.salePrice || this.pricing.basePrice || this.price;
});

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function() {
  if (!this.pricing.salePrice || !this.pricing.basePrice) return 0;
  return Math.round(((this.pricing.basePrice - this.pricing.salePrice) / this.pricing.basePrice) * 100);
});

// Method to update inventory
ProductSchema.methods.updateInventory = function(quantity, type = 'add', reason = '') {
  if (type === 'add') {
    this.inventory.stock += quantity;
    this.inventory.lastRestocked = new Date();
  } else if (type === 'subtract') {
    this.inventory.stock = Math.max(0, this.inventory.stock - quantity);
  } else if (type === 'set') {
    this.inventory.stock = Math.max(0, quantity);
  }
  
  this.inventory.available = Math.max(0, this.inventory.stock - this.inventory.reserved);
  
  // Update legacy stock field for backward compatibility
  this.stock = this.inventory.stock;
  
  return this.save();
};

// Method to reserve inventory
ProductSchema.methods.reserveInventory = function(quantity) {
  if (this.availableStock < quantity) {
    throw new Error('Insufficient stock available');
  }
  
  this.inventory.reserved += quantity;
  this.inventory.available = Math.max(0, this.inventory.stock - this.inventory.reserved);
  
  return this.save();
};

// Method to release reserved inventory
ProductSchema.methods.releaseReservedInventory = function(quantity) {
  this.inventory.reserved = Math.max(0, this.inventory.reserved - quantity);
  this.inventory.available = Math.max(0, this.inventory.stock - this.inventory.reserved);
  
  return this.save();
};

// Method to add flag
ProductSchema.methods.addFlag = function(flagData, adminId = null) {
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
ProductSchema.methods.resolveFlag = function(flagId, adminId, notes = '') {
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
ProductSchema.methods.updateAnalytics = function(analyticsData) {
  if (analyticsData.view) {
    this.analytics.views += 1;
  }
  
  if (analyticsData.purchase) {
    this.analytics.purchases += 1;
    this.analytics.revenue += analyticsData.purchase.amount || 0;
    this.analytics.lastSold = new Date();
  }
  
  if (analyticsData.cartAdd) {
    this.analytics.cartAdditions += 1;
  }
  
  if (analyticsData.wishlistAdd) {
    this.analytics.wishlistCount += 1;
  }
  
  // Calculate conversion rate
  if (this.analytics.views > 0) {
    this.analytics.conversionRate = (this.analytics.purchases / this.analytics.views) * 100;
  }
  
  // Update popularity score based on various factors
  this.calculatePopularityScore();
  
  return this.save();
};

// Method to calculate popularity score
ProductSchema.methods.calculatePopularityScore = function() {
  let score = 0;
  
  // Views contribution (30 points max)
  const viewScore = Math.min(30, (this.analytics.views / 1000) * 30);
  score += viewScore;
  
  // Purchase contribution (40 points max)
  const purchaseScore = Math.min(40, (this.analytics.purchases / 100) * 40);
  score += purchaseScore;
  
  // Rating contribution (20 points max)
  const ratingScore = (this.analytics.averageRating / 5) * 20;
  score += ratingScore;
  
  // Recent activity bonus (10 points max)
  const daysSinceLastSold = this.analytics.lastSold ? 
    Math.ceil((new Date() - this.analytics.lastSold) / (1000 * 60 * 60 * 24)) : 
    365;
  
  const recentActivityScore = Math.max(0, 10 - (daysSinceLastSold / 30));
  score += recentActivityScore;
  
  this.analytics.popularityScore = Math.min(100, Math.round(score));
  return this.analytics.popularityScore;
};

// Static method to get product statistics
ProductSchema.statics.getProductStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: {
          $sum: {
            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
          }
        },
        inactiveProducts: {
          $sum: {
            $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0]
          }
        },
        outOfStockProducts: {
          $sum: {
            $cond: [{ $lte: ['$inventory.stock', 0] }, 1, 0]
          }
        },
        lowStockProducts: {
          $sum: {
            $cond: [{ $lte: ['$inventory.available', '$inventory.lowStockThreshold'] }, 1, 0]
          }
        },
        totalRevenue: { $sum: '$analytics.revenue' },
        averagePrice: { $avg: '$pricing.basePrice' },
        totalViews: { $sum: '$analytics.views' },
        totalPurchases: { $sum: '$analytics.purchases' }
      }
    }
  ]);
  
  return stats[0] || {};
};

// Static method for advanced product search
ProductSchema.statics.advancedSearch = function(filters, options = {}) {
  const query = {};
  
  // Text search
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }
  
  // Category filter
  if (filters.category) {
    query.category = new RegExp(filters.category, 'i');
  }
  
  // Brand filter
  if (filters.brand) {
    query.brand = new RegExp(filters.brand, 'i');
  }
  
  // Price range
  if (filters.minPrice || filters.maxPrice) {
    query['pricing.basePrice'] = {};
    if (filters.minPrice) {
      query['pricing.basePrice'].$gte = parseFloat(filters.minPrice);
    }
    if (filters.maxPrice) {
      query['pricing.basePrice'].$lte = parseFloat(filters.maxPrice);
    }
  }
  
  // Stock filters
  if (filters.inStock === 'true') {
    query['inventory.stock'] = { $gt: 0 };
  } else if (filters.inStock === 'false') {
    query['inventory.stock'] = { $lte: 0 };
  }
  
  if (filters.lowStock === 'true') {
    query.$expr = { $lte: ['$inventory.available', '$inventory.lowStockThreshold'] };
  }
  
  // Flag filters
  if (filters.hasFlags === 'true') {
    query['flags.0'] = { $exists: true };
  }
  
  if (filters.flagType) {
    query['flags.type'] = filters.flagType;
  }
  
  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  // Date range filters
  if (filters.createdFrom || filters.createdTo) {
    query.createdAt = {};
    if (filters.createdFrom) {
      query.createdAt.$gte = new Date(filters.createdFrom);
    }
    if (filters.createdTo) {
      query.createdAt.$lte = new Date(filters.createdTo);
    }
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
    .populate('createdBy', 'profile email')
    .populate('lastModifiedBy', 'profile email')
    .populate('flags.createdBy', 'profile email')
    .populate('flags.resolvedBy', 'profile email')
    .populate('notes.createdBy', 'profile email')
    .populate('parentProduct', 'name sku');
};

// Pre-save middleware
ProductSchema.pre('save', function(next) {
  // Ensure inventory is initialized
  if (!this.inventory) {
    this.inventory = {
      stock: this.stock || 0,
      reserved: 0,
      available: this.stock || 0,
      lowStockThreshold: 10,
      autoReorderPoint: 5,
      autoReorderEnabled: false,
      suppliers: [],
      warehouseLocation: 'Main Warehouse',
      trackingEnabled: true
    };
  }
  
  // Ensure pricing is initialized
  if (!this.pricing) {
    this.pricing = {
      basePrice: this.price || 0,
      salePrice: this.originalPrice !== this.price ? this.price : null,
      currency: 'INR',
      taxRate: 0,
      priceHistory: [],
      bulkPricing: []
    };
  }
  
  // Ensure analytics is initialized
  if (!this.analytics) {
    this.analytics = {
      views: 0,
      purchases: 0,
      conversionRate: 0,
      revenue: 0,
      averageRating: this.rating || 0,
      totalReviews: 0,
      wishlistCount: 0,
      cartAdditions: 0,
      lastSold: null,
      popularityScore: 0
    };
  }
  
  // Ensure media is initialized
  if (!this.media) {
    this.media = {
      images: this.image ? [{ url: this.image, type: 'main', order: 0 }] : [],
      videos: [],
      documents: []
    };
  }
  
  // Update available stock
  this.inventory.available = Math.max(0, this.inventory.stock - this.inventory.reserved);
  
  // Update legacy fields for backward compatibility
  this.stock = this.inventory.stock;
  this.price = this.pricing.salePrice || this.pricing.basePrice;
  this.rating = this.analytics.averageRating;
  
  next();
});

module.exports = mongoose.model('Product', ProductSchema);