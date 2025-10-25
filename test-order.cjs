const axios = require('axios');

const testOrderData = {
  customerInfo: {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '9876543210',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456'
  },
  items: [
    {
      id: 'test-product-1',
      name: 'Test Product',
      price: 100,
      quantity: 1,
      category: 'Test Category',
      image: 'test-image.jpg'
    }
  ],
  paymentInfo: {
    method: 'cod',
    transactionId: 'COD_PENDING'
  },
  pricing: {
    subtotal: 100,
    codCharges: 0,
    taxAmount: 18,
    finalAmount: 118
  },
  totalAmount: 100,
  taxAmount: 18,
  finalAmount: 118
};

async function testOrder() {
  try {
    console.log('Testing order placement...');
    console.log('Order data:', JSON.stringify(testOrderData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/orders/place', testOrderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Order placed successfully:', response.data);
  } catch (error) {
    console.log('❌ Order placement failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testOrder();