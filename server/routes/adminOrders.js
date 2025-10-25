const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const orderController = require('../controllers/orderController');
const orderService = require('../services/orderService');
const {
  authenticateAdmin,
  requirePermission,
  auditLogger,
  sensitiveOperationLimiter
} = require('../middleware/adminAuth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateAdmin);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/admin/orders
// @desc    Get orders with filtering and pagination
// @access  Private (requires orders:read permission)
router.get('/',
  requirePermission('orders', 'read'),
  auditLogger('read', 'orders'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['createdAt', 'orderDate', 'finalAmount', 'status', 'paymentStatus']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search query too long'),
    query('minAmount').optional().isFloat({ min: 0 }).withMessage('Minimum amount must be a positive number'),
    query('maxAmount').optional().isFloat({ min: 0 }).withMessage('Maximum amount must be a positive number')
  ],
  handleValidationErrors,
  orderController.getAllOrders
);

// @route   GET /api/admin/orders/statistics
// @desc    Get order statistics
// @access  Private (requires orders:read permission)
router.get('/statistics',
  requirePermission('orders', 'read'),
  auditLogger('read', 'order_statistics'),
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const statistics = await orderService.getOrderStatistics(days);

      res.json({
        success: true,
        message: 'Order statistics retrieved successfully',
        data: statistics
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve order statistics'
      });
    }
  }
);

// @route   GET /api/admin/orders/attention
// @desc    Get orders requiring attention
// @access  Private (requires orders:read permission)
router.get('/attention',
  requirePermission('orders', 'read'),
  auditLogger('read', 'orders_attention'),
  async (req, res) => {
    try {
      const orders = await orderService.getOrdersRequiringAttention();

      res.json({
        success: true,
        message: 'Orders requiring attention retrieved successfully',
        data: orders
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve orders requiring attention'
      });
    }
  }
);

// @route   GET /api/admin/orders/analytics/revenue
// @desc    Get revenue analytics
// @access  Private (requires orders:read permission)
router.get('/analytics/revenue',
  requirePermission('orders', 'read'),
  auditLogger('read', 'revenue_analytics'),
  [
    query('period').optional().isIn(['week', 'month', 'year']).withMessage('Period must be week, month, or year')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const period = req.query.period || 'month';
      const analytics = await orderService.getRevenueAnalytics(period);

      res.json({
        success: true,
        message: 'Revenue analytics retrieved successfully',
        data: {
          period,
          analytics
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve revenue analytics'
      });
    }
  }
);

// @route   GET /api/admin/orders/search
// @desc    Search orders
// @access  Private (requires orders:read permission)
router.get('/search',
  requirePermission('orders', 'read'),
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const searchCriteria = {
        query: req.query.q,
        filters: {
          status: req.query.status,
          paymentStatus: req.query.paymentStatus
        },
        limit: parseInt(req.query.limit) || 20
      };

      const orders = await orderService.searchOrders(searchCriteria);

      res.json({
        success: true,
        message: 'Order search completed successfully',
        data: orders
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search orders'
      });
    }
  }
);

// @route   GET /api/admin/orders/:id
// @desc    Get single order by ID
// @access  Private (requires orders:read permission)
router.get('/:id',
  requirePermission('orders', 'read'),
  auditLogger('read', 'orders'),
  [
    param('id').isMongoId().withMessage('Invalid order ID')
  ],
  handleValidationErrors,
  orderController.getOrder
);

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private (requires orders:update permission)
router.put('/:id/status',
  requirePermission('orders', 'update'),
  auditLogger('update', 'order_status'),
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled']).withMessage('Invalid order status'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
  ],
  handleValidationErrors,
  orderController.updateOrderStatus
);

// @route   PUT /api/admin/orders/:id/payment
// @desc    Update payment status
// @access  Private (requires orders:approve permission)
router.put('/:id/payment',
  requirePermission('orders', 'approve'),
  sensitiveOperationLimiter(),
  auditLogger('update', 'payment_status'),
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('paymentStatus').isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Invalid payment status'),
    body('transactionId').optional().isLength({ max: 100 }).withMessage('Transaction ID must be less than 100 characters'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { paymentStatus, transactionId, notes } = req.body;
      const order = await orderService.updatePaymentStatus(
        req.params.id, 
        paymentStatus, 
        req.admin.id, 
        transactionId, 
        notes
      );

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: order
      });

    } catch (error) {
      const statusCode = error.message === 'Order not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update payment status'
      });
    }
  }
);

// @route   POST /api/admin/orders/:id/cancel
// @desc    Cancel order
// @access  Private (requires orders:update permission)
router.post('/:id/cancel',
  requirePermission('orders', 'update'),
  sensitiveOperationLimiter(),
  auditLogger('update', 'order_cancellation'),
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
  ],
  handleValidationErrors,
  orderController.cancelOrder
);

// @route   POST /api/admin/orders/bulk-update
// @desc    Bulk update orders
// @access  Private (requires orders:update permission)
router.post('/bulk-update',
  requirePermission('orders', 'update'),
  sensitiveOperationLimiter(60000, 5), // More restrictive for bulk operations
  auditLogger('bulk_operation', 'orders'),
  [
    body('orderIds').isArray({ min: 1, max: 100 }).withMessage('Order IDs array is required (max 100)'),
    body('orderIds.*').isMongoId().withMessage('Invalid order ID in array'),
    body('updateData').isObject().withMessage('Update data is required'),
    body('updateData.status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled']).withMessage('Invalid order status'),
    body('updateData.paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Invalid payment status')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { orderIds, updateData } = req.body;
      const result = await orderService.bulkUpdateOrders(orderIds, updateData, req.admin.id);

      res.json({
        success: true,
        message: `Bulk update completed. ${result.modifiedCount} orders updated.`,
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to perform bulk update'
      });
    }
  }
);

// @route   PUT /api/admin/orders/:id/edit
// @desc    Edit order details (pre-shipment modifications)
// @access  Private (requires orders:update permission)
router.put('/:id/edit',
  requirePermission('orders', 'update'),
  auditLogger('update', 'order_details'),
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('items').optional().isArray().withMessage('Items must be an array'),
    body('items.*.productId').isMongoId().withMessage('Invalid product ID in items'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('shipping.address').optional().isObject().withMessage('Shipping address must be an object'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { items, shipping, notes } = req.body;
      const adminId = req.admin.id;

      const updatedOrder = await orderService.editOrder(id, { items, shipping, notes }, adminId);

      res.json({
        success: true,
        message: 'Order updated successfully',
        data: updatedOrder
      });

    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to edit order'
      });
    }
  }
);

// @route   GET /api/admin/orders/export/csv
// @desc    Export orders to CSV
// @access  Private (requires orders:export permission)
router.get('/export/csv',
  requirePermission('orders', 'export'),
  auditLogger('export', 'orders'),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        paymentStatus: req.query.paymentStatus,
        paymentMethod: req.query.paymentMethod,
        orderDateFrom: req.query.orderDateFrom,
        orderDateTo: req.query.orderDateTo,
        city: req.query.city,
        state: req.query.state
      };
 
      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });
 
      const csvData = await orderService.exportOrders(filters);
 
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=orders-export-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvData);
 
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export orders'
      });
    }
  }
);

// @route   POST /api/admin/orders/:id/assign-delivery-agent
// @desc    Assign a delivery agent to an order
// @access  Private (requires orders:update permission)
router.post('/:id/assign-delivery-agent',
  requirePermission('orders', 'update'),
  auditLogger('assign_delivery_agent', 'orders'),
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('agentId').isMongoId().withMessage('Invalid delivery agent ID'),
    body('estimatedDelivery').isISO8601().withMessage('Invalid estimated delivery date')
  ],
  handleValidationErrors,
  orderController.assignDeliveryAgentToOrder
);

// @route   POST /api/admin/orders/:id/record-delivery-attempt
// @desc    Record a delivery attempt for an order
// @access  Private (requires orders:update permission)
router.post('/:id/record-delivery-attempt',
  requirePermission('orders', 'update'),
  auditLogger('record_delivery_attempt', 'orders'),
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('status').isIn(['successful', 'failed', 'rescheduled']).withMessage('Invalid attempt status'),
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be a string up to 500 characters'),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes must be a string up to 500 characters'),
    body('nextAttemptDate').optional().isISO8601().withMessage('Invalid next attempt date')
  ],
  handleValidationErrors,
  orderController.recordDeliveryAttempt
);

// @route   POST /api/admin/orders/:id/upload-delivery-proof
// @desc    Upload delivery proof for an order
// @access  Private (requires orders:update permission)
router.post('/:id/upload-delivery-proof',
  requirePermission('orders', 'update'),
  auditLogger('upload_delivery_proof', 'orders'),
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('type').isIn(['signature', 'photo', 'otp', 'biometric']).withMessage('Invalid proof type'),
    body('data').isString().withMessage('Proof data is required (e.g., Base64 encoded image or signature)'),
    body('location.latitude').optional().isFloat().withMessage('Invalid latitude'),
    body('location.longitude').optional().isFloat().withMessage('Invalid longitude'),
    body('verifiedBy').optional().isString().isLength({ max: 100 }).withMessage('Verified by must be a string up to 100 characters')
  ],
  handleValidationErrors,
  orderController.uploadDeliveryProof
);

module.exports = router;