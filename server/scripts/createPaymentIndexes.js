/**
 * Script to create database indexes for payment-related collections
 * This ensures optimal query performance for payment operations
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function createPaymentIndexes() {
  try {
    console.log('Creating payment-related database indexes...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create indexes for payments collection
    console.log('Creating indexes for payments collection...');
    
    const paymentsCollection = db.collection('payments');
    
    await paymentsCollection.createIndexes([
      { key: { orderId: 1 }, name: 'orderId_1' },
      { key: { razorpayOrderId: 1 }, name: 'razorpayOrderId_1', unique: true },
      { key: { razorpayPaymentId: 1 }, name: 'razorpayPaymentId_1', sparse: true },
      { key: { status: 1 }, name: 'status_1' },
      { key: { receipt: 1 }, name: 'receipt_1' },
      { key: { createdAt: -1 }, name: 'createdAt_-1' },
      { key: { status: 1, createdAt: -1 }, name: 'status_1_createdAt_-1' },
      { key: { razorpayOrderId: 1, status: 1 }, name: 'razorpayOrderId_1_status_1' },
      { key: { orderId: 1, status: 1 }, name: 'orderId_1_status_1' }
    ]);

    console.log('Payment collection indexes created successfully');

    // Create additional indexes for orders collection
    console.log('Creating additional indexes for orders collection...');
    
    const ordersCollection = db.collection('orders');
    
    await ordersCollection.createIndexes([
      { key: { paymentStatus: 1 }, name: 'paymentStatus_1' },
      { key: { razorpayOrderId: 1 }, name: 'razorpayOrderId_1', sparse: true },
      { key: { transactionId: 1 }, name: 'transactionId_1', sparse: true },
      { key: { paymentMethod: 1, paymentStatus: 1 }, name: 'paymentMethod_1_paymentStatus_1' },
      { key: { paymentStatus: 1, createdAt: -1 }, name: 'paymentStatus_1_createdAt_-1' }
    ]);

    console.log('Order collection indexes created successfully');

    // List all indexes to verify
    console.log('\nPayment collection indexes:');
    const paymentIndexes = await paymentsCollection.listIndexes().toArray();
    paymentIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\nOrder collection indexes:');
    const orderIndexes = await ordersCollection.listIndexes().toArray();
    orderIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\nAll indexes created successfully!');

  } catch (error) {
    console.error('Index creation failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run index creation if this script is executed directly
if (require.main === module) {
  createPaymentIndexes();
}

module.exports = createPaymentIndexes;