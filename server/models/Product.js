const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  subcategory: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  shortDescription: {
    type: String,
    trim: true,
  },
  craftsman: {
    type: String,
    trim: true,
  },
  // Main product image (Cloudinary URL)
  image: {
    type: String,
    required: true,
  },
  // Additional product images (Cloudinary URLs)
  images: [{
    type: String,
  }],
  // Cloudinary public IDs for image management
  imagePublicIds: [{
    type: String,
  }],
  materials: [{
    type: String,
    trim: true,
  }],
  dimensions: {
    type: String,
    trim: true,
  },
  weight: {
    type: String,
    trim: true,
  },
  origin: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isNew: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  minQuantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  maxQuantity: {
    type: Number,
    default: 10,
    min: 1,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  // HSN code for tax purposes
  hsn: {
    type: String,
    trim: true,
  },
  taxRate: {
    type: Number,
    default: 0.18, // 18% GST
    min: 0,
    max: 1,
  },
  // Care instructions
  careInstructions: [{
    type: String,
    trim: true,
  }],
  warranty: {
    type: String,
    trim: true,
  },
  // Shipping details
  shippingWeight: {
    type: Number,
    min: 0,
  },
  shippingDimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
  },
  // SEO fields
  metaTitle: {
    type: String,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
  },
  // Admin tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Index for efficient querying
ProductSchema.index({ category: 1 });
// Note: sku already has unique index from schema definition
ProductSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', ProductSchema);