/**
 * Migration script to update existing orders for Razorpay integration
 * This script adds the new payment-related fields to existing orders
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Order = require('../models/Order');

async function migrateOrders() {
  try {
    console.log('Starting order migration for Razorpay integration...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all orders that don't have the new fields
    const ordersToMigrate = await Order.find({
      $or: [
        { paymentMethod: { $exists: false } },
        { finalAmount: { $exists: false } },
        { taxAmount: { $exists: false } }
      ]
    });

    console.log(`Found ${ordersToMigrate.length} orders to migrate`);

    let migratedCount = 0;

    for (const order of ordersToMigrate) {
      const updateData = {};

      // Set default payment method if not exists
      if (!order.paymentMethod) {
        updateData.paymentMethod = 'razorpay';
      }

      // Calculate tax amount if not exists (18% GST)
      if (!order.taxAmount && order.totalAmount) {
        updateData.taxAmount = Math.round(order.totalAmount * 0.18);
      }

      // Set final amount if not exists
      if (!order.finalAmount && order.totalAmount) {
        const taxAmount = updateData.taxAmount || (order.taxAmount || 0);
        updateData.finalAmount = order.totalAmount + taxAmount;
      }

      // Migrate customer info from shipping address if available
      if (order.shippingAddress && !order.customerInfo) {
        updateData.customerInfo = {
          address: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          pincode: order.shippingAddress.pincode
        };
      }

      // Update the order
      if (Object.keys(updateData).length > 0) {
        await Order.findByIdAndUpdate(order._id, updateData);
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`Migrated ${migratedCount} orders...`);
        }
      }
    }

    console.log(`Migration completed! Migrated ${migratedCount} orders`);

    // Verify migration
    const verificationCount = await Order.countDocuments({
      paymentMethod: { $exists: true },
      finalAmount: { $exists: true }
    });

    console.log(`Verification: ${verificationCount} orders now have required fields`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateOrders();
}

module.exports = migrateOrders;