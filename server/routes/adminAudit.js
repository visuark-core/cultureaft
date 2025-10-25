const express = require('express');
const { body, query, validationResult } = require('express-validator');
const auditService = require('../services/auditService');
const { authenticateAdmin, requirePermission, auditLogger } = require('../middleware/adminAuth');

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

// @route   GET /api/admin/audit/logs
// @desc    Get audit logs with filtering and pagination
// @access  Private (requires system:read permission)
router.get('/logs', 
  requirePermission('system', 'read'),
  auditLogger('read', 'audit_logs'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['timestamp', 'action', 'resource', 'severity']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format for dateFrom'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format for dateTo')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const filters = {
        adminId: req.query.adminId,
        action: req.query.action ? req.query.action.split(',') : undefined,
        resource: req.query.resource ? req.query.resource.split(',') : undefined,
        severity: req.query.severity ? req.query.severity.split(',') : undefined,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        ipAddress: req.query.ipAddress,
        resourceId: req.query.resourceId
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
        sortBy: req.query.sortBy || 'timestamp',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await auditService.getAuditLogs(filters, options);

      res.json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve audit logs'
      });
    }
  }
);

// @route   GET /api/admin/audit/admin/:adminId/activity
// @desc    Get activity summary for specific admin
// @access  Private (requires system:read permission)
router.get('/admin/:adminId/activity',
  requirePermission('system', 'read'),
  auditLogger('read', 'admin_activity'),
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { adminId } = req.params;
      const days = parseInt(req.query.days) || 30;

      const activitySummary = await auditService.getAdminActivitySummary(adminId, days);

      res.json({
        success: true,
        message: 'Admin activity summary retrieved successfully',
        data: {
          adminId,
          period: `${days} days`,
          summary: activitySummary
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve admin activity summary'
      });
    }
  }
);

// @route   GET /api/admin/audit/security-events
// @desc    Get security events
// @access  Private (requires system:read permission)
router.get('/security-events',
  requirePermission('system', 'read'),
  auditLogger('read', 'security_events'),
  [
    query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90'),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7;
      const severity = req.query.severity ? req.query.severity.split(',') : ['high', 'critical'];

      const securityEvents = await auditService.getSecurityEvents(days, severity);

      res.json({
        success: true,
        message: 'Security events retrieved successfully',
        data: {
          period: `${days} days`,
          severity,
          events: securityEvents
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve security events'
      });
    }
  }
);

// @route   GET /api/admin/audit/statistics
// @desc    Get audit statistics
// @access  Private (requires system:read permission)
router.get('/statistics',
  requirePermission('system', 'read'),
  auditLogger('read', 'audit_statistics'),
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const statistics = await auditService.getAuditStatistics(days);

      res.json({
        success: true,
        message: 'Audit statistics retrieved successfully',
        data: statistics
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve audit statistics'
      });
    }
  }
);

// @route   GET /api/admin/audit/export
// @desc    Export audit logs
// @access  Private (requires system:export permission)
router.get('/export',
  requirePermission('system', 'export'),
  auditLogger('export', 'audit_logs'),
  [
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format for dateFrom'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format for dateTo')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const filters = {
        adminId: req.query.adminId,
        action: req.query.action ? req.query.action.split(',') : undefined,
        resource: req.query.resource ? req.query.resource.split(',') : undefined,
        severity: req.query.severity ? req.query.severity.split(',') : undefined,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        ipAddress: req.query.ipAddress,
        resourceId: req.query.resourceId
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const format = req.query.format || 'json';
      const report = await auditService.generateAuditReport(filters, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(report);
      } else {
        res.json({
          success: true,
          message: 'Audit report generated successfully',
          data: report
        });
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate audit report'
      });
    }
  }
);

// @route   POST /api/admin/audit/cleanup
// @desc    Clean up old audit logs
// @access  Private (requires system:delete permission)
router.post('/cleanup',
  requirePermission('system', 'delete'),
  auditLogger('delete', 'audit_logs'),
  [
    body('retentionDays').isInt({ min: 30, max: 2555 }).withMessage('Retention days must be between 30 and 2555 (7 years)')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { retentionDays } = req.body;
      const deletedCount = await auditService.cleanupOldLogs(retentionDays);

      res.json({
        success: true,
        message: 'Audit logs cleanup completed successfully',
        data: {
          deletedCount,
          retentionDays
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cleanup audit logs'
      });
    }
  }
);

// @route   GET /api/admin/audit/my-activity
// @desc    Get current admin's activity
// @access  Private
router.get('/my-activity',
  auditLogger('read', 'own_activity'),
  [
    query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const activitySummary = await auditService.getAdminActivitySummary(req.admin.id, days);

      res.json({
        success: true,
        message: 'Your activity summary retrieved successfully',
        data: {
          period: `${days} days`,
          summary: activitySummary
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve your activity summary'
      });
    }
  }
);

module.exports = router;