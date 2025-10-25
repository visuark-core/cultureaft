const express = require('express');
const router = express.Router();
const {
  placeOrder,
  checkInventoryAvailability,
  getOrder,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,

  assignDeliveryAgentToOrder,
  recordDeliveryAttempt,
  uploadDeliveryProof,
  releaseInventoryReservation,
  getInventoryReservation,
  getInventoryStats,
  cleanupExpiredReservations,
  generateInventoryReport,
  cleanupAbandonedOrders
} = require('../controllers/orderController');

const {
  validateObjectId,
  sanitizeRequest,
  securityHeaders
} = require('../middleware/validation');

// Apply middleware to all routes
router.use(securityHeaders);
router.use(sanitizeRequest);

// Check inventory availability
router.post('/check-inventory', checkInventoryAvailability);

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



// Assign delivery agent to order
router.post('/:orderId/assign-delivery-agent', assignDeliveryAgentToOrder);

// Record delivery attempt
router.post('/:orderId/record-delivery-attempt', recordDeliveryAttempt);

// Upload delivery proof
router.post('/:orderId/upload-delivery-proof', uploadDeliveryProof);

// Inventory management routes
router.delete('/inventory/reservation/:sessionId', releaseInventoryReservation);
router.get('/inventory/reservation/:sessionId', getInventoryReservation);
router.get('/inventory/stats', getInventoryStats);
router.post('/inventory/cleanup', cleanupExpiredReservations);
router.get('/inventory/report', generateInventoryReport);
router.post('/inventory/cleanup-abandoned', cleanupAbandonedOrders);

module.exports = router;