const express = require('express');
const router = express.Router();
const {
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

// Individual analytics endpoints with validation
router.get('/kpis', validateAnalyticsQuery, validateDateRange, getKPIs);
router.get('/sales-chart', validateAnalyticsQuery, validateDateRange, getSalesChart);
router.get('/category-distribution', getCategoryDistribution);
router.get('/top-products', validateAnalyticsQuery, getTopProducts);
router.get('/recent-orders', validateAnalyticsQuery, getRecentOrders);
router.get('/customer-analytics', getCustomerAnalytics);

// Comprehensive dashboard data endpoint
router.get('/dashboard', validateAnalyticsQuery, validateDateRange, getDashboardData);

module.exports = router;