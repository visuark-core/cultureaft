const express = require('express');
const router = express.Router();
const { authenticateAdmin, requirePermission } = require('../middleware/auth');
const {
  getSettings,
  updateSetting,
  getSystemHealth,
  getPerformanceMetrics,
  getAuditLogs,
  getSecurityReport,
  getSystemStats,
  initializeSettings,
  recordMetrics
} = require('../controllers/systemController');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// System Settings Routes
router.get('/settings', requirePermission('system', 'read'), getSettings);
router.get('/settings/:category', requirePermission('system', 'read'), getSettings);
router.put('/settings/:category/:key', requirePermission('system', 'update'), updateSetting);
router.post('/settings/initialize', requirePermission('system', 'create'), initializeSettings);

// System Health and Performance Routes
router.get('/health', requirePermission('system', 'read'), getSystemHealth);
router.get('/metrics', requirePermission('system', 'read'), getPerformanceMetrics);
router.post('/metrics/record', requirePermission('system', 'create'), recordMetrics);
router.get('/stats', requirePermission('system', 'read'), getSystemStats);

// Audit and Security Routes
router.get('/audit', requirePermission('system', 'read'), getAuditLogs);
router.get('/security/report', requirePermission('system', 'read'), getSecurityReport);

module.exports = router;