const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

console.log('Testing database connection...');
console.log('MongoDB URI:', process.env.MONGO_URI ? 'Configured' : 'Not configured');

async function testDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
    });
    console.log('✅ Connected to MongoDB successfully');

    // Test product count
    const count = await Product.countDocuments();
    console.log(`📊 Total products in database: ${count}`);

    // Test fetching products
    const products = await Product.find().limit(3);
    console.log(`🛍️  Sample products:`);
    products.forEach(product => {
      console.log(`  - ${product.name} (${product.category})`);
    });

    // Test furniture products
    const furnitureCount = await Product.countDocuments({ category: 'furniture' });
    console.log(`🪑 Furniture products: ${furnitureCount}`);

    // Test decor products
    const decorCount = await Product.countDocuments({ category: 'decor' });
    console.log(`🏺 Decor products: ${decorCount}`);

    console.log('✅ Database test completed successfully');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testDatabase();