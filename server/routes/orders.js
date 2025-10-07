const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getOrder,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  getOrderAnalytics,
  processRefund,
  flagOrder,
  getOrdersDashboard,
  getCustomerInsights,
  bulkUpdateOrderStatus
} = require('../controllers/orderController');

const {
  validateObjectId,
  sanitizeRequest,
  securityHeaders
} = require('../middleware/validation');

// Apply middleware to all routes
router.use(securityHeaders);
router.use(sanitizeRequest);

// Order placement
router.post('/place', placeOrder);

// Get specific order
router.get('/:orderId', getOrder);

// Get user orders
router.get('/user/:userId', getUserOrders);
router.get('/user', getUserOrders); // For email-based lookup

// Update order status (admin)
router.patch('/:orderId/status', updateOrderStatus);

// Cancel order
router.patch('/:orderId/cancel', cancelOrder);

// Get all orders (admin)
router.get('/', getAllOrders);

// Admin-specific routes
router.get('/dashboard/analytics', getOrdersDashboard);
router.get('/analytics', getOrderAnalytics);
router.get('/:orderId/customer-insights', getCustomerInsights);

// Order management actions (admin)
router.post('/:orderId/refund', processRefund);
router.post('/:orderId/flag', flagOrder);
router.patch('/bulk/status', bulkUpdateOrderStatus);

module.exports = router;