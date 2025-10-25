const express = require('express');
const { query, validationResult } = require('express-validator');
const dashboardService = require('../services/dashboardService');
const { 
  authenticateAdmin, 
  requirePermission, 
  auditLogger 
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

// @route   GET /api/admin/dashboard/overview
// @desc    Get comprehensive dashboard overview
// @access  Private (requires analytics:read permission)
router.get('/overview',
  requirePermission('analytics', 'read'),
  auditLogger('read', 'dashboard_overview'),
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const overview = await dashboardService.getDashboardOverview(req.admin.id, days);

      res.json({
        success: true,
        message: 'Dashboard overview retrieved successfully',
        data: overview
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve dashboard overview'
      });
    }
  }
);

// @route   GET /api/admin/dashboard/quick-stats
// @desc    Get quick statistics for dashboard widgets
// @access  Private (requires analytics:read permission)
router.get('/quick-stats',
  requirePermission('analytics', 'read'),
  async (req, res) => {
    try {
      const stats = await dashboardService.getQuickStats();

      res.json({
        success: true,
        message: 'Quick stats retrieved successfully',
        data: stats
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve quick stats'
      });
    }
  }
);

// @route   GET /api/admin/dashboard/alerts
// @desc    Get system alerts and notifications
// @access  Private (requires analytics:read permission)
router.get('/alerts',
  requirePermission('analytics', 'read'),
  auditLogger('read', 'dashboard_alerts'),
  async (req, res) => {
    try {
      const alerts = await dashboardService.getAlerts();

      res.json({
        success: true,
        message: 'Alerts retrieved successfully',
        data: alerts
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve alerts'
      });
    }
  }
);

// @route   GET /api/admin/dashboard/activity
// @desc    Get recent admin activity
// @access  Private
router.get('/activity',
  auditLogger('read', 'dashboard_activity'),
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const activity = await dashboardService.getRecentActivity(req.admin.id, limit);

      res.json({
        success: true,
        message: 'Recent activity retrieved successfully',
        data: activity
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve recent activity'
      });
    }
  }
);

// @route   GET /api/admin/dashboard/system-health
// @desc    Get system health metrics
// @access  Private (requires system:read permission)
router.get('/system-health',
  requirePermission('system', 'read'),
  auditLogger('read', 'system_health'),
  async (req, res) => {
    try {
      const health = await dashboardService.getSystemHealth();

      res.json({
        success: true,
        message: 'System health retrieved successfully',
        data: health
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve system health'
      });
    }
  }
);

module.exports = router;