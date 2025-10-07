const AnalyticsService = require('../services/analyticsService');

/**
 * Get KPI metrics (revenue, sales, customers, AOV)
 */
const getKPIs = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const kpiData = await AnalyticsService.calculateKPIs(parseInt(days));
    
    res.status(200).json({
      success: true,
      data: kpiData,
      message: 'KPI data retrieved successfully'
    });
  } catch (error) {
    console.error('Error in getKPIs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve KPI data',
      data: null
    });
  }
};

/**
 * Get daily sales data for charts
 */
const getSalesChart = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const salesData = await AnalyticsService.getSalesChartData(parseInt(days));
    
    res.status(200).json({
      success: true,
      data: salesData,
      message: 'Sales chart data retrieved successfully'
    });
  } catch (error) {
    console.error('Error in getSalesChart:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve sales chart data',
      data: []
    });
  }
};

/**
 * Get sales distribution by category
 */
const getCategoryDistribution = async (req, res) => {
  try {
    const categoryData = await AnalyticsService.getCategoryDistribution();
    
    res.status(200).json({
      success: true,
      data: categoryData,
      message: 'Category distribution data retrieved successfully'
    });
  } catch (error) {
    console.error('Error in getCategoryDistribution:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve category distribution data',
      data: []
    });
  }
};

/**
 * Get top-selling products
 */
const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const topProducts = await AnalyticsService.getTopProducts(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: topProducts,
      message: 'Top products data retrieved successfully'
    });
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve top products data',
      data: []
    });
  }
};

/**
 * Get recent orders
 */
const getRecentOrders = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recentOrders = await AnalyticsService.getRecentOrders(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: recentOrders,
      message: 'Recent orders data retrieved successfully'
    });
  } catch (error) {
    console.error('Error in getRecentOrders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve recent orders data',
      data: []
    });
  }
};

/**
 * Get customer analytics
 */
const getCustomerAnalytics = async (req, res) => {
  try {
    const customerData = await AnalyticsService.getCustomerAnalytics();
    
    res.status(200).json({
      success: true,
      data: customerData,
      message: 'Customer analytics data retrieved successfully'
    });
  } catch (error) {
    console.error('Error in getCustomerAnalytics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve customer analytics data',
      data: null
    });
  }
};

/**
 * Get comprehensive analytics dashboard data
 */
const getDashboardData = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Fetch all analytics data in parallel
    const [kpiData, salesData, categoryData, topProducts] = await Promise.all([
      AnalyticsService.calculateKPIs(parseInt(days)),
      AnalyticsService.getSalesChartData(parseInt(days)),
      AnalyticsService.getCategoryDistribution(),
      AnalyticsService.getTopProducts(10)
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        kpis: kpiData,
        salesChart: salesData,
        categoryDistribution: categoryData,
        topProducts: topProducts
      },
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve dashboard data',
      data: null
    });
  }
};

/**
 * Health check endpoint for analytics service
 */
const healthCheck = async (req, res) => {
  try {
    // Simple health check - try to count orders
    const Order = require('../models/Order');
    await Order.countDocuments().limit(1);
    
    res.status(200).json({
      success: true,
      message: 'Analytics service is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Analytics service is unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getKPIs,
  getSalesChart,
  getCategoryDistribution,
  getTopProducts,
  getRecentOrders,
  getCustomerAnalytics,
  getDashboardData,
  healthCheck
};