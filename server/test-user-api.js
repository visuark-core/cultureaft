const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testUserAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Test getUserStats method
    console.log('Testing User.getUserStats()...');
    const stats = await User.getUserStats();
    console.log('Stats result:', stats);

    // Test advancedSearch method
    console.log('Testing User.advancedSearch()...');
    const users = await User.advancedSearch({}, { page: 1, limit: 5 });
    console.log('Users found:', users.length);
    console.log('First user:', users[0] ? users[0].email : 'No users found');

    // Test basic find
    console.log('Testing basic User.find()...');
    const allUsers = await User.find().limit(5);
    console.log('All users count:', allUsers.length);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

testUserAPI();