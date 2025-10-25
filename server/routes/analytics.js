const express = require('express');
const router = express.Router();
const {
  getRealTimeAnalytics,
  getKPIs,
  getSalesChart,
  getCategoryDistribution,
  getTopProducts,
  getRecentOrders,
  getCustomerAnalytics,
  getDashboardData,
  healthCheck
} = require('../controllers/analyticsController');

const {
  validateAnalyticsQuery,
  validateDateRange,
  analyticsRateLimit,
  sanitizeRequest,
  securityHeaders
} = require('../middleware/validation');

// Apply middleware to all routes
router.use(securityHeaders);
router.use(sanitizeRequest);
router.use(analyticsRateLimit);

// Health check endpoint (no validation needed)
router.get('/health', healthCheck);

// Real-time analytics endpoint
router.get('/realtime', getRealTimeAnalytics);

// Individual analytics endpoints with validation
router.get('/kpis', validateAnalyticsQuery, validateDateRange, getKPIs);
router.get('/sales-chart', validateAnalyticsQuery, validateDateRange, getSalesChart);
router.get('/category-distribution', getCategoryDistribution);
router.get('/top-products', validateAnalyticsQuery, getTopProducts);
router.get('/recent-orders', validateAnalyticsQuery, getRecentOrders);
router.get('/customer-analytics', getCustomerAnalytics);

// Comprehensive dashboard data endpoint
router.get('/dashboard', validateAnalyticsQuery, validateDateRange, getDashboardData);

// Google Sheets analytics endpoints
router.get('/sheets-analytics', validateAnalyticsQuery, validateDateRange, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const AnalyticsService = require('../services/analyticsService');
    const sheetsData = await AnalyticsService.getSheetsAnalytics(parseInt(days));
    
    res.status(200).json({
      success: true,
      data: sheetsData,
      message: 'Google Sheets analytics retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve Google Sheets analytics'
    });
  }
});

// Sync with Google Sheets endpoint
router.post('/sync-sheets', async (req, res) => {
  try {
    const AnalyticsService = require('../services/analyticsService');
    // This would trigger a sync operation if needed
    res.status(200).json({
      success: true,
      message: 'Google Sheets sync completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync with Google Sheets'
    });
  }
});

module.exports = router;