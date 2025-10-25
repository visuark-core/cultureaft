#!/usr/bin/env node

/**
 * Seed Analytics Data Script
 * This script adds sample data to Google Sheets for analytics testing
 */

const OrderSheetsDAO = require('../services/sheets/OrderSheetsDAO');
const CustomerSheetsDAO = require('../services/sheets/CustomerSheetsDAO');

// Sample customers data
const sampleCustomers = [
  {
    customerId: 'CUST_001',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.kumar@example.com',
    phone: '+91 9876543210',
    registrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    totalOrders: 3,
    totalSpent: 45000,
    lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    status: 'active'
  },
  {
    customerId: 'CUST_002',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 9876543211',
    registrationDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    totalOrders: 2,
    totalSpent: 32000,
    lastOrderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'active'
  },
  {
    customerId: 'CUST_003',
    firstName: 'Amit',
    lastName: 'Patel',
    email: 'amit.patel@example.com',
    phone: '+91 9876543212',
    registrationDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    totalOrders: 4,
    totalSpent: 58000,
    lastOrderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: 'active'
  },
  {
    customerId: 'CUST_004',
    firstName: 'Sunita',
    lastName: 'Gupta',
    email: 'sunita.gupta@example.com',
    phone: '+91 9876543213',
    registrationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    totalOrders: 1,
    totalSpent: 18000,
    lastOrderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'active'
  },
  {
    customerId: 'CUST_005',
    firstName: 'Vikram',
    lastName: 'Singh',
    email: 'vikram.singh@example.com',
    phone: '+91 9876543214',
    registrationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    totalOrders: 2,
    totalSpent: 35000,
    lastOrderDate: new Date().toISOString(), // Today
    status: 'active'
  }
];

// Sample orders data
const sampleOrders = [
  {
    orderId: 'ORD-2024-001',
    customer: {
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      phone: '+91 9876543210'
    },
    items: [
      {
        productId: 'PROD_001',
        name: 'Handcrafted Wooden Chair',
        sku: 'HWC-001',
        quantity: 1,
        price: 15000,
        category: 'furniture',
        subtotal: 15000
      }
    ],
    pricing: {
      subtotal: 15000,
      taxes: 2700,
      shippingCharges: 300,
      codCharges: 0,
      discount: 0,
      total: 18000
    },
    payment: {
      method: 'cod',
      status: 'completed',
      transactionId: 'TXN-001'
    },
    shipping: {
      address: {
        street: '123 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      }
    },
    status: 'delivered',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    orderId: 'ORD-2024-002',
    customer: {
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+91 9876543211'
    },
    items: [
      {
        productId: 'PROD_002',
        name: 'Traditional Handwoven Carpet',
        sku: 'THC-002',
        quantity: 1,
        price: 25000,
        category: 'home-decor',
        subtotal: 25000
      }
    ],
    pricing: {
      subtotal: 25000,
      taxes: 4500,
      shippingCharges: 500,
      codCharges: 0,
      discount: 1000,
      total: 29000
    },
    payment: {
      method: 'online',
      status: 'completed',
      transactionId: 'TXN-002'
    },
    shipping: {
      address: {
        street: '456 CP Road',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India'
      }
    },
    status: 'delivered',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    orderId: 'ORD-2024-003',
    customer: {
      name: 'Amit Patel',
      email: 'amit.patel@example.com',
      phone: '+91 9876543212'
    },
    items: [
      {
        productId: 'PROD_003',
        name: 'Brass Decorative Lamp',
        sku: 'BDL-003',
        quantity: 2,
        price: 8000,
        category: 'handicrafts',
        subtotal: 16000
      },
      {
        productId: 'PROD_004',
        name: 'Silk Cushion Covers',
        sku: 'SCC-004',
        quantity: 4,
        price: 1500,
        category: 'textiles',
        subtotal: 6000
      }
    ],
    pricing: {
      subtotal: 22000,
      taxes: 3960,
      shippingCharges: 400,
      codCharges: 0,
      discount: 500,
      total: 25860
    },
    payment: {
      method: 'cod',
      status: 'completed',
      transactionId: 'TXN-003'
    },
    shipping: {
      address: {
        street: '789 FC Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        country: 'India'
      }
    },
    status: 'delivered',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    orderId: 'ORD-2024-004',
    customer: {
      name: 'Sunita Gupta',
      email: 'sunita.gupta@example.com',
      phone: '+91 9876543213'
    },
    items: [
      {
        productId: 'PROD_005',
        name: 'Silver Jewelry Set',
        sku: 'SJS-005',
        quantity: 1,
        price: 15000,
        category: 'jewelry',
        subtotal: 15000
      }
    ],
    pricing: {
      subtotal: 15000,
      taxes: 2700,
      shippingCharges: 300,
      codCharges: 0,
      discount: 0,
      total: 18000
    },
    payment: {
      method: 'online',
      status: 'completed',
      transactionId: 'TXN-004'
    },
    shipping: {
      address: {
        street: '321 Brigade Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India'
      }
    },
    status: 'delivered',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString()
  },
  {
    orderId: 'ORD-2024-005',
    customer: {
      name: 'Vikram Singh',
      email: 'vikram.singh@example.com',
      phone: '+91 9876543214'
    },
    items: [
      {
        productId: 'PROD_006',
        name: 'Wooden Dining Table',
        sku: 'WDT-006',
        quantity: 1,
        price: 35000,
        category: 'furniture',
        subtotal: 35000
      }
    ],
    pricing: {
      subtotal: 35000,
      taxes: 6300,
      shippingCharges: 700,
      codCharges: 0,
      discount: 2000,
      total: 40000
    },
    payment: {
      method: 'cod',
      status: 'completed',
      transactionId: 'TXN-005'
    },
    shipping: {
      address: {
        street: '654 Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700001',
        country: 'India'
      }
    },
    status: 'delivered',
    createdAt: new Date().toISOString(), // Today
    updatedAt: new Date().toISOString()
  }
];

async function seedData() {
  console.log('🌱 Starting analytics data seeding...');
  
  try {
    // Seed customers
    console.log('👥 Seeding customer data...');
    for (const customer of sampleCustomers) {
      try {
        await CustomerSheetsDAO.create(customer);
        console.log(`✅ Created customer: ${customer.firstName} ${customer.lastName}`);
      } catch (error) {
        console.log(`⚠️ Customer ${customer.firstName} ${customer.lastName} might already exist`);
      }
    }
    
    // Seed orders
    console.log('📦 Seeding order data...');
    for (const order of sampleOrders) {
      try {
        await OrderSheetsDAO.create(order);
        console.log(`✅ Created order: ${order.orderId}`);
      } catch (error) {
        console.log(`⚠️ Order ${order.orderId} might already exist`);
      }
    }
    
    console.log('🎉 Analytics data seeding completed successfully!');
    console.log('📊 You should now see real data in the analytics dashboard');
    
  } catch (error) {
    console.error('❌ Error seeding analytics data:', error);
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedData().then(() => {
    console.log('✅ Seeding process completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  });
}

module.exports = { seedData, sampleCustomers, sampleOrders };