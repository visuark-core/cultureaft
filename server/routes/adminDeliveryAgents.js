const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const deliveryAgentController = require('../controllers/deliveryAgentController');
const {
  authenticateAdmin,
  requirePermission,
  auditLogger,
  sensitiveOperationLimiter
} = require('../middleware/adminAuth');

const router = express.Router();

// Apply authentication to all routes (bypass in development)
if (process.env.NODE_ENV !== 'development') {
  router.use(authenticateAdmin);
} else {
  // Development bypass - add mock admin user
  router.use((req, res, next) => {
    req.admin = {
      id: 'dev-admin-id',
      email: 'dev@admin.com',
      role: {
        name: 'super_admin',
        level: 1,
        permissions: [
          {
            resource: 'deliveryAgents',
            actions: ['read', 'create', 'update', 'delete', 'assign', 'updateLocation'],
            conditions: []
          }
        ]
      },
      permissions: [
        {
          resource: 'deliveryAgents',
          actions: ['read', 'create', 'update', 'delete', 'assign', 'updateLocation'],
          conditions: []
        }
      ],
      fullName: 'Development Admin',
      trustLevel: 'high'
    };
    next();
  });
}

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

// @route   GET /api/admin/delivery-agents
// @desc    Get delivery agents with filtering and pagination
// @access  Private (requires deliveryAgents:read permission)
router.get('/',
  requirePermission('deliveryAgents', 'read'),
  auditLogger('read', 'delivery_agents'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['createdAt', 'profile.name', 'profile.employeeId', 'performance.totalDeliveries', 'performance.customerRating']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('status').optional().isIn(['active', 'inactive', 'suspended', 'terminated', 'all']).withMessage('Invalid status filter'),
    query('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search query too long')
  ],
  handleValidationErrors,
  deliveryAgentController.getDeliveryAgents
);

// @route   GET /api/admin/delivery-agents/statistics
// @desc    Get delivery agent statistics
// @access  Private (requires deliveryAgents:read permission)
router.get('/statistics',
  requirePermission('deliveryAgents', 'read'),
  auditLogger('read', 'delivery_agent_statistics'),
  deliveryAgentController.getDeliveryAgentStatistics
);

// @route   GET /api/admin/delivery-agents/:id
// @desc    Get single delivery agent by ID
// @access  Private (requires deliveryAgents:read permission)
router.get('/:id',
  requirePermission('deliveryAgents', 'read'),
  auditLogger('read', 'delivery_agents'),
  [
    param('id').isMongoId().withMessage('Invalid delivery agent ID')
  ],
  handleValidationErrors,
  deliveryAgentController.getDeliveryAgentById
);

// @route   POST /api/admin/delivery-agents
// @desc    Create new delivery agent
// @access  Private (requires deliveryAgents:create permission)
router.post('/',
  requirePermission('deliveryAgents', 'create'),
  auditLogger('create', 'delivery_agents'),
  [
    body('profile.employeeId').trim().isLength({ min: 1, max: 50 }).withMessage('Employee ID is required and must be less than 50 characters'),
    body('profile.name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('profile.phone').isMobilePhone().withMessage('Valid phone number is required'),
    body('profile.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('employment.joinDate').optional().isISO8601().withMessage('Invalid join date'),
    body('employment.status').optional().isIn(['active', 'inactive', 'suspended', 'terminated']).withMessage('Invalid employment status'),
    body('vehicle.type').isIn(['bike', 'scooter', 'bicycle', 'car', 'van', 'truck']).withMessage('Invalid vehicle type')
  ],
  handleValidationErrors,
  deliveryAgentController.createDeliveryAgent
);

// @route   PUT /api/admin/delivery-agents/:id
// @desc    Update delivery agent
// @access  Private (requires deliveryAgents:update permission)
router.put('/:id',
  requirePermission('deliveryAgents', 'update'),
  auditLogger('update', 'delivery_agents'),
  [
    param('id').isMongoId().withMessage('Invalid delivery agent ID'),
    body('profile.name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
    body('profile.phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('profile.email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('employment.status').optional().isIn(['active', 'inactive', 'suspended', 'terminated']).withMessage('Invalid employment status'),
    body('vehicle.type').optional().isIn(['bike', 'scooter', 'bicycle', 'car', 'van', 'truck']).withMessage('Invalid vehicle type')
  ],
  handleValidationErrors,
  deliveryAgentController.updateDeliveryAgent
);

// @route   DELETE /api/admin/delivery-agents/:id
// @desc    Delete delivery agent (soft delete)
// @access  Private (requires deliveryAgents:delete permission)
router.delete('/:id',
  requirePermission('deliveryAgents', 'delete'),
  sensitiveOperationLimiter(),
  auditLogger('delete', 'delivery_agents'),
  [
    param('id').isMongoId().withMessage('Invalid delivery agent ID')
  ],
  handleValidationErrors,
  deliveryAgentController.deleteDeliveryAgent
);

// @route   POST /api/admin/delivery-agents/:id/assign-order
// @desc    Assign an order to a delivery agent
// @access  Private (requires deliveryAgents:assign permission)
router.post('/:id/assign-order',
  requirePermission('deliveryAgents', 'assign'),
  auditLogger('assign_order', 'delivery_agents'),
  [
    param('id').isMongoId().withMessage('Invalid delivery agent ID'),
    body('orderId').isMongoId().withMessage('Invalid order ID')
  ],
  handleValidationErrors,
  deliveryAgentController.assignOrderToAgent
);

// @route   POST /api/admin/delivery-agents/:id/update-location
// @desc    Update delivery agent's current location
// @access  Private (requires deliveryAgents:updateLocation permission)
router.post('/:id/update-location',
  requirePermission('deliveryAgents', 'updateLocation'),
  auditLogger('update_location', 'delivery_agents'),
  [
    param('id').isMongoId().withMessage('Invalid delivery agent ID'),
    body('latitude').isFloat().withMessage('Invalid latitude'),
    body('longitude').isFloat().withMessage('Invalid longitude'),
    body('accuracy').optional().isFloat().withMessage('Invalid accuracy')
  ],
  handleValidationErrors,
  deliveryAgentController.updateAgentLocation
);

// @route   POST /api/admin/delivery-agents/record-attempt
// @desc    Record a delivery attempt for an order
// @access  Private (requires deliveryAgents:update permission)
router.post('/record-attempt',
  requirePermission('deliveryAgents', 'update'),
  auditLogger('record_delivery_attempt', 'delivery_agents'),
  [
    body('orderId').isMongoId().withMessage('Invalid order ID'),
    body('status').isIn(['successful', 'failed', 'rescheduled']).withMessage('Invalid attempt status'),
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be a string up to 500 characters'),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes must be a string up to 500 characters'),
    body('nextAttemptDate').optional().isISO8601().withMessage('Invalid next attempt date')
  ],
  handleValidationErrors,
  deliveryAgentController.recordDeliveryAttempt
);

// @route   POST /api/admin/delivery-agents/upload-proof
// @desc    Upload delivery proof for an order
// @access  Private (requires deliveryAgents:update permission)
router.post('/upload-proof',
  requirePermission('deliveryAgents', 'update'),
  auditLogger('upload_delivery_proof', 'delivery_agents'),
  [
    body('orderId').isMongoId().withMessage('Invalid order ID'),
    body('type').isIn(['signature', 'photo', 'otp', 'biometric']).withMessage('Invalid proof type'),
    body('data').isString().withMessage('Proof data is required (e.g., Base64 encoded image or signature)'),
    body('location.latitude').optional().isFloat().withMessage('Invalid latitude'),
    body('location.longitude').optional().isFloat().withMessage('Invalid longitude'),
    body('verifiedBy').optional().isString().isLength({ max: 100 }).withMessage('Verified by must be a string up to 100 characters')
  ],
  handleValidationErrors,
  deliveryAgentController.uploadDeliveryProof
);

// @route   GET /api/admin/delivery-agents/analytics
// @desc    Get delivery analytics
// @access  Private (requires deliveryAgents:read permission)
router.get('/analytics',
  requirePermission('deliveryAgents', 'read'),
  auditLogger('read', 'delivery_analytics'),
  [
    query('startDate').isISO8601().withMessage('Invalid start date'),
    query('endDate').isISO8601().withMessage('Invalid end date')
  ],
  handleValidationErrors,
  deliveryAgentController.getDeliveryAnalytics
);

// @route   POST /api/admin/delivery-agents/record-attempt
// @desc    Record a delivery attempt for an order
// @access  Private (requires deliveryAgents:update permission)
router.post('/record-attempt',
  requirePermission('deliveryAgents', 'update'),
  auditLogger('record_delivery_attempt', 'delivery_agents'),
  [
    body('orderId').isMongoId().withMessage('Invalid order ID'),
    body('status').isIn(['successful', 'failed', 'rescheduled']).withMessage('Invalid attempt status'),
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be a string up to 500 characters'),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes must be a string up to 500 characters'),
    body('nextAttemptDate').optional().isISO8601().withMessage('Invalid next attempt date')
  ],
  handleValidationErrors,
  deliveryAgentController.recordDeliveryAttempt
);

// @route   POST /api/admin/delivery-agents/upload-proof
// @desc    Upload delivery proof for an order
// @access  Private (requires deliveryAgents:update permission)
router.post('/upload-proof',
  requirePermission('deliveryAgents', 'update'),
  auditLogger('upload_delivery_proof', 'delivery_agents'),
  [
    body('orderId').isMongoId().withMessage('Invalid order ID'),
    body('type').isIn(['signature', 'photo', 'otp', 'biometric']).withMessage('Invalid proof type'),
    body('data').isString().withMessage('Proof data is required (e.g., Base64 encoded image or signature)'),
    body('location.latitude').optional().isFloat().withMessage('Invalid latitude'),
    body('location.longitude').optional().isFloat().withMessage('Invalid longitude'),
    body('verifiedBy').optional().isString().isLength({ max: 100 }).withMessage('Verified by must be a string up to 100 characters')
  ],
  handleValidationErrors,
  deliveryAgentController.uploadDeliveryProof
);

// @route   GET /api/admin/delivery-agents/analytics
// @desc    Get delivery analytics
// @access  Private (requires deliveryAgents:read permission)
router.get('/analytics',
  requirePermission('deliveryAgents', 'read'),
  auditLogger('read', 'delivery_analytics'),
  [
    query('startDate').isISO8601().withMessage('Invalid start date'),
    query('endDate').isISO8601().withMessage('Invalid end date')
  ],
  handleValidationErrors,
  deliveryAgentController.getDeliveryAnalytics
);

// @route   POST /api/admin/delivery-agents/record-attempt
// @desc    Record a delivery attempt for an order
// @access  Private (requires deliveryAgents:update permission)
router.post('/record-attempt',
  requirePermission('deliveryAgents', 'update'),
  auditLogger('record_delivery_attempt', 'delivery_agents'),
  [
    body('orderId').isMongoId().withMessage('Invalid order ID'),
    body('status').isIn(['successful', 'failed', 'rescheduled']).withMessage('Invalid attempt status'),
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be a string up to 500 characters'),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes must be a string up to 500 characters'),
    body('nextAttemptDate').optional().isISO8601().withMessage('Invalid next attempt date')
  ],
  handleValidationErrors,
  deliveryAgentController.recordDeliveryAttempt
);

// @route   POST /api/admin/delivery-agents/upload-proof
// @desc    Upload delivery proof for an order
// @access  Private (requires deliveryAgents:update permission)
router.post('/upload-proof',
  requirePermission('deliveryAgents', 'update'),
  auditLogger('upload_delivery_proof', 'delivery_agents'),
  [
    body('orderId').isMongoId().withMessage('Invalid order ID'),
    body('type').isIn(['signature', 'photo', 'otp', 'biometric']).withMessage('Invalid proof type'),
    body('data').isString().withMessage('Proof data is required (e.g., Base64 encoded image or signature)'),
    body('location.latitude').optional().isFloat().withMessage('Invalid latitude'),
    body('location.longitude').optional().isFloat().withMessage('Invalid longitude'),
    body('verifiedBy').optional().isString().isLength({ max: 100 }).withMessage('Verified by must be a string up to 100 characters')
  ],
  handleValidationErrors,
  deliveryAgentController.uploadDeliveryProof
);

// @route   GET /api/admin/delivery-agents/analytics
// @desc    Get delivery analytics
// @access  Private (requires deliveryAgents:read permission)
router.get('/analytics',
  requirePermission('deliveryAgents', 'read'),
  auditLogger('read', 'delivery_analytics'),
  [
    query('startDate').isISO8601().withMessage('Invalid start date'),
    query('endDate').isISO8601().withMessage('Invalid end date')
  ],
  handleValidationErrors,
  deliveryAgentController.getDeliveryAnalytics
);

// @route   POST /api/admin/delivery-agents/record-attempt
// @desc    Record a delivery attempt for an order
// @access  Private (requires deliveryAgents:update permission)
router.post('/record-attempt',
  requirePermission('deliveryAgents', 'update'),
  auditLogger('record_delivery_attempt', 'delivery_agents'),
  [
    body('orderId').isMongoId().withMessage('Invalid order ID'),
    body('status').isIn(['successful', 'failed', 'rescheduled']).withMessage('Invalid attempt status'),
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be a string up to 500 characters'),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes must be a string up to 500 characters'),
    body('nextAttemptDate').optional().isISO8601().withMessage('Invalid next attempt date')
  ],
  handleValidationErrors,
  deliveryAgentController.recordDeliveryAttempt
);

// @route   POST /api/admin/delivery-agents/upload-proof
// @desc    Upload delivery proof for an order
// @access  Private (requires deliveryAgents:update permission)
router.post('/upload-proof',
  requirePermission('deliveryAgents', 'update'),
  auditLogger('upload_delivery_proof', 'delivery_agents'),
  [
    body('orderId').isMongoId().withMessage('Invalid order ID'),
    body('type').isIn(['signature', 'photo', 'otp', 'biometric']).withMessage('Invalid proof type'),
    body('data').isString().withMessage('Proof data is required (e.g., Base64 encoded image or signature)'),
    body('location.latitude').optional().isFloat().withMessage('Invalid latitude'),
    body('location.longitude').optional().isFloat().withMessage('Invalid longitude'),
    body('verifiedBy').optional().isString().isLength({ max: 100 }).withMessage('Verified by must be a string up to 100 characters')
  ],
  handleValidationErrors,
  deliveryAgentController.uploadDeliveryProof
);

// @route   GET /api/admin/delivery-agents/analytics
// @desc    Get delivery analytics
// @access  Private (requires deliveryAgents:read permission)
router.get('/analytics',
  requirePermission('deliveryAgents', 'read'),
  auditLogger('read', 'delivery_analytics'),
  [
    query('startDate').isISO8601().withMessage('Invalid start date'),
    query('endDate').isISO8601().withMessage('Invalid end date')
  ],
  handleValidationErrors,
  deliveryAgentController.getDeliveryAnalytics
);

// @route   GET /api/admin/delivery-agents/available
// @desc    Get available agents for assignment
// @access  Private (requires deliveryAgents:read permission)
router.get('/available',
  requirePermission('deliveryAgents', 'read'),
  auditLogger('read', 'available_agents'),
  [
    query('pincode').optional().isLength({ min: 6, max: 6 }).withMessage('Invalid pincode'),
    query('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5')
  ],
  handleValidationErrors,
  deliveryAgentController.getAvailableAgents
);

// @route   POST /api/admin/delivery-agents/auto-assign
// @desc    Auto-assign orders to best available agents
// @access  Private (requires deliveryAgents:assign permission)
router.post('/auto-assign',
  requirePermission('deliveryAgents', 'assign'),
  auditLogger('auto_assign_orders', 'delivery_agents'),
  [
    body('orderIds').isArray({ min: 1 }).withMessage('Order IDs array is required'),
    body('orderIds.*').isMongoId().withMessage('Invalid order ID')
  ],
  handleValidationErrors,
  deliveryAgentController.autoAssignOrders
);

// @route   POST /api/admin/delivery-agents/handle-failed-delivery
// @desc    Handle failed delivery with retry logic
// @access  Private (requires deliveryAgents:update permission)
router.post('/handle-failed-delivery',
  requirePermission('deliveryAgents', 'update'),
  auditLogger('handle_failed_delivery', 'delivery_agents'),
  [
    body('orderId').isMongoId().withMessage('Invalid order ID'),
    body('reason').isString().isLength({ min: 1, max: 500 }).withMessage('Reason is required'),
    body('autoReschedule').optional().isBoolean().withMessage('Auto reschedule must be boolean')
  ],
  handleValidationErrors,
  deliveryAgentController.handleFailedDelivery
);

// @route   GET /api/admin/delivery-agents/tracking/:orderId
// @desc    Get real-time delivery tracking information
// @access  Private (requires deliveryAgents:read permission)
router.get('/tracking/:orderId',
  requirePermission('deliveryAgents', 'read'),
  auditLogger('read', 'delivery_tracking'),
  [
    param('orderId').isMongoId().withMessage('Invalid order ID')
  ],
  handleValidationErrors,
  deliveryAgentController.getDeliveryTracking
);

module.exports = router;