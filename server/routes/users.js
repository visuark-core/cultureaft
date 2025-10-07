const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const multer = require('multer');

// Configure multer for CSV file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
const {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  addUserFlag,
  resolveUserFlag,
  addUserNote,
  getUserActivity,
  getUserAnalytics,
  searchUsers,
  deleteUser,
  bulkUpdateUsers,
  bulkUpdateUserStatus,
  bulkDeleteUsers,
  exportUsersCSV,
  importUsersCSV,
  getCSVTemplate
} = require('../controllers/userController');

const {
  authenticateToken,
  requirePermission,
  auditLogger,
  validateSession
} = require('../middleware/auth');

// Apply authentication and session validation to all routes
router.use(authenticateToken);
router.use(validateSession);

/**
 * @route   GET /api/users
 * @desc    Get all users with advanced filtering and pagination
 * @access  Private (requires 'users' read permission)
 */
router.get('/',
  requirePermission('users', 'read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'inactive', 'suspended', 'banned', 'pending_verification']).withMessage('Invalid status'),
    query('segmentation').optional().isIn(['new', 'active', 'loyal', 'at_risk', 'churned', 'vip']).withMessage('Invalid segmentation'),
    query('flagType').optional().isIn([
      'suspicious_activity', 'multiple_failed_logins', 'unusual_spending', 'policy_violation',
      'fraud_suspected', 'account_compromise', 'spam_behavior', 'manual_review',
      'payment_issues', 'security_concern'
    ]).withMessage('Invalid flag type'),
    query('sortBy').optional().isIn([
      'createdAt', 'firstName', 'lastName', 'email', 'registrationDate',
      'analytics.totalSpent', 'analytics.totalOrders', 'activity.lastLogin'
    ]).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  auditLogger('VIEW_USERS', 'user'),
  getUsers
);

/**
 * @route   GET /api/users/search
 * @desc    Search users with advanced filters
 * @access  Private (requires 'users' read permission)
 */
router.get('/search',
  requirePermission('users', 'read'),
  [
    query('q').optional().isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  auditLogger('SEARCH_USERS', 'user'),
  searchUsers
);

/**
 * @route   GET /api/users/:userId
 * @desc    Get single user by ID with complete details
 * @access  Private (requires 'users' read permission)
 */
router.get('/:userId',
  requirePermission('users', 'read'),
  [
    param('userId').isMongoId().withMessage('Invalid user ID')
  ],
  auditLogger('VIEW_USER', 'user'),
  getUserById
);

/**
 * @route   PUT /api/users/:userId
 * @desc    Update user information
 * @access  Private (requires 'users' update permission)
 */
router.put('/:userId',
  requirePermission('users', 'update'),
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
    body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Invalid phone number'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
    body('status').optional().isIn(['active', 'inactive', 'suspended', 'banned', 'pending_verification']).withMessage('Invalid status'),
    body('preferences.newsletter').optional().isBoolean().withMessage('Newsletter preference must be boolean'),
    body('preferences.orderUpdates').optional().isBoolean().withMessage('Order updates preference must be boolean'),
    body('preferences.promotions').optional().isBoolean().withMessage('Promotions preference must be boolean'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*').optional().isString().isLength({ min: 1, max: 50 }).withMessage('Each tag must be 1-50 characters')
  ],
  auditLogger('UPDATE_USER', 'user'),
  updateUser
);

/**
 * @route   PATCH /api/users/:userId/status
 * @desc    Update user status (activate, suspend, ban)
 * @access  Private (requires 'users' update permission)
 */
router.patch('/:userId/status',
  requirePermission('users', 'update'),
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('status').isIn(['active', 'inactive', 'suspended', 'banned']).withMessage('Invalid status'),
    body('reason').optional().isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters')
  ],
  auditLogger('UPDATE_USER_STATUS', 'user'),
  updateUserStatus
);

/**
 * @route   POST /api/users/:userId/flags
 * @desc    Add flag to user
 * @access  Private (requires 'users' update permission)
 */
router.post('/:userId/flags',
  requirePermission('users', 'update'),
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('type').isIn([
      'suspicious_activity', 'multiple_failed_logins', 'unusual_spending', 'policy_violation',
      'fraud_suspected', 'account_compromise', 'spam_behavior', 'manual_review',
      'payment_issues', 'security_concern'
    ]).withMessage('Invalid flag type'),
    body('reason').isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters'),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters')
  ],
  auditLogger('ADD_USER_FLAG', 'user'),
  addUserFlag
);

/**
 * @route   PATCH /api/users/:userId/flags/:flagId/resolve
 * @desc    Resolve user flag
 * @access  Private (requires 'users' update permission)
 */
router.patch('/:userId/flags/:flagId/resolve',
  requirePermission('users', 'update'),
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    param('flagId').isMongoId().withMessage('Invalid flag ID'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters')
  ],
  auditLogger('RESOLVE_USER_FLAG', 'user'),
  resolveUserFlag
);

/**
 * @route   POST /api/users/:userId/notes
 * @desc    Add note to user
 * @access  Private (requires 'users' update permission)
 */
router.post('/:userId/notes',
  requirePermission('users', 'update'),
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('content').isLength({ min: 1, max: 1000 }).withMessage('Note content must be 1-1000 characters'),
    body('isPrivate').optional().isBoolean().withMessage('isPrivate must be boolean')
  ],
  auditLogger('ADD_USER_NOTE', 'user'),
  addUserNote
);

/**
 * @route   GET /api/users/:userId/activity
 * @desc    Get user activity history
 * @access  Private (requires 'users' read permission)
 */
router.get('/:userId/activity',
  requirePermission('users', 'read'),
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  auditLogger('VIEW_USER_ACTIVITY', 'user'),
  getUserActivity
);

/**
 * @route   GET /api/users/:userId/analytics
 * @desc    Get user analytics and insights
 * @access  Private (requires 'users' read permission)
 */
router.get('/:userId/analytics',
  requirePermission('users', 'read'),
  [
    param('userId').isMongoId().withMessage('Invalid user ID')
  ],
  auditLogger('VIEW_USER_ANALYTICS', 'user'),
  getUserAnalytics
);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user (soft delete)
 * @access  Private (requires 'users' delete permission)
 */
router.delete('/:userId',
  requirePermission('users', 'delete'),
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('reason').optional().isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters')
  ],
  auditLogger('DELETE_USER', 'user'),
  deleteUser
);

// ============ BULK OPERATIONS ============

/**
 * @route   POST /api/users/bulk/update
 * @desc    Bulk update users
 * @access  Private (requires 'users' update permission)
 */
router.post('/bulk/update',
  requirePermission('users', 'update'),
  [
    body('updates').isArray({ min: 1 }).withMessage('Updates array is required'),
    body('updates.*.userId').isMongoId().withMessage('Invalid user ID in updates'),
    body('updates.*.data').isObject().withMessage('Update data is required'),
    body('updates.*.data.firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
    body('updates.*.data.lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    body('updates.*.data.email').optional().isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('updates.*.data.phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Invalid phone number'),
    body('updates.*.data.status').optional().isIn(['active', 'inactive', 'suspended', 'banned', 'pending_verification']).withMessage('Invalid status')
  ],
  auditLogger('BULK_UPDATE_USERS', 'user'),
  bulkUpdateUsers
);

/**
 * @route   POST /api/users/bulk/status
 * @desc    Bulk update user status (activate, suspend, ban)
 * @access  Private (requires 'users' update permission)
 */
router.post('/bulk/status',
  requirePermission('users', 'update'),
  [
    body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
    body('userIds.*').isMongoId().withMessage('Invalid user ID'),
    body('status').isIn(['active', 'inactive', 'suspended', 'banned']).withMessage('Invalid status'),
    body('reason').optional().isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters')
  ],
  auditLogger('BULK_UPDATE_USER_STATUS', 'user'),
  bulkUpdateUserStatus
);

/**
 * @route   POST /api/users/bulk/delete
 * @desc    Bulk delete users (soft delete)
 * @access  Private (requires 'users' delete permission)
 */
router.post('/bulk/delete',
  requirePermission('users', 'delete'),
  [
    body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
    body('userIds.*').isMongoId().withMessage('Invalid user ID'),
    body('reason').optional().isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters')
  ],
  auditLogger('BULK_DELETE_USERS', 'user'),
  bulkDeleteUsers
);

// ============ CSV IMPORT/EXPORT ============

/**
 * @route   POST /api/users/export/csv
 * @desc    Export users to CSV
 * @access  Private (requires 'users' read permission)
 */
router.post('/export/csv',
  requirePermission('users', 'read'),
  [
    body('filters').optional().isObject().withMessage('Filters must be an object'),
    body('fields').optional().isArray().withMessage('Fields must be an array'),
    body('filename').optional().isString().withMessage('Filename must be a string')
  ],
  auditLogger('EXPORT_USERS_CSV', 'user'),
  exportUsersCSV
);

/**
 * @route   POST /api/users/import/csv
 * @desc    Import users from CSV
 * @access  Private (requires 'users' create permission)
 */
router.post('/import/csv',
  requirePermission('users', 'create'),
  upload.single('csvFile'),
  [
    body('updateExisting').optional().isBoolean().withMessage('updateExisting must be boolean'),
    body('dryRun').optional().isBoolean().withMessage('dryRun must be boolean')
  ],
  auditLogger('IMPORT_USERS_CSV', 'user'),
  importUsersCSV
);

/**
 * @route   GET /api/users/import/template
 * @desc    Download CSV template for user import
 * @access  Private (requires 'users' read permission)
 */
router.get('/import/template',
  requirePermission('users', 'read'),
  auditLogger('DOWNLOAD_CSV_TEMPLATE', 'user'),
  getCSVTemplate
);

module.exports = router;