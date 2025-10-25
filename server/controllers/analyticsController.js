const AnalyticsService = require('../services/analyticsService');

exports.getAnalytics = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const analyticsData = await AnalyticsService.getAnalytics(parseInt(days));
        res.status(200).json({
            success: true,
            data: analyticsData,
            message: 'Analytics data retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve analytics data'
        });
    }
};

// Health check endpoint
exports.healthCheck = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            },
            message: 'Analytics service is healthy'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Health check failed'
        });
    }
};

// Real-time analytics
exports.getRealTimeAnalytics = async (req, res) => {
    try {
        const analyticsData = await AnalyticsService.getRealTimeAnalytics();
        res.status(200).json({
            success: true,
            data: analyticsData,
            message: 'Real-time analytics retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve real-time analytics'
        });
    }
};

// KPIs
exports.getKPIs = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const kpis = await AnalyticsService.calculateKPIs(parseInt(days));
        res.status(200).json({
            success: true,
            data: kpis,
            message: 'KPIs retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve KPIs'
        });
    }
};

// Sales chart data
exports.getSalesChart = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const salesData = await AnalyticsService.getSalesChartData(parseInt(days));
        res.status(200).json({
            success: true,
            data: salesData,
            message: 'Sales chart data retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve sales chart data'
        });
    }
};

// Category distribution
exports.getCategoryDistribution = async (req, res) => {
    try {
        const categoryData = await AnalyticsService.getCategoryDistribution();
        res.status(200).json({
            success: true,
            data: categoryData,
            message: 'Category distribution retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve category distribution'
        });
    }
};

// Top products
exports.getTopProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const topProducts = await AnalyticsService.getTopProducts(parseInt(limit));
        res.status(200).json({
            success: true,
            data: topProducts,
            message: 'Top products retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve top products'
        });
    }
};

// Recent orders
exports.getRecentOrders = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const recentOrders = await AnalyticsService.getRecentOrders(parseInt(limit));
        res.status(200).json({
            success: true,
            data: recentOrders,
            message: 'Recent orders retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve recent orders'
        });
    }
};

// Customer analytics
exports.getCustomerAnalytics = async (req, res) => {
    try {
        const customerData = await AnalyticsService.getCustomerAnalytics();
        res.status(200).json({
            success: true,
            data: customerData,
            message: 'Customer analytics retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve customer analytics'
        });
    }
};

// Dashboard data
exports.getDashboardData = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const analyticsData = await AnalyticsService.getAnalytics(parseInt(days));
        res.status(200).json({
            success: true,
            data: analyticsData,
            message: 'Dashboard data retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve dashboard data'
        });
    }
};