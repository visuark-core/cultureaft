const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for product population');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Products data from your existing products.ts file
const productsData = [
  {
    id: '1',
    name: 'Royal Carved Throne Chair',
    category: 'Furniture',
    price: 45000,
    originalPrice: 55000,
    image: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Intricately carved mahogany throne chair with traditional Rajasthani motifs and gold leaf detailing. Features royal peacock designs and comfortable velvet upholstery.',
    craftsman: 'Master Ravi Sharma',
    isNew: true,
    isFeatured: true,
    rating: 4.8,
    materials: ['Mahogany Wood', 'Gold Leaf', 'Velvet'],
    dimensions: '120cm H x 70cm W x 65cm D',
    weight: '35kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '2',
    name: 'Ornate Storage Cabinet',
    category: 'Furniture',
    price: 32000,
    originalPrice: 40000,
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Hand-painted storage cabinet with brass fittings and mirror work. Features multiple compartments and traditional Marwari patterns.',
    craftsman: 'Artisan Mukesh Joshi',
    isNew: false,
    isFeatured: true,
    rating: 4.6,
    materials: ['Sheesham Wood', 'Brass', 'Mirror Work'],
    dimensions: '180cm H x 90cm W x 40cm D',
    weight: '45kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '3',
    name: 'Decorative Mirror Frame',
    category: 'Decor',
    price: 8500,
    originalPrice: 12000,
    image: 'https://images.pexels.com/photos/6580226/pexels-photo-6580226.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Elaborate mirror frame with traditional peacock and floral designs. Hand-carved from mango wood with antique gold finish.',
    craftsman: 'Master Priya Devi',
    isNew: true,
    isFeatured: true,
    rating: 4.9,
    materials: ['Mango Wood', 'Antique Gold Finish'],
    dimensions: '90cm H x 60cm W x 5cm D',
    weight: '8kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '4',
    name: 'Wooden Coffee Table',
    category: 'Furniture',
    price: 18000,
    originalPrice: 22000,
    image: 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Round coffee table with intricate lattice work and brass inlays. Perfect centerpiece for traditional or contemporary settings.',
    craftsman: 'Craftsman Gopal Singh',
    isNew: false,
    isFeatured: true,
    rating: 4.5,
    materials: ['Teak Wood', 'Brass Inlays'],
    dimensions: '45cm H x 80cm Diameter',
    weight: '20kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '5',
    name: 'Traditional Bookshelf',
    category: 'Furniture',
    price: 28000,
    originalPrice: 35000,
    image: 'https://images.pexels.com/photos/2177482/pexels-photo-2177482.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Five-tier bookshelf with carved panels and adjustable shelves. Features traditional Rajasthani geometric patterns.',
    craftsman: 'Master Lakhan Singh',
    isNew: true,
    isFeatured: false,
    rating: 4.7,
    materials: ['Rosewood', 'Brass Hardware'],
    dimensions: '200cm H x 100cm W x 35cm D',
    weight: '40kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '6',
    name: 'Carved Wall Art Panel',
    category: 'Decor',
    price: 12000,
    originalPrice: 15000,
    image: 'https://images.pexels.com/photos/6492400/pexels-photo-6492400.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Hand-carved wooden wall art depicting scenes from Rajasthani folklore. Intricate details with natural wood finish.',
    craftsman: 'Artisan Devi Lal',
    isNew: false,
    isFeatured: false,
    rating: 4.4,
    materials: ['Mango Wood', 'Natural Finish'],
    dimensions: '100cm H x 150cm W x 8cm D',
    weight: '15kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '7',
    name: 'Vintage Trunk Storage',
    category: 'Furniture',
    price: 22000,
    originalPrice: 28000,
    image: 'https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Antique-style storage trunk with brass corners and traditional lock. Perfect for storing linens or as a coffee table.',
    craftsman: 'Master Kailash Chand',
    isNew: true,
    isFeatured: false,
    rating: 4.6,
    materials: ['Aged Wood', 'Brass Fittings'],
    dimensions: '50cm H x 120cm W x 60cm D',
    weight: '30kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '8',
    name: 'Decorative Table Lamp',
    category: 'Decor',
    price: 6500,
    originalPrice: 8500,
    image: 'https://images.pexels.com/photos/1910236/pexels-photo-1910236.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Traditional table lamp with hand-painted ceramic base and handwoven fabric shade. Creates warm ambient lighting.',
    craftsman: 'Artisan Sunita Devi',
    isNew: false,
    isFeatured: false,
    rating: 4.3,
    materials: ['Ceramic', 'Handwoven Fabric'],
    dimensions: '45cm H x 25cm Diameter',
    weight: '3kg',
    origin: 'Jodhpur, Rajasthan'
  }
];

// Convert products data to match our schema
const convertProductsData = () => {
  return productsData.map(product => ({
    name: product.name,
    category: product.category,
    price: product.price,
    originalPrice: product.originalPrice,
    sku: `SKU-${product.id.padStart(3, '0')}`,
    description: product.description,
    craftsman: product.craftsman,
    image: product.image,
    materials: product.materials,
    dimensions: product.dimensions,
    weight: product.weight,
    origin: product.origin,
    rating: product.rating,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    stock: Math.floor(Math.random() * 50) + 10 // Random stock between 10-60
  }));
};

// Main population function
const populateProducts = async () => {
  try {
    console.log('Starting product population...');

    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log(`Found ${existingProducts} existing products. Skipping population.`);
      console.log('To repopulate, first clear the products collection.');
      return;
    }

    // Populate products
    console.log('Populating products...');
    const productsToSeed = convertProductsData();
    const seededProducts = await Product.insertMany(productsToSeed);
    console.log(`✅ Successfully populated ${seededProducts.length} products`);

    // Print summary
    console.log('\n📊 Product Population Summary:');
    console.log(`Total Products: ${seededProducts.length}`);
    
    const categories = [...new Set(seededProducts.map(p => p.category))];
    console.log(`Categories: ${categories.join(', ')}`);
    
    const totalValue = seededProducts.reduce((sum, p) => sum + p.price, 0);
    console.log(`Total Catalog Value: ₹${totalValue.toLocaleString('en-IN')}`);

  } catch (error) {
    console.error('❌ Error populating products:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run population if this file is executed directly
if (require.main === module) {
  connectDB().then(() => {
    populateProducts();
  });
}

module.exports = { populateProducts };