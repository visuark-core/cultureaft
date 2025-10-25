const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const userService = require('../services/userService');
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

// @route   GET /api/admin/users
// @desc    Get users with filtering and pagination
// @access  Private (requires users:read permission)
router.get('/',
  requirePermission('users', 'read'),
  auditLogger('read', 'users'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['createdAt', 'firstName', 'lastName', 'email', 'totalOrders', 'totalSpent', 'registrationDate']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('status').optional().isIn(['active', 'inactive', 'blocked', 'all']).withMessage('Invalid status filter'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search query too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        registrationDateFrom: req.query.registrationDateFrom,
        registrationDateTo: req.query.registrationDateTo,
        minOrders: req.query.minOrders,
        maxOrders: req.query.maxOrders,
        minSpent: req.query.minSpent,
        maxSpent: req.query.maxSpent,
        city: req.query.city,
        state: req.query.state
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        search: req.query.search || ''
      };

      const result = await userService.getUsers(filters, options);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve users'
      });
    }
  }
);

// @route   GET /api/admin/users/statistics
// @desc    Get user statistics
// @access  Private (requires users:read permission)
router.get('/statistics',
  requirePermission('users', 'read'),
  auditLogger('read', 'user_statistics'),
  async (req, res) => {
    try {
      const statistics = await userService.getUserStatistics();

      res.json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: statistics
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve user statistics'
      });
    }
  }
);

// @route   GET /api/admin/users/search
// @desc    Search users
// @access  Private (requires users:read permission)
router.get('/search',
  requirePermission('users', 'read'),
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
          status: req.query.status
        },
        limit: parseInt(req.query.limit) || 20
      };

      const users = await userService.searchUsers(searchCriteria);

      res.json({
        success: true,
        message: 'User search completed successfully',
        data: users
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search users'
      });
    }
  }
);

// @route   GET /api/admin/users/:id
// @desc    Get single user by ID
// @access  Private (requires users:read permission)
router.get('/:id',
  requirePermission('users', 'read'),
  auditLogger('read', 'users'),
  [
    param('id').isMongoId().withMessage('Invalid user ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await userService.getUserById(req.params.id);

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });

    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve user'
      });
    }
  }
);

// @route   GET /api/admin/users/:id/activity
// @desc    Get user activity
// @access  Private (requires users:read permission)
router.get('/:id/activity',
  requirePermission('users', 'read'),
  auditLogger('read', 'user_activity'),
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const activity = await userService.getUserActivity(req.params.id, days);

      res.json({
        success: true,
        message: 'User activity retrieved successfully',
        data: activity
      });

    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve user activity'
      });
    }
  }
);

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Private (requires users:create permission)
router.post('/',
  requirePermission('users', 'create'),
  auditLogger('create', 'users'),
  [
    body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required and must be less than 50 characters'),
    body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required and must be less than 50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('status').optional().isIn(['active', 'inactive', 'blocked']).withMessage('Invalid status')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        status: req.body.status || 'active',
        addresses: req.body.addresses || [],
        preferences: req.body.preferences || {
          newsletter: true,
          orderUpdates: true,
          promotions: true
        }
      };

      const user = await userService.createUser(userData, req.admin.id);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });

    } catch (error) {
      const statusCode = error.message === 'Email already exists' ? 409 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create user'
      });
    }
  }
);

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (requires users:update permission)
router.put('/:id',
  requirePermission('users', 'update'),
  auditLogger('update', 'users'),
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be less than 50 characters'),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be less than 50 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('status').optional().isIn(['active', 'inactive', 'blocked']).withMessage('Invalid status')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const updateData = {};
      
      // Only include provided fields
      const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender', 'status', 'addresses', 'preferences'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      const user = await userService.updateUser(req.params.id, updateData, req.admin.id);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });

    } catch (error) {
      let statusCode = 500;
      if (error.message === 'User not found') statusCode = 404;
      if (error.message === 'Email already exists') statusCode = 409;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update user'
      });
    }
  }
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (soft delete)
// @access  Private (requires users:delete permission)
router.delete('/:id',
  requirePermission('users', 'delete'),
  sensitiveOperationLimiter(),
  auditLogger('delete', 'users'),
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    query('hard').optional().isBoolean().withMessage('Hard delete must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const hardDelete = req.query.hard === 'true';
      const user = await userService.deleteUser(req.params.id, req.admin.id, hardDelete);

      res.json({
        success: true,
        message: hardDelete ? 'User permanently deleted' : 'User deactivated successfully',
        data: user
      });

    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  }
);

// @route   POST /api/admin/users/:id/suspend
// @desc    Suspend user
// @access  Private (requires users:suspend permission)
router.post('/:id/suspend',
  requirePermission('users', 'suspend'),
  sensitiveOperationLimiter(),
  auditLogger('suspend', 'users'),
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await userService.suspendUser(req.params.id, req.admin.id, req.body.reason);

      res.json({
        success: true,
        message: 'User suspended successfully',
        data: user
      });

    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to suspend user'
      });
    }
  }
);

// @route   POST /api/admin/users/:id/activate
// @desc    Activate user
// @access  Private (requires users:update permission)
router.post('/:id/activate',
  requirePermission('users', 'update'),
  auditLogger('activate', 'users'),
  [
    param('id').isMongoId().withMessage('Invalid user ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await userService.activateUser(req.params.id, req.admin.id);

      res.json({
        success: true,
        message: 'User activated successfully',
        data: user
      });

    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to activate user'
      });
    }
  }
);

// @route   POST /api/admin/users/bulk-update
// @desc    Bulk update users
// @access  Private (requires users:update permission)
router.post('/bulk-update',
  requirePermission('users', 'update'),
  sensitiveOperationLimiter(60000, 5), // More restrictive for bulk operations
  auditLogger('bulk_operation', 'users'),
  [
    body('userIds').isArray({ min: 1, max: 100 }).withMessage('User IDs array is required (max 100)'),
    body('userIds.*').isMongoId().withMessage('Invalid user ID in array'),
    body('updateData').isObject().withMessage('Update data is required'),
    body('updateData.status').optional().isIn(['active', 'inactive', 'blocked']).withMessage('Invalid status')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userIds, updateData } = req.body;
      
      // Validate update data contains only allowed fields
      const allowedFields = ['status', 'preferences'];
      const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid fields for bulk update: ${invalidFields.join(', ')}`
        });
      }

      const result = await userService.bulkUpdateUsers(userIds, updateData, req.admin.id);

      res.json({
        success: true,
        message: `Bulk update completed. ${result.modifiedCount} users updated.`,
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

// @route   GET /api/admin/users/export
// @desc    Export users to CSV
// @access  Private (requires users:export permission)
router.get('/export/csv',
  requirePermission('users', 'export'),
  auditLogger('export', 'users'),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        registrationDateFrom: req.query.registrationDateFrom,
        registrationDateTo: req.query.registrationDateTo,
        city: req.query.city,
        state: req.query.state
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const csvData = await userService.exportUsers(filters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users-export-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvData);

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export users'
      });
    }
  }
);

module.exports = router;