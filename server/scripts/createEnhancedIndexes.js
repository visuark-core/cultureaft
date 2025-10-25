const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure schemas are registered
const Order = require('../models/Order');
const Analytics = require('../models/Analytics');
const DeliveryAgent = require('../models/DeliveryAgent');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Payment = require('../models/Payment');

async function createEnhancedIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    // Create indexes for Order collection
    console.log('Creating indexes for Order collection...');
    const orderCollection = mongoose.connection.db.collection('orders');
    
    // Basic indexes
    await orderCollection.createIndex({ orderNumber: 1 }, { unique: true });
    await orderCollection.createIndex({ orderId: 1 }, { unique: true });
    await orderCollection.createIndex({ 'customer.customerId': 1 });
    await orderCollection.createIndex({ status: 1 });
    await orderCollection.createIndex({ createdAt: -1 });
    await orderCollection.createIndex({ updatedAt: -1 });
    
    // Payment indexes
    await orderCollection.createIndex({ 'payment.status': 1 });
    await orderCollection.createIndex({ 'payment.razorpayOrderId': 1 }, { sparse: true });
    await orderCollection.createIndex({ 'payment.razorpayPaymentId': 1 }, { sparse: true });
    await orderCollection.createIndex({ 'payment.transactionId': 1 }, { sparse: true });
    await orderCollection.createIndex({ 'payment.method': 1, 'payment.status': 1 });
    
    // Product and inventory indexes
    await orderCollection.createIndex({ 'items.productId': 1 });
    await orderCollection.createIndex({ 'items.category': 1 });
    await orderCollection.createIndex({ 'items.sku': 1 });
    
    // Delivery indexes
    await orderCollection.createIndex({ 'delivery.assignedAgent': 1 });
    await orderCollection.createIndex({ 'shipping.estimatedDelivery': 1 });
    await orderCollection.createIndex({ 'shipping.trackingNumber': 1 }, { sparse: true });
    
    // Compound indexes for analytics
    await orderCollection.createIndex({ status: 1, createdAt: -1 });
    await orderCollection.createIndex({ 'payment.status': 1, createdAt: -1 });
    await orderCollection.createIndex({ status: 1, 'items.category': 1 });
    await orderCollection.createIndex({ 'customer.customerId': 1, status: 1 });
    await orderCollection.createIndex({ 'payment.method': 1, 'payment.status': 1, createdAt: -1 });
    await orderCollection.createIndex({ 'delivery.assignedAgent': 1, status: 1 });
    
    // Geographic indexes
    await orderCollection.createIndex({ 'shipping.address.pincode': 1 });
    await orderCollection.createIndex({ 'shipping.address.city': 1, 'shipping.address.state': 1 });
    
    // Text search index
    await orderCollection.createIndex({
      orderNumber: 'text',
      'customer.name': 'text',
      'customer.email': 'text',
      'customer.phone': 'text',
      'items.name': 'text'
    });
    
    console.log('Order indexes created successfully');

    // Create indexes for Analytics collection
    console.log('Creating indexes for Analytics collection...');
    const analyticsCollection = mongoose.connection.db.collection('analytics');
    
    await analyticsCollection.createIndex({ date: -1, period: 1 });
    await analyticsCollection.createIndex({ period: 1, createdAt: -1 });
    await analyticsCollection.createIndex({ isRealTime: 1, lastUpdated: -1 });
    await analyticsCollection.createIndex({ date: 1, period: 1 }, { unique: true });
    
    // Analytics compound indexes
    await analyticsCollection.createIndex({ 'metrics.orders.total': -1, date: -1 });
    await analyticsCollection.createIndex({ 'metrics.revenue.total': -1, date: -1 });
    await analyticsCollection.createIndex({ 'metrics.customers.total': -1, date: -1 });
    
    // Product analytics indexes
    await analyticsCollection.createIndex({
      'products.topSelling.name': 'text',
      'products.categories.category': 'text'
    });
    
    console.log('Analytics indexes created successfully');

    // Create indexes for DeliveryAgent collection
    console.log('Creating indexes for DeliveryAgent collection...');
    const deliveryAgentCollection = mongoose.connection.db.collection('deliveryagents');
    
    // Basic indexes
    await deliveryAgentCollection.createIndex({ 'profile.employeeId': 1 }, { unique: true });
    await deliveryAgentCollection.createIndex({ 'profile.phone': 1 }, { unique: true });
    await deliveryAgentCollection.createIndex({ 'profile.email': 1 }, { unique: true });
    await deliveryAgentCollection.createIndex({ 'employment.status': 1 });
    await deliveryAgentCollection.createIndex({ 'availability.isAvailable': 1 });
    await deliveryAgentCollection.createIndex({ 'availability.currentOrders': 1 });
    
    // Location indexes
    await deliveryAgentCollection.createIndex({ 
      'location.current.latitude': 1, 
      'location.current.longitude': 1 
    });
    await deliveryAgentCollection.createIndex({ 'location.assignedZones.pincodes': 1 });
    await deliveryAgentCollection.createIndex({ 'location.assignedZones.cities': 1 });
    
    // Performance indexes
    await deliveryAgentCollection.createIndex({ 'performance.customerRating': -1 });
    await deliveryAgentCollection.createIndex({ 'performance.onTimeDeliveryRate': -1 });
    await deliveryAgentCollection.createIndex({ 'performance.totalDeliveries': -1 });
    
    // Compound indexes
    await deliveryAgentCollection.createIndex({ 
      'employment.status': 1, 
      'availability.isAvailable': 1 
    });
    await deliveryAgentCollection.createIndex({ 
      'location.assignedZones.pincodes': 1, 
      'availability.isAvailable': 1 
    });
    
    // Text search index
    await deliveryAgentCollection.createIndex({
      'profile.name': 'text',
      'profile.employeeId': 'text',
      'profile.phone': 'text',
      'profile.email': 'text'
    });
    
    console.log('DeliveryAgent indexes created successfully');

    // Create additional indexes for existing collections
    console.log('Creating additional indexes for existing collections...');
    
    // Customer collection indexes
    const customerCollection = mongoose.connection.db.collection('customers');
    await customerCollection.createIndex({ customerId: 1 }, { unique: true });
    await customerCollection.createIndex({ email: 1 }, { unique: true });
    await customerCollection.createIndex({ registrationDate: -1 });
    await customerCollection.createIndex({ totalOrders: -1 });
    await customerCollection.createIndex({ totalSpent: -1 });
    await customerCollection.createIndex({ status: 1 });
    await customerCollection.createIndex({ lastOrderDate: -1 });
    
    // Product collection indexes
    const productCollection = mongoose.connection.db.collection('products');
    await productCollection.createIndex({ sku: 1 }, { unique: true });
    await productCollection.createIndex({ category: 1 });
    await productCollection.createIndex({ price: 1 });
    await productCollection.createIndex({ stock: 1 });
    await productCollection.createIndex({ isFeatured: 1 });
    await productCollection.createIndex({ isNew: 1 });
    await productCollection.createIndex({ rating: -1 });
    await productCollection.createIndex({ 
      name: 'text', 
      description: 'text', 
      category: 'text' 
    });
    
    // Payment collection indexes (if exists)
    const paymentCollection = mongoose.connection.db.collection('payments');
    await paymentCollection.createIndex({ orderId: 1 });
    await paymentCollection.createIndex({ razorpayOrderId: 1 }, { unique: true });
    await paymentCollection.createIndex({ razorpayPaymentId: 1 }, { sparse: true });
    await paymentCollection.createIndex({ status: 1 });
    await paymentCollection.createIndex({ createdAt: -1 });
    await paymentCollection.createIndex({ status: 1, createdAt: -1 });
    
    console.log('All indexes created successfully');

    // Create TTL indexes for temporary data
    console.log('Creating TTL indexes for data cleanup...');
    
    // TTL index for analytics real-time data (expire after 7 days)
    await analyticsCollection.createIndex(
      { lastUpdated: 1 }, 
      { 
        expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
        partialFilterExpression: { isRealTime: true }
      }
    );
    
    // TTL index for delivery agent location updates (expire after 24 hours)
    await deliveryAgentCollection.createIndex(
      { 'location.lastUpdated': 1 }, 
      { expireAfterSeconds: 24 * 60 * 60 } // 24 hours
    );
    
    console.log('TTL indexes created successfully');

    // Verify indexes
    console.log('\nVerifying created indexes...');
    
    const orderIndexes = await orderCollection.listIndexes().toArray();
    console.log(`Order collection has ${orderIndexes.length} indexes`);
    
    const analyticsIndexes = await analyticsCollection.listIndexes().toArray();
    console.log(`Analytics collection has ${analyticsIndexes.length} indexes`);
    
    const deliveryAgentIndexes = await deliveryAgentCollection.listIndexes().toArray();
    console.log(`DeliveryAgent collection has ${deliveryAgentIndexes.length} indexes`);
    
    const customerIndexes = await customerCollection.listIndexes().toArray();
    console.log(`Customer collection has ${customerIndexes.length} indexes`);
    
    const productIndexes = await productCollection.listIndexes().toArray();
    console.log(`Product collection has ${productIndexes.length} indexes`);
    
    const paymentIndexes = await paymentCollection.listIndexes().toArray();
    console.log(`Payment collection has ${paymentIndexes.length} indexes`);

    console.log('\n✅ All enhanced indexes created successfully!');
    console.log('Database is optimized for real-time analytics and efficient querying.');

  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createEnhancedIndexes();
}

module.exports = createEnhancedIndexes;