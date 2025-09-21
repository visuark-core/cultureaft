const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
  // 1️⃣ Product Identification
  title: { type: String, required: true },
  brand: String,
  sku: String,
  productId: String,
  category: String,
  modelNumber: String,
  parentChild: String,

  // 2️⃣ Product Description & Content
  description: String,
  keyFeatures: String,
  highlights: String,
  searchKeywords: String,
  metaTitle: String,
  metaDescription: String,
  manufacturer: String,
  warranty: String,
  instructions: String, // could be a file path or text

  // 3️⃣ Pricing & Offers
  regularPrice: Number,
  discountPrice: Number,
  minPrice: Number,
  maxPrice: Number,
  currency: String,
  offerStart: Date,
  offerEnd: Date,
  taxVat: String,

  // 4️⃣ Inventory & Stock
  stockQty: Number,
  warehouse: String,
  safetyStock: Number,
  restockDate: Date,
  fulfillmentType: String,

  // 5️⃣ Shipping & Delivery
  handlingTime: Number,
  shippingWeight: Number,
  packageDimensions: String,
  shippingTemplate: String,
  deliveryAvailability: String,

  // 6️⃣ Media & Visuals
  mainImage: String, // file path or URL
  additionalImages: [String],
  lifestyleImages: [String],
  infographicImages: [String],
  view360: [String],
  productVideos: [String],

  // 7️⃣ Variations
  sizeOptions: String,
  colorOptions: String,
  styleOptions: String,
  materialType: String,
  quantityPacks: String,

  // 8️⃣ Compliance & Legal
  countryOfOrigin: String,
  complianceCertificates: [String], // file paths or URLs
  expiryDate: Date,
  safetyWarnings: String,
  ageRestrictions: String,
  productCondition: String,

  // 9️⃣ Extra Attributes
  customTags: String,
  seasonalAvailability: String,
  assemblyRequired: String,
  includedItems: String,
  careInstructions: String,
  returnPolicy: String,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);
