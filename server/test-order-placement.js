const axios = require('axios');

async function testOrderPlacement() {
    try {
        console.log('🧪 Testing order placement with COD...');

        const orderData = {
            customerInfo: {
                firstName: 'Test',
                lastName: 'Customer',
                email: 'test@example.com',
                phone: '9876543210',
                address: '123 Test Street',
                city: 'Test City',
                state: 'Test State',
                pincode: '123456'
            },
            items: [
                {
                    id: '3',
                    name: 'Test Product',
                    price: 100,
                    quantity: 1,
                    category: 'Test',
                    image: 'test.jpg'
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

        const response = await axios.post('http://localhost:5000/api/orders/place', orderData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Order placement successful!');
        console.log('📦 Order ID:', response.data.data?.orderId);
        console.log('💰 Total Amount:', response.data.data?.pricing?.finalAmount);

    } catch (error) {
        console.log('❌ Order placement failed:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data?.message || 'Unknown error');
            console.log('Full response:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('No response received:', error.request);
        } else {
            console.log('Error:', error.message);
            console.log('Full error:', error);
        }
    }
}

testOrderPlacement();