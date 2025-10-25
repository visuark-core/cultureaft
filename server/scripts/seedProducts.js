const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config({ path: './.env' });

console.log('MONGO_URI:', process.env.MONGO_URI);

const sampleProducts = [
  {
    name: "Handwoven Cotton Saree",
    category: "Textiles",
    subcategory: "Sarees",
    price: 2500,
    originalPrice: 3000,
    discountPercentage: 16.67,
    sku: "SAR001",
    description: "Beautiful handwoven cotton saree with traditional patterns. Perfect for special occasions and daily wear.",
    shortDescription: "Handwoven cotton saree with traditional patterns",
    craftsman: "Rajesh Kumar",
    image: "https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Saree",
    images: [
      "https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Saree+1",
      "https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Saree+2"
    ],
    materials: ["Cotton", "Natural Dyes"],
    dimensions: "5.5m x 1.2m",
    weight: "500g",
    origin: "West Bengal",
    rating: 4.5,
    reviewCount: 23,
    isNew: true,
    isFeatured: true,
    isActive: true,
    stock: 15,
    minQuantity: 1,
    maxQuantity: 3,
    tags: ["handwoven", "cotton", "traditional", "saree"],
    hsn: "5208",
    taxRate: 0.05,
    careInstructions: ["Hand wash only", "Dry in shade", "Iron on medium heat"],
    warranty: "No warranty",
    shippingWeight: 0.6,
    shippingDimensions: { length: 30, width: 25, height: 5 },
    metaTitle: "Handwoven Cotton Saree - Traditional Indian Wear",
    metaDescription: "Buy authentic handwoven cotton saree with traditional patterns. Perfect for special occasions."
  },
  {
    name: "Brass Decorative Lamp",
    category: "Home Decor",
    subcategory: "Lighting",
    price: 1800,
    originalPrice: 2200,
    discountPercentage: 18.18,
    sku: "LAMP001",
    description: "Elegant brass decorative lamp with intricate carvings. Handcrafted by skilled artisans.",
    shortDescription: "Elegant brass decorative lamp with intricate carvings",
    craftsman: "Mohan Lal",
    image: "https://via.placeholder.com/400x400/FFD93D/FFFFFF?text=Brass+Lamp",
    images: [
      "https://via.placeholder.com/400x400/FFD93D/FFFFFF?text=Lamp+1",
      "https://via.placeholder.com/400x400/6BCF7F/FFFFFF?text=Lamp+2"
    ],
    materials: ["Brass", "Cotton Wick"],
    dimensions: "15cm x 15cm x 25cm",
    weight: "800g",
    origin: "Rajasthan",
    rating: 4.2,
    reviewCount: 18,
    isNew: false,
    isFeatured: true,
    isActive: true,
    stock: 8,
    minQuantity: 1,
    maxQuantity: 2,
    tags: ["brass", "decorative", "lamp", "handcrafted"],
    hsn: "8306",
    taxRate: 0.18,
    careInstructions: ["Clean with dry cloth", "Use brass cleaner monthly", "Keep away from moisture"],
    warranty: "6 months manufacturing defect",
    shippingWeight: 1.0,
    shippingDimensions: { length: 20, width: 20, height: 30 },
    metaTitle: "Brass Decorative Lamp - Handcrafted Home Decor",
    metaDescription: "Beautiful brass decorative lamp with intricate carvings. Perfect for home decoration."
  },
  {
    name: "Wooden Jewelry Box",
    category: "Accessories",
    subcategory: "Storage",
    price: 1200,
    originalPrice: 1500,
    discountPercentage: 20,
    sku: "JB001",
    description: "Handcrafted wooden jewelry box with multiple compartments. Perfect for organizing jewelry.",
    shortDescription: "Handcrafted wooden jewelry box with multiple compartments",
    craftsman: "Suresh Sharma",
    image: "https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Jewelry+Box",
    images: [
      "https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Box+1",
      "https://via.placeholder.com/400x400/D2691E/FFFFFF?text=Box+2"
    ],
    materials: ["Sheesham Wood", "Velvet Lining"],
    dimensions: "20cm x 15cm x 8cm",
    weight: "600g",
    origin: "Karnataka",
    rating: 4.7,
    reviewCount: 31,
    isNew: false,
    isFeatured: false,
    isActive: true,
    stock: 12,
    minQuantity: 1,
    maxQuantity: 5,
    tags: ["wooden", "jewelry", "box", "storage", "handcrafted"],
    hsn: "4420",
    taxRate: 0.12,
    careInstructions: ["Dust with soft cloth", "Avoid water contact", "Polish occasionally"],
    warranty: "1 year manufacturing defect",
    shippingWeight: 0.8,
    shippingDimensions: { length: 25, width: 20, height: 12 },
    metaTitle: "Wooden Jewelry Box - Handcrafted Storage Solution",
    metaDescription: "Organize your jewelry with this beautiful handcrafted wooden jewelry box."
  },
  {
    name: "Ceramic Tea Set",
    category: "Kitchenware",
    subcategory: "Dinnerware",
    price: 3200,
    originalPrice: 4000,
    discountPercentage: 20,
    sku: "TEA001",
    description: "Beautiful ceramic tea set with traditional blue pottery design. Includes teapot, 4 cups, and saucers.",
    shortDescription: "Ceramic tea set with traditional blue pottery design",
    craftsman: "Ramesh Pottery Works",
    image: "https://via.placeholder.com/400x400/4169E1/FFFFFF?text=Tea+Set",
    images: [
      "https://via.placeholder.com/400x400/4169E1/FFFFFF?text=Tea+Set+1",
      "https://via.placeholder.com/400x400/87CEEB/FFFFFF?text=Tea+Set+2"
    ],
    materials: ["Ceramic", "Food Grade Glaze"],
    dimensions: "Teapot: 15cm x 12cm x 18cm",
    weight: "2.5kg",
    origin: "Rajasthan",
    rating: 4.4,
    reviewCount: 27,
    isNew: true,
    isFeatured: true,
    isActive: true,
    stock: 6,
    minQuantity: 1,
    maxQuantity: 2,
    tags: ["ceramic", "tea set", "blue pottery", "kitchenware"],
    hsn: "6912",
    taxRate: 0.18,
    careInstructions: ["Hand wash recommended", "Microwave safe", "Avoid sudden temperature changes"],
    warranty: "6 months against manufacturing defects",
    shippingWeight: 3.0,
    shippingDimensions: { length: 35, width: 25, height: 20 },
    metaTitle: "Ceramic Tea Set - Traditional Blue Pottery Design",
    metaDescription: "Enjoy tea in style with this beautiful ceramic tea set featuring traditional blue pottery design."
  },
  {
    name: "Embroidered Cushion Cover",
    category: "Home Decor",
    subcategory: "Furnishing",
    price: 450,
    originalPrice: 600,
    discountPercentage: 25,
    sku: "CC001",
    description: "Hand-embroidered cushion cover with floral patterns. Made from premium cotton fabric.",
    shortDescription: "Hand-embroidered cushion cover with floral patterns",
    craftsman: "Meera Devi",
    image: "https://via.placeholder.com/400x400/FF69B4/FFFFFF?text=Cushion",
    images: [
      "https://via.placeholder.com/400x400/FF69B4/FFFFFF?text=Cushion+1",
      "https://via.placeholder.com/400x400/FFB6C1/FFFFFF?text=Cushion+2"
    ],
    materials: ["Cotton", "Embroidery Thread"],
    dimensions: "40cm x 40cm",
    weight: "150g",
    origin: "Gujarat",
    rating: 4.6,
    reviewCount: 42,
    isNew: false,
    isFeatured: false,
    isActive: true,
    stock: 25,
    minQuantity: 1,
    maxQuantity: 10,
    tags: ["embroidered", "cushion cover", "cotton", "floral"],
    hsn: "6302",
    taxRate: 0.12,
    careInstructions: ["Machine wash cold", "Gentle cycle", "Iron on reverse side"],
    warranty: "No warranty",
    shippingWeight: 0.2,
    shippingDimensions: { length: 45, width: 45, height: 2 },
    metaTitle: "Embroidered Cushion Cover - Handcrafted Home Decor",
    metaDescription: "Beautiful hand-embroidered cushion cover with floral patterns. Perfect for home decoration."
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${insertedProducts.length} sample products`);

    console.log('Sample products:');
    insertedProducts.forEach(product => {
      console.log(`- ${product.name} (${product.sku}) - ₹${product.price}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedProducts();