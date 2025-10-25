const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const realProducts = [
  {
    name: 'Handcrafted Rajasthani Wooden Chair',
    category: 'furniture',
    subcategory: 'chairs',
    price: 15000,
    originalPrice: 18000,
    discountPercentage: 16.67,
    sku: 'RWC-001',
    description: 'Exquisite handcrafted wooden chair featuring traditional Rajasthani motifs and intricate carvings. Made from premium teak wood by skilled artisans in Jodhpur.',
    shortDescription: 'Traditional Rajasthani wooden chair with intricate carvings',
    craftsman: 'Master Ravi Kumar',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop'
    ],
    materials: ['Teak Wood', 'Natural Finish', 'Brass Fittings'],
    dimensions: '45cm W x 50cm D x 90cm H',
    weight: '12kg',
    origin: 'Jodhpur, Rajasthan',
    rating: 4.8,
    reviewCount: 24,
    isNew: true,
    isFeatured: true,
    isActive: true,
    stock: 8,
    minQuantity: 1,
    maxQuantity: 4,
    tags: ['handcrafted', 'traditional', 'rajasthani', 'wooden', 'chair'],
    hsn: '94036000',
    taxRate: 0.18,
    careInstructions: ['Dust regularly with soft cloth', 'Avoid direct sunlight', 'Use wood polish monthly'],
    warranty: '2 years against manufacturing defects'
  },
  {
    name: 'Ornate Brass Mirror Frame',
    category: 'decor',
    subcategory: 'mirrors',
    price: 8500,
    originalPrice: 12000,
    discountPercentage: 29.17,
    sku: 'BMF-002',
    description: 'Stunning brass mirror frame with intricate peacock and floral designs. Hand-forged by master craftsmen using traditional techniques passed down through generations.',
    shortDescription: 'Ornate brass mirror with peacock motifs',
    craftsman: 'Artisan Priya Sharma',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop'
    ],
    materials: ['Brass', 'Mirror Glass', 'Antique Finish'],
    dimensions: '60cm W x 4cm D x 80cm H',
    weight: '5kg',
    origin: 'Jodhpur, Rajasthan',
    rating: 4.9,
    reviewCount: 18,
    isNew: false,
    isFeatured: true,
    isActive: true,
    stock: 12,
    minQuantity: 1,
    maxQuantity: 3,
    tags: ['brass', 'mirror', 'ornate', 'peacock', 'traditional'],
    hsn: '70099100',
    taxRate: 0.18,
    careInstructions: ['Clean with dry cloth only', 'Avoid chemical cleaners', 'Handle with care'],
    warranty: '1 year against manufacturing defects'
  },
  {
    name: 'Carved Wooden Coffee Table',
    category: 'furniture',
    subcategory: 'tables',
    price: 22000,
    originalPrice: 28000,
    discountPercentage: 21.43,
    sku: 'WCT-003',
    description: 'Elegant carved wooden coffee table featuring traditional Rajasthani patterns. Perfect centerpiece for your living room, combining functionality with artistic beauty.',
    shortDescription: 'Carved wooden coffee table with traditional patterns',
    craftsman: 'Master Gopal Singh',
    image: 'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop'
    ],
    materials: ['Sheesham Wood', 'Natural Polish', 'Brass Inlay'],
    dimensions: '120cm W x 60cm D x 45cm H',
    weight: '25kg',
    origin: 'Jodhpur, Rajasthan',
    rating: 4.7,
    reviewCount: 31,
    isNew: true,
    isFeatured: false,
    isActive: true,
    stock: 5,
    minQuantity: 1,
    maxQuantity: 2,
    tags: ['wooden', 'coffee-table', 'carved', 'sheesham', 'traditional'],
    hsn: '94036000',
    taxRate: 0.18,
    careInstructions: ['Use coasters for hot items', 'Polish wood monthly', 'Avoid water spills'],
    warranty: '2 years against manufacturing defects'
  },
  {
    name: 'Traditional Ceramic Vase',
    category: 'decor',
    subcategory: 'vases',
    price: 4500,
    originalPrice: 6000,
    discountPercentage: 25,
    sku: 'TCV-004',
    description: 'Beautiful hand-painted ceramic vase showcasing traditional Rajasthani art. Perfect for displaying flowers or as a standalone decorative piece.',
    shortDescription: 'Hand-painted ceramic vase with traditional art',
    craftsman: 'Artisan Sunita Devi',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&h=800&fit=crop'
    ],
    materials: ['Ceramic', 'Hand-painted', 'Glazed Finish'],
    dimensions: '25cm W x 25cm D x 40cm H',
    weight: '2kg',
    origin: 'Jodhpur, Rajasthan',
    rating: 4.5,
    reviewCount: 15,
    isNew: false,
    isFeatured: false,
    isActive: true,
    stock: 20,
    minQuantity: 1,
    maxQuantity: 5,
    tags: ['ceramic', 'vase', 'hand-painted', 'traditional', 'decorative'],
    hsn: '69139000',
    taxRate: 0.18,
    careInstructions: ['Handle with care', 'Clean with damp cloth', 'Avoid harsh chemicals'],
    warranty: '6 months against manufacturing defects'
  },
  {
    name: 'Antique Wooden Storage Chest',
    category: 'furniture',
    subcategory: 'storage',
    price: 35000,
    originalPrice: 42000,
    discountPercentage: 16.67,
    sku: 'WSC-005',
    description: 'Magnificent antique-style wooden storage chest with brass fittings and traditional lock mechanism. Ideal for storing linens, documents, or treasured items.',
    shortDescription: 'Antique wooden storage chest with brass fittings',
    craftsman: 'Master Kailash Chand',
    image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop'
    ],
    materials: ['Mango Wood', 'Brass Fittings', 'Antique Finish'],
    dimensions: '100cm W x 50cm D x 40cm H',
    weight: '30kg',
    origin: 'Jodhpur, Rajasthan',
    rating: 4.6,
    reviewCount: 22,
    isNew: true,
    isFeatured: true,
    isActive: true,
    stock: 3,
    minQuantity: 1,
    maxQuantity: 1,
    tags: ['wooden', 'storage', 'chest', 'antique', 'brass'],
    hsn: '94036000',
    taxRate: 0.18,
    careInstructions: ['Oil lock mechanism monthly', 'Keep in dry place', 'Polish brass fittings'],
    warranty: '2 years against manufacturing defects'
  }
];

async function addProducts() {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Add new products
    const products = await Product.insertMany(realProducts);
    console.log(`Added ${products.length} real products successfully!`);
    
    products.forEach(product => {
      console.log(`- ${product.name} (${product.category})`);
    });

  } catch (error) {
    console.error('Error adding products:', error);
  } finally {
    mongoose.connection.close();
  }
}

addProducts();