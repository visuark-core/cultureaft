// Quick test script to verify Razorpay configuration
// Run with: node test-razorpay-config.cjs

require('dotenv').config({ path: './server/.env' });

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

console.log('\n⚠️  IMPORTANT: Replace placeholder values with actual Razorpay credentials to fix the 401 error');