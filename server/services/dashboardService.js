const userService = require('./userService');
const productService = require('./productService');
const orderService = require('./orderService');
const auditService = require('./auditService');
const AdminUser = require('../models/AdminUser');

class DashboardService {
  
  // Get comprehensive dashboard overview
  async getDashboardOverview(adminId, days = 30) {
    try {
      const [
        userStats,
        productStats,
        orderStats,
        recentActivity,
        systemHealth
      ] = await Promise.all([
        this.getUserOverview(days),
        this.getProductOverview(),
        this.getOrderOverview(days),
        this.getRecentActivity(adminId, 10),
        this.getSystemHealth()
      ]);

      return {
        period: `${days} days`,
        generatedAt: new Date().toISOString(),
        users: userStats,
        products: productStats,
        orders: orderStats,
        recentActivity,
        systemHealth
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard overview: ${error.message}`);
    }
  }

  // Get user overview statistics
  async getUserOverview(days = 30) {
    try {
      const userStats = await userService.getUserStatistics();
      
      // Calculate growth metrics
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const Customer = require('../models/Customer');
      const newUsersCount = await Customer.countDocuments({
        registrationDate: { $gte: startDate }
      });

      const activeUsersCount = await Customer.countDocuments({
        status: 'active'
      });

      const blockedUsersCount = await Customer.countDocuments({
        status: 'blocked'
      });

      return {
        total: userStats.statusStats?.reduce((sum, stat) => sum + stat.count, 0) || 0,
        active: activeUsersCount,
        blocked: blockedUsersCount,
        newInPeriod: newUsersCount,
        topSpenders: userStats.topSpenders?.slice(0, 5) || [],
        totalRevenue: userStats.spendingStats?.[0]?.totalRevenue || 0,
        averageSpent: userStats.spendingStats?.[0]?.averageSpent || 0
      };
    } catch (error) {
      console.error('Error getting user overview:', error);
      return {
        total: 0,
        active: 0,
        blocked: 0,
        newInPeriod: 0,
        topSpenders: [],
        totalRevenue: 0,
        averageSpent: 0
      };
    }
  }

  // Get product overview statistics
  async getProductOverview() {
    try {
      const productStats = await productService.getProductStatistics();
      const lowStockProducts = await productService.getLowStockProducts(10);
      const outOfStockProducts = await productService.getOutOfStockProducts();

      return {
        total: productStats.stockStats?.[0]?.totalProducts || 0,
        totalStock: productStats.stockStats?.[0]?.totalStock || 0,
        outOfStock: productStats.stockStats?.[0]?.outOfStock || 0,
        lowStock: productStats.stockStats?.[0]?.lowStock || 0,
        totalValue: productStats.priceStats?.[0]?.totalValue || 0,
        averagePrice: productStats.priceStats?.[0]?.averagePrice || 0,
        featured: productStats.featuredStats?.[0]?.featured || 0,
        categories: productStats.categoryStats?.length || 0,
        lowStockProducts: lowStockProducts.slice(0, 5),
        outOfStockProducts: outOfStockProducts.slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting product overview:', error);
      return {
        total: 0,
        totalStock: 0,
        outOfStock: 0,
        lowStock: 0,
        totalValue: 0,
        averagePrice: 0,
        featured: 0,
        categories: 0,
        lowStockProducts: [],
        outOfStockProducts: []
      };
    }
  }

  // Get order overview statistics
  async getOrderOverview(days = 30) {
    try {
      const orderStats = await orderService.getOrderStatistics(days);
      const ordersRequiringAttention = await orderService.getOrdersRequiringAttention();
      const revenueAnalytics = await orderService.getRevenueAnalytics('week');

      return {
        total: orderStats.overallStats?.[0]?.totalOrders || 0,
        totalRevenue: orderStats.overallStats?.[0]?.totalRevenue || 0,
        averageOrderValue: orderStats.overallStats?.[0]?.averageOrderValue || 0,
        statusBreakdown: orderStats.statusStats || [],
        paymentBreakdown: orderStats.paymentStats || [],
        requiresAttention: ordersRequiringAttention.length,
        recentTrend: revenueAnalytics.slice(-7), // Last 7 days
        topCategories: orderStats.categoryStats?.slice(0, 5) || []
      };
    } catch (error) {
      console.error('Error getting order overview:', error);
      return {
        total: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusBreakdown: [],
        paymentBreakdown: [],
        requiresAttention: 0,
        recentTrend: [],
        topCategories: []
      };
    }
  }

  // Get recent admin activity
  async getRecentActivity(adminId, limit = 10) {
    try {
      const filters = {
        adminId: adminId
      };
      
      const { logs } = await auditService.getAuditLogs(filters, {
        limit,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });

      return logs.map(log => ({
        id: log._id,
        action: log.action,
        resource: log.resource,
        description: log.description,
        timestamp: log.timestamp,
        severity: log.severity
      }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // Get system health metrics
  async getSystemHealth() {
    try {
      const [
        totalAdmins,
        activeAdmins,
        recentSecurityEvents,
        systemStats
      ] = await Promise.all([
        AdminUser.countDocuments(),
        AdminUser.countDocuments({ isActive: true }),
        auditService.getSecurityEvents(7, ['high', 'critical']),
        this.getSystemStats()
      ]);

      return {
        admins: {
          total: totalAdmins,
          active: activeAdmins
        },
        security: {
          recentEvents: recentSecurityEvents.length,
          criticalEvents: recentSecurityEvents.filter(e => e.severity === 'critical').length
        },
        system: systemStats
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        admins: { total: 0, active: 0 },
        security: { recentEvents: 0, criticalEvents: 0 },
        system: { uptime: 0, memory: {}, database: 'unknown' }
      };
    }
  }

  // Get system statistics
  async getSystemStats() {
    try {
      const mongoose = require('mongoose');
      
      return {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      };
    } catch (error) {
      return {
        uptime: 0,
        memory: {},
        database: 'unknown',
        nodeVersion: 'unknown',
        environment: 'unknown'
      };
    }
  }

  // Get alerts and notifications
  async getAlerts() {
    try {
      const alerts = [];

      // Check for low stock products
      const lowStockProducts = await productService.getLowStockProducts(5);
      if (lowStockProducts.length > 0) {
        alerts.push({
          type: 'warning',
          category: 'inventory',
          message: `${lowStockProducts.length} products have low stock (≤5 items)`,
          count: lowStockProducts.length,
          priority: 'medium'
        });
      }

      // Check for out of stock products
      const outOfStockProducts = await productService.getOutOfStockProducts();
      if (outOfStockProducts.length > 0) {
        alerts.push({
          type: 'error',
          category: 'inventory',
          message: `${outOfStockProducts.length} products are out of stock`,
          count: outOfStockProducts.length,
          priority: 'high'
        });
      }

      // Check for orders requiring attention
      const ordersRequiringAttention = await orderService.getOrdersRequiringAttention();
      if (ordersRequiringAttention.length > 0) {
        alerts.push({
          type: 'warning',
          category: 'orders',
          message: `${ordersRequiringAttention.length} orders require attention`,
          count: ordersRequiringAttention.length,
          priority: 'high'
        });
      }

      // Check for recent security events
      const securityEvents = await auditService.getSecurityEvents(1, ['critical']);
      if (securityEvents.length > 0) {
        alerts.push({
          type: 'error',
          category: 'security',
          message: `${securityEvents.length} critical security events in the last 24 hours`,
          count: securityEvents.length,
          priority: 'critical'
        });
      }

      return alerts.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  // Get quick stats for dashboard widgets
  async getQuickStats() {
    try {
      const Customer = require('../models/Customer');
      const Product = require('../models/Product');
      const Order = require('../models/Order');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalUsers,
        totalProducts,
        totalOrders,
        todayOrders,
        todayRevenue,
        pendingOrders
      ] = await Promise.all([
        Customer.countDocuments({ status: 'active' }),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.countDocuments({ orderDate: { $gte: today } }),
        Order.aggregate([
          { $match: { orderDate: { $gte: today }, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]),
        Order.countDocuments({ status: 'pending' })
      ]);

      return {
        users: totalUsers,
        products: totalProducts,
        orders: totalOrders,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        pendingOrders
      };
    } catch (error) {
      console.error('Error getting quick stats:', error);
      return {
        users: 0,
        products: 0,
        orders: 0,
        todayOrders: 0,
        todayRevenue: 0,
        pendingOrders: 0
      };
    }
  }
}

module.exports = new DashboardService();