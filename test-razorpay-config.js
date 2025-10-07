// Quick test script to verify Razorpay configuration
// Run with: node test-razorpay-config.js

import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

console.log('🔍 Testing Razorpay Configuration...\n');

console.log('Environment Variables:');
console.log('- RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('- RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '***HIDDEN***' : 'NOT SET');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

console.log('\nValidation:');

if (!process.env.RAZORPAY_KEY_ID) {
  console.log('❌ RAZORPAY_KEY_ID is not set');
} else if (process.env.RAZORPAY_KEY_ID.includes('REPLACE_WITH') || process.env.RAZORPAY_KEY_ID === 'rzp_test_xxxxxxxxxx') {
  console.log('❌ RAZORPAY_KEY_ID contains placeholder value');
} else if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_') && !process.env.RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
  console.log('❌ RAZORPAY_KEY_ID format is invalid');
} else {
  console.log('✅ RAZORPAY_KEY_ID looks valid');
}

if (!process.env.RAZORPAY_KEY_SECRET) {
  console.log('❌ RAZORPAY_KEY_SECRET is not set');
} else if (process.env.RAZORPAY_KEY_SECRET.includes('REPLACE_WITH')) {
  console.log('❌ RAZORPAY_KEY_SECRET contains placeholder value');
} else {
  console.log('✅ RAZORPAY_KEY_SECRET is set');
}

console.log('\n📋 Next Steps:');
console.log('1. Get your credentials from https://dashboard.razorpay.com/');
console.log('2. Update server/.env with actual values');
console.log('3. Update .env with actual VITE_RAZORPAY_KEY_ID');
console.log('4. Restart both servers');
console.log('5. Test payment flow');

// Test Razorpay API connection if credentials look valid
if (process.env.RAZORPAY_KEY_ID && 
    process.env.RAZORPAY_KEY_SECRET && 
    !process.env.RAZORPAY_KEY_ID.includes('REPLACE_WITH') &&
    !process.env.RAZORPAY_KEY_SECRET.includes('REPLACE_WITH')) {
  
  console.log('\n🧪 Testing API Connection...');
  
  const { default: Razorpay } = await import('razorpay');
  
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Test with a small order creation
    razorpay.orders.create({
      amount: 100, // ₹1 in paisa
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now(),
      notes: {
        test: 'configuration_check'
      }
    }).then(order => {
      console.log('✅ API Connection successful!');
      console.log('Test order created:', order.id);
      console.log('\n🎉 Your Razorpay setup is working correctly!');
    }).catch(error => {
      console.log('❌ API Connection failed:', error.message);
      if (error.statusCode === 401) {
        console.log('   This means your credentials are invalid.');
      }
    });
    
  } catch (error) {
    console.log('❌ Failed to initialize Razorpay:', error.message);
  }
} else {
  console.log('\n⚠️  Skipping API test due to invalid credentials');
}