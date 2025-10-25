const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Analytics = require('../models/Analytics');
const EventEmitter = require('events');
const { getRedisClient, getRedisPubSub, getRedisSubscriber, isRedisAvailable } = require('../config/redis');

// Google Sheets integration
const OrderSheetsDAO = require('./sheets/OrderSheetsDAO');
const CustomerSheetsDAO = require('./sheets/CustomerSheetsDAO');
const googleSheetsService = require('./googleSheetsService');

// Event emitter for analytics updates
const analyticsEmitter = new EventEmitter();

class AnalyticsService extends EventEmitter {
  /**
   * Calculate KPI metrics for the current and previous periods
   * @param {number} days - Number of days for current period (default: 30)
   * @returns {Object} KPI data with current values and percentage changes
   */
  static async calculateKPIs(days = 30) {
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
    
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));
    
    const previousPeriodEnd = new Date(currentPeriodStart);

    try {
      // Current period metrics
      const currentMetrics = await this._calculatePeriodMetrics(currentPeriodStart, new Date());
      
      // Previous period metrics
      const previousMetrics = await this._calculatePeriodMetrics(previousPeriodStart, previousPeriodEnd);

      return {
        totalRevenue: {
          value: currentMetrics.totalRevenue,
          change: this._calculatePercentageChange(previousMetrics.totalRevenue, currentMetrics.totalRevenue)
        },
        totalSales: {
          value: currentMetrics.totalSales,
          change: this._calculatePercentageChange(previousMetrics.totalSales, currentMetrics.totalSales)
        },
        newCustomers: {
          value: currentMetrics.newCustomers,
          change: this._calculatePercentageChange(previousMetrics.newCustomers, currentMetrics.newCustomers)
        },
        avgOrderValue: {
          value: currentMetrics.avgOrderValue,
          change: this._calculatePercentageChange(previousMetrics.avgOrderValue, currentMetrics.avgOrderValue)
        }
      };
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      throw new Error('Failed to calculate KPI metrics');
    }
  }

  /**
   * Calculate metrics for a specific time period
   * @private
   */
  static async _calculatePeriodMetrics(startDate, endDate) {
    // Get completed orders in the period
    const orders = await Order.find({
      status: { $in: ['completed', 'delivered'] },
      orderDate: { $gte: startDate, $lte: endDate }
    });

    // Calculate total revenue and sales
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalSales = orders.length;

    // Calculate average order value
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Get new customers in the period
    const newCustomers = await Customer.countDocuments({
      registrationDate: { $gte: startDate, $lte: endDate }
    });

    return {
      totalRevenue,
      totalSales,
      newCustomers,
      avgOrderValue
    };
  }

  /**
   * Calculate percentage change between two values
   * @private
   */
  static _calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) {
      return newValue > 0 ? 100 : 0;
    }
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Get daily sales data for the specified number of days
   * @param {number} days - Number of days to retrieve (default: 30)
   * @returns {Array} Array of daily sales data
   */
  static async getSalesChartData(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    try {
      const salesData = await Order.aggregate([
        {
          $match: {
            status: { $in: ['completed', 'delivered'] },
            orderDate: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$orderDate"
              }
            },
            sales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Create array with all days, filling missing days with 0
      const result = [];
      const currentDate = new Date(startDate);
      
      for (let i = 0; i < days; i++) {
        const dateString = currentDate.toISOString().split('T')[0];
        const dayData = salesData.find(item => item._id === dateString);
        
        result.push({
          name: `Day ${i + 1}`,
          date: dateString,
          Sales: dayData ? dayData.sales : 0,
          orderCount: dayData ? dayData.orderCount : 0
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    } catch (error) {
      console.error('Error getting sales chart data:', error);
      throw new Error('Failed to retrieve sales chart data');
    }
  }

  /**
   * Get sales distribution by category
   * @returns {Array} Array of category sales data
   */
  static async getCategoryDistribution() {
    try {
      const categoryData = await Order.aggregate([
        {
          $match: {
            status: { $in: ['completed', 'delivered'] }
          }
        },
        {
          $unwind: "$products"
        },
        {
          $group: {
            _id: "$products.category",
            value: { $sum: { $multiply: ["$products.quantity", "$products.price"] } },
            orderCount: { $sum: "$products.quantity" }
          }
        },
        {
          $match: {
            value: { $gt: 0 }
          }
        },
        {
          $sort: { value: -1 }
        }
      ]);

      return categoryData.map(item => ({
        name: item._id,
        value: item.value,
        orderCount: item.orderCount
      }));
    } catch (error) {
      console.error('Error getting category distribution:', error);
      throw new Error('Failed to retrieve category distribution');
    }
  }

  /**
   * Get top-selling products
   * @param {number} limit - Number of top products to return (default: 10)
   * @returns {Array} Array of top-selling products
   */
  static async getTopProducts(limit = 10) {
    try {
      const topProducts = await Order.aggregate([
        {
          $match: {
            status: { $in: ['completed', 'delivered'] }
          }
        },
        {
          $unwind: "$products"
        },
        {
          $group: {
            _id: "$products.productId",
            name: { $first: "$products.name" },
            sku: { $first: "$products.sku" },
            unitsSold: { $sum: "$products.quantity" },
            totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }
          }
        },
        {
          $sort: { 
            unitsSold: -1,
            totalRevenue: -1
          }
        },
        {
          $limit: limit
        }
      ]);

      return topProducts.map(product => ({
        name: product.name,
        sku: product.sku,
        unitsSold: product.unitsSold,
        revenue: `₹${product.totalRevenue.toLocaleString('en-IN')}`
      }));
    } catch (error) {
      console.error('Error getting top products:', error);
      throw new Error('Failed to retrieve top products');
    }
  }

  /**
   * Get recent orders for monitoring
   * @param {number} limit - Number of recent orders to return (default: 10)
   * @returns {Array} Array of recent orders
   */
  static async getRecentOrders(limit = 10) {
    try {
      const recentOrders = await Order.find({
        status: { $in: ['completed', 'delivered'] }
      })
      .populate('customerId', 'firstName lastName email')
      .sort({ orderDate: -1 })
      .limit(limit)
      .lean();

      return recentOrders.map(order => ({
        orderId: order.orderId,
        customerName: order.customerId ? `${order.customerId.firstName} ${order.customerId.lastName}` : 'Unknown',
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        status: order.status,
        productCount: order.products.length
      }));
    } catch (error) {
      console.error('Error getting recent orders:', error);
      throw new Error('Failed to retrieve recent orders');
    }
  }

  /**
   * Get customer analytics
   * @returns {Object} Customer analytics data
   */
  static async getCustomerAnalytics() {
    try {
      const totalCustomers = await Customer.countDocuments({ status: 'active' });
      const customersThisMonth = await Customer.countDocuments({
        registrationDate: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        },
        status: 'active'
      });

      const topCustomers = await Customer.find({ status: 'active' })
        .sort({ totalSpent: -1 })
        .limit(5)
        .select('firstName lastName email totalSpent totalOrders')
        .lean();

      return {
        totalCustomers,
        customersThisMonth,
        topCustomers: topCustomers.map(customer => ({
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          totalSpent: customer.totalSpent,
          totalOrders: customer.totalOrders
        }))
      };
    } catch (error) {
      console.error('Error getting customer analytics:', error);
      throw new Error('Failed to retrieve customer analytics');
    }
  }

  /**
   * Get real-time analytics dashboard data with Redis caching
   * @returns {Object} Real-time analytics data
   */
  static async getRealTimeAnalytics() {
    try {
      const cacheKey = 'analytics:realtime:dashboard';
      
      // Try to get from cache first if Redis is available
      if (isRedisAvailable()) {
        const redis = getRedisClient();
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return JSON.parse(cachedData);
        }
      }

      // Calculate real-time metrics
      const [customerMetrics, orderMetrics, revenueMetrics] = await Promise.all([
        this.calculateRealTimeCustomerMetrics(),
        this.calculateRealTimeOrderMetrics(),
        this.calculateRealTimeRevenueMetrics()
      ]);

      const analyticsData = {
        customerMetrics,
        orderMetrics,
        revenueMetrics,
        lastUpdated: new Date().toISOString()
      };

      // Cache for 30 seconds if Redis is available
      if (isRedisAvailable()) {
        const redis = getRedisClient();
        await redis.setex(cacheKey, 30, JSON.stringify(analyticsData));
      }

      return analyticsData;
    } catch (error) {
      console.error('Error getting real-time analytics:', error);
      throw new Error('Failed to retrieve real-time analytics');
    }
  }

  /**
   * Calculate real-time customer metrics
   * @private
   */
  static async calculateRealTimeCustomerMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalCustomers,
      newCustomersToday,
      activeCustomers,
      customersThisMonth,
      customersLastMonth,
      customerGrowthData
    ] = await Promise.all([
      Customer.countDocuments({ status: 'active' }),
      Customer.countDocuments({
        registrationDate: { $gte: today },
        status: 'active'
      }),
      Customer.countDocuments({
        status: 'active',
        lastLoginDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      Customer.countDocuments({
        registrationDate: { $gte: thisMonth },
        status: 'active'
      }),
      Customer.countDocuments({
        registrationDate: { $gte: lastMonth, $lte: lastMonthEnd },
        status: 'active'
      }),
      this.getCustomerGrowthTrend(30)
    ]);

    const customerGrowthRate = customersLastMonth > 0 
      ? ((customersThisMonth - customersLastMonth) / customersLastMonth) * 100 
      : 100;

    return {
      totalCustomers,
      newCustomersToday,
      activeCustomers,
      customersThisMonth,
      customerGrowthRate: Math.round(customerGrowthRate * 100) / 100,
      customerGrowthTrend: customerGrowthData
    };
  }

  /**
   * Calculate real-time order metrics
   * @private
   */
  static async calculateRealTimeOrderMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      ordersToday,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      orderStatusDistribution
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'processing'] } }),
      Order.countDocuments({ status: { $in: ['delivered', 'completed'] } }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    return {
      totalOrders,
      ordersToday,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      orderStatusDistribution: orderStatusDistribution.map(item => ({
        status: item._id,
        count: item.count
      }))
    };
  }

  /**
   * Calculate real-time revenue metrics
   * @private
   */
  static async calculateRealTimeRevenueMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalRevenue,
      revenueToday,
      revenueThisMonth,
      paymentMethodBreakdown,
      revenueTrends
    ] = await Promise.all([
      Order.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: today },
            'payment.status': 'completed'
          } 
        },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: thisMonth },
            'payment.status': 'completed'
          } 
        },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.aggregate([
        { $match: { 'payment.status': 'completed' } },
        {
          $group: {
            _id: '$payment.method',
            count: { $sum: 1 },
            amount: { $sum: '$pricing.total' }
          }
        }
      ]),
      this.getRevenueTrends(30)
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      revenueToday: revenueToday[0]?.total || 0,
      revenueThisMonth: revenueThisMonth[0]?.total || 0,
      paymentMethodBreakdown: paymentMethodBreakdown.map(item => ({
        method: item._id,
        count: item.count,
        amount: item.amount
      })),
      revenueTrends
    };
  }

  /**
   * Get customer growth trend data
   * @param {number} days - Number of days to analyze
   * @returns {Array} Growth trend data
   */
  static async getCustomerGrowthTrend(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const growthData = await Customer.aggregate([
      {
        $match: {
          registrationDate: { $gte: startDate },
          status: 'active'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$registrationDate"
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing days with 0
    const result = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < days; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayData = growthData.find(item => item._id === dateString);
      
      result.push({
        date: dateString,
        count: dayData ? dayData.count : 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Get revenue trends data
   * @param {number} days - Number of days to analyze
   * @returns {Array} Revenue trend data
   */
  static async getRevenueTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          'payment.status': 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing days with 0
    const result = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < days; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayData = revenueData.find(item => item._id === dateString);
      
      result.push({
        date: dateString,
        revenue: dayData ? dayData.revenue : 0,
        orders: dayData ? dayData.orders : 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Update real-time analytics when order events occur
   * @param {string} eventType - Type of event (order_created, order_updated, payment_completed, etc.)
   * @param {Object} orderData - Order data
   */
  static async updateRealTimeAnalytics(eventType, orderData) {
    try {
      // Clear cache to force refresh if Redis is available
      if (isRedisAvailable()) {
        const redis = getRedisClient();
        await redis.del('analytics:realtime:dashboard');
        
        // Publish event to Redis pub/sub for WebSocket clients
        const redisPubSub = getRedisPubSub();
        await redisPubSub.publish('analytics:update', JSON.stringify({
          eventType,
          orderData: {
            orderId: orderData.orderId,
            status: orderData.status,
            totalAmount: orderData.pricing?.total || orderData.totalAmount,
            paymentMethod: orderData.payment?.method || orderData.paymentMethod,
            paymentStatus: orderData.payment?.status || orderData.paymentStatus,
            customerId: orderData.customer?.customerId || orderData.customerId,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }));
      }

      // Emit event for local listeners
      analyticsEmitter.emit('analytics:update', { eventType, orderData });

      console.log(`Real-time analytics updated for event: ${eventType}`);
    } catch (error) {
      console.error('Error updating real-time analytics:', error);
    }
  }

  /**
   * Process analytics aggregation for a specific time period
   * @param {Date} date - Date to process
   * @param {string} period - Period type (daily, hourly, weekly, monthly)
   */
  static async processAnalyticsAggregation(date = new Date(), period = 'daily') {
    try {
      let startDate, endDate;
      
      switch (period) {
        case 'hourly':
          startDate = new Date(date);
          startDate.setMinutes(0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 1);
          break;
        case 'daily':
          startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
          break;
        case 'weekly':
          startDate = new Date(date);
          startDate.setDate(startDate.getDate() - startDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'monthly':
          startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
          break;
        default:
          throw new Error('Invalid period type');
      }

      // Calculate metrics for the period
      const [orderMetrics, revenueMetrics, customerMetrics, productMetrics] = await Promise.all([
        this.calculateOrderMetricsForPeriod(startDate, endDate),
        this.calculateRevenueMetricsForPeriod(startDate, endDate),
        this.calculateCustomerMetricsForPeriod(startDate, endDate),
        this.calculateProductMetricsForPeriod(startDate, endDate)
      ]);

      // Save or update analytics record
      const analyticsData = {
        date: startDate,
        period,
        metrics: {
          orders: orderMetrics,
          revenue: revenueMetrics,
          customers: customerMetrics
        },
        products: productMetrics,
        isRealTime: period === 'daily',
        lastUpdated: new Date(),
        dataSource: 'batch'
      };

      await Analytics.findOneAndUpdate(
        { date: startDate, period },
        analyticsData,
        { upsert: true, new: true }
      );

      console.log(`Analytics aggregation completed for ${period} period: ${startDate.toISOString()}`);
    } catch (error) {
      console.error('Error processing analytics aggregation:', error);
      throw error;
    }
  }

  /**
   * Calculate order metrics for a specific period
   * @private
   */
  static async calculateOrderMetricsForPeriod(startDate, endDate) {
    const orderStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const metrics = {
      total: 0,
      new: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      returned: 0
    };

    orderStats.forEach(stat => {
      metrics.total += stat.count;
      if (metrics.hasOwnProperty(stat._id)) {
        metrics[stat._id] = stat.count;
      }
    });

    return metrics;
  }

  /**
   * Calculate revenue metrics for a specific period
   * @private
   */
  static async calculateRevenueMetricsForPeriod(startDate, endDate) {
    const revenueStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: {
            paymentMethod: '$payment.method',
            paymentStatus: '$payment.status'
          },
          count: { $sum: 1 },
          amount: { $sum: '$pricing.total' }
        }
      }
    ]);

    const metrics = {
      total: 0,
      online: 0,
      cod: 0,
      refunded: 0,
      pending: 0,
      averageOrderValue: 0
    };

    let totalOrders = 0;

    revenueStats.forEach(stat => {
      if (stat._id.paymentStatus === 'completed') {
        metrics.total += stat.amount;
        if (stat._id.paymentMethod === 'online') {
          metrics.online += stat.amount;
        } else if (stat._id.paymentMethod === 'cod') {
          metrics.cod += stat.amount;
        }
      } else if (stat._id.paymentStatus === 'refunded') {
        metrics.refunded += stat.amount;
      } else if (stat._id.paymentStatus === 'pending') {
        metrics.pending += stat.amount;
      }
      totalOrders += stat.count;
    });

    metrics.averageOrderValue = totalOrders > 0 ? metrics.total / totalOrders : 0;

    return metrics;
  }

  /**
   * Calculate customer metrics for a specific period
   * @private
   */
  static async calculateCustomerMetricsForPeriod(startDate, endDate) {
    const [newCustomers, totalCustomers, activeCustomers] = await Promise.all([
      Customer.countDocuments({
        registrationDate: { $gte: startDate, $lt: endDate },
        status: 'active'
      }),
      Customer.countDocuments({ status: 'active' }),
      Customer.countDocuments({
        status: 'active',
        lastLoginDate: { $gte: startDate }
      })
    ]);

    return {
      total: totalCustomers,
      new: newCustomers,
      active: activeCustomers,
      returning: 0, // Will be calculated based on order history
      averageLifetimeValue: 0,
      repeatPurchaseRate: 0,
      churnRate: 0
    };
  }

  /**
   * Calculate product metrics for a specific period
   * @private
   */
  static async calculateProductMetricsForPeriod(startDate, endDate) {
    const productStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          'payment.status': 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            productId: '$items.productId',
            name: '$items.name',
            category: '$items.category'
          },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 20 }
    ]);

    const categoryStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          'payment.status': 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    return {
      totalSold: productStats.reduce((sum, item) => sum + item.quantitySold, 0),
      topSelling: productStats.map(item => ({
        productId: item._id.productId,
        name: item._id.name,
        category: item._id.category,
        quantitySold: item.quantitySold,
        revenue: item.revenue,
        orderCount: item.orderCount
      })),
      categories: categoryStats.map(item => ({
        category: item._id,
        quantitySold: item.quantitySold,
        revenue: item.revenue,
        orderCount: item.orderCount,
        averageOrderValue: item.orderCount > 0 ? item.revenue / item.orderCount : 0
      }))
    };
  }

  /**
   * Get analytics event emitter for WebSocket integration
   */
  static getEventEmitter() {
    return analyticsEmitter;
  }

  /**
   * Get comprehensive analytics data for dashboard with Google Sheets integration
   * @param {number} days - Number of days for analysis (default: 30)
   * @returns {Object} Complete analytics data
   */
  static async getAnalytics(days = 30) {
    try {
      const [
        kpis,
        salesChartData,
        categoryDistribution,
        topProducts,
        recentOrders,
        customerAnalytics,
        realTimeAnalytics,
        sheetsAnalytics
      ] = await Promise.all([
        this.calculateKPIs(days),
        this.getSalesChartData(days),
        this.getCategoryDistribution(),
        this.getTopProducts(10),
        this.getRecentOrders(10),
        this.getCustomerAnalytics(),
        this.getRealTimeAnalytics(),
        this.getSheetsAnalytics(days)
      ]);

      return {
        kpis,
        salesChartData,
        categoryDistribution,
        topProducts,
        recentOrders,
        customerAnalytics,
        realTimeAnalytics,
        sheetsAnalytics,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      throw new Error('Failed to retrieve analytics data');
    }
  }

  /**
   * Get analytics data from Google Sheets
   * @param {number} days - Number of days for analysis
   * @returns {Object} Google Sheets analytics data
   */
  static async getSheetsAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get orders and customers from Google Sheets
      const [orders, customers] = await Promise.all([
        OrderSheetsDAO.findAll(),
        CustomerSheetsDAO.findAll()
      ]);

      // Filter orders by date range
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate;
      });

      // Calculate metrics from Google Sheets data
      const sheetsKPIs = await this.calculateSheetsKPIs(filteredOrders, customers, days);
      const sheetsSalesChart = await this.getSheetsSalesChart(filteredOrders, days);
      const sheetsCategoryDistribution = await this.getSheetsCategoryDistribution(filteredOrders);
      const sheetsTopProducts = await this.getSheetsTopProducts(filteredOrders);
      const sheetsCustomerInsights = await this.getSheetsCustomerInsights(customers, filteredOrders);
      const sheetsPaymentAnalytics = await this.getSheetsPaymentAnalytics(filteredOrders);
      const sheetsGeographicAnalytics = await this.getSheetsGeographicAnalytics(filteredOrders);

      return {
        kpis: sheetsKPIs,
        salesChart: sheetsSalesChart,
        categoryDistribution: sheetsCategoryDistribution,
        topProducts: sheetsTopProducts,
        customerInsights: sheetsCustomerInsights,
        paymentAnalytics: sheetsPaymentAnalytics,
        geographicAnalytics: sheetsGeographicAnalytics,
        dataSource: 'google-sheets',
        totalOrders: filteredOrders.length,
        totalCustomers: customers.length,
        lastSyncTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting Google Sheets analytics:', error);
      return {
        error: 'Failed to retrieve Google Sheets analytics',
        dataSource: 'google-sheets',
        lastSyncTime: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate KPIs from Google Sheets data
   */
  static async calculateSheetsKPIs(orders, customers, days) {
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
    
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));
    
    const previousPeriodEnd = new Date(currentPeriodStart);

    // Current period orders
    const currentOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= currentPeriodStart;
    });

    // Previous period orders
    const previousOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= previousPeriodStart && orderDate < previousPeriodEnd;
    });

    // Calculate current metrics
    const currentRevenue = currentOrders
      .filter(order => order.payment?.status === 'completed' || order.payment?.status === 'paid')
      .reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

    const currentSales = currentOrders.length;

    const currentNewCustomers = customers.filter(customer => {
      const regDate = new Date(customer.registrationDate);
      return regDate >= currentPeriodStart;
    }).length;

    const currentAvgOrderValue = currentSales > 0 ? currentRevenue / currentSales : 0;

    // Calculate previous metrics
    const previousRevenue = previousOrders
      .filter(order => order.payment?.status === 'completed' || order.payment?.status === 'paid')
      .reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

    const previousSales = previousOrders.length;

    const previousNewCustomers = customers.filter(customer => {
      const regDate = new Date(customer.registrationDate);
      return regDate >= previousPeriodStart && regDate < previousPeriodEnd;
    }).length;

    const previousAvgOrderValue = previousSales > 0 ? previousRevenue / previousSales : 0;

    return {
      totalRevenue: {
        value: currentRevenue,
        change: this._calculatePercentageChange(previousRevenue, currentRevenue)
      },
      totalSales: {
        value: currentSales,
        change: this._calculatePercentageChange(previousSales, currentSales)
      },
      newCustomers: {
        value: currentNewCustomers,
        change: this._calculatePercentageChange(previousNewCustomers, currentNewCustomers)
      },
      avgOrderValue: {
        value: currentAvgOrderValue,
        change: this._calculatePercentageChange(previousAvgOrderValue, currentAvgOrderValue)
      }
    };
  }

  /**
   * Get sales chart data from Google Sheets
   */
  static async getSheetsSalesChart(orders, days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const salesData = {};

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      salesData[dateString] = { sales: 0, orderCount: 0 };
    }

    // Aggregate orders by date
    orders.forEach(order => {
      if (order.payment?.status === 'completed' || order.payment?.status === 'paid') {
        const orderDate = new Date(order.createdAt);
        const dateString = orderDate.toISOString().split('T')[0];
        
        if (salesData[dateString]) {
          salesData[dateString].sales += order.pricing?.total || 0;
          salesData[dateString].orderCount += 1;
        }
      }
    });

    // Convert to chart format
    return Object.keys(salesData).map((dateString, index) => ({
      name: `Day ${index + 1}`,
      date: dateString,
      Sales: salesData[dateString].sales,
      orderCount: salesData[dateString].orderCount
    }));
  }

  /**
   * Get category distribution from Google Sheets
   */
  static async getSheetsCategoryDistribution(orders) {
    const categoryData = {};

    orders.forEach(order => {
      if (order.payment?.status === 'completed' || order.payment?.status === 'paid') {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const category = item.category || 'uncategorized';
            if (!categoryData[category]) {
              categoryData[category] = { value: 0, orderCount: 0 };
            }
            categoryData[category].value += item.subtotal || (item.price * item.quantity);
            categoryData[category].orderCount += item.quantity;
          });
        }
      }
    });

    return Object.keys(categoryData).map(category => ({
      name: category,
      value: categoryData[category].value,
      orderCount: categoryData[category].orderCount
    }));
  }

  /**
   * Get top products from Google Sheets
   */
  static async getSheetsTopProducts(orders) {
    const productData = {};

    orders.forEach(order => {
      if (order.payment?.status === 'completed' || order.payment?.status === 'paid') {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const key = item.sku || item.productId || item.name;
            if (!productData[key]) {
              productData[key] = {
                name: item.name,
                sku: item.sku || item.productId,
                unitsSold: 0,
                totalRevenue: 0
              };
            }
            productData[key].unitsSold += item.quantity;
            productData[key].totalRevenue += item.subtotal || (item.price * item.quantity);
          });
        }
      }
    });

    return Object.values(productData)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10)
      .map(product => ({
        name: product.name,
        sku: product.sku,
        unitsSold: product.unitsSold,
        revenue: `₹${product.totalRevenue.toLocaleString('en-IN')}`
      }));
  }

  /**
   * Get customer insights from Google Sheets
   */
  static async getSheetsCustomerInsights(customers, orders) {
    const activeCustomers = customers.filter(c => c.status === 'active');
    const totalSpent = activeCustomers.reduce((sum, c) => sum + (parseFloat(c.totalSpent) || 0), 0);
    
    // Customer lifetime value analysis
    const customerLTV = activeCustomers.map(customer => ({
      customerId: customer.customerId,
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      totalSpent: parseFloat(customer.totalSpent) || 0,
      totalOrders: parseInt(customer.totalOrders) || 0,
      avgOrderValue: (parseInt(customer.totalOrders) || 0) > 0 ? 
        (parseFloat(customer.totalSpent) || 0) / (parseInt(customer.totalOrders) || 0) : 0,
      lastOrderDate: customer.lastOrderDate
    })).sort((a, b) => b.totalSpent - a.totalSpent);

    // Customer acquisition by month
    const acquisitionData = {};
    customers.forEach(customer => {
      const regDate = new Date(customer.registrationDate);
      const monthKey = `${regDate.getFullYear()}-${regDate.getMonth() + 1}`;
      acquisitionData[monthKey] = (acquisitionData[monthKey] || 0) + 1;
    });

    return {
      totalCustomers: customers.length,
      activeCustomers: activeCustomers.length,
      totalLifetimeValue: totalSpent,
      averageLifetimeValue: activeCustomers.length > 0 ? totalSpent / activeCustomers.length : 0,
      topCustomers: customerLTV.slice(0, 10),
      acquisitionTrend: Object.keys(acquisitionData).map(month => ({
        month,
        customers: acquisitionData[month]
      }))
    };
  }

  /**
   * Get payment analytics from Google Sheets
   */
  static async getSheetsPaymentAnalytics(orders) {
    const paymentData = {
      methods: {},
      statuses: {},
      trends: {}
    };

    orders.forEach(order => {
      const method = order.payment?.method || 'cod';
      const status = order.payment?.status || 'pending';
      const amount = order.pricing?.total || 0;

      // Payment methods
      if (!paymentData.methods[method]) {
        paymentData.methods[method] = { count: 0, amount: 0 };
      }
      paymentData.methods[method].count += 1;
      paymentData.methods[method].amount += amount;

      // Payment statuses
      if (!paymentData.statuses[status]) {
        paymentData.statuses[status] = { count: 0, amount: 0 };
      }
      paymentData.statuses[status].count += 1;
      paymentData.statuses[status].amount += amount;

      // Monthly trends
      const orderDate = new Date(order.createdAt);
      const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
      if (!paymentData.trends[monthKey]) {
        paymentData.trends[monthKey] = { online: 0, cod: 0, total: 0 };
      }
      paymentData.trends[monthKey][method] += amount;
      paymentData.trends[monthKey].total += amount;
    });

    return {
      methodBreakdown: Object.keys(paymentData.methods).map(method => ({
        method,
        count: paymentData.methods[method].count,
        amount: paymentData.methods[method].amount,
        percentage: orders.length > 0 ? (paymentData.methods[method].count / orders.length) * 100 : 0
      })),
      statusBreakdown: Object.keys(paymentData.statuses).map(status => ({
        status,
        count: paymentData.statuses[status].count,
        amount: paymentData.statuses[status].amount,
        percentage: orders.length > 0 ? (paymentData.statuses[status].count / orders.length) * 100 : 0
      })),
      monthlyTrends: Object.keys(paymentData.trends).map(month => ({
        month,
        ...paymentData.trends[month]
      }))
    };
  }

  /**
   * Get geographic analytics from Google Sheets
   */
  static async getSheetsGeographicAnalytics(orders) {
    const geoData = {
      states: {},
      cities: {},
      pincodes: {}
    };

    orders.forEach(order => {
      if (order.shipping?.address) {
        const address = order.shipping.address;
        const amount = order.pricing?.total || 0;

        // State analysis
        if (address.state) {
          if (!geoData.states[address.state]) {
            geoData.states[address.state] = { count: 0, amount: 0 };
          }
          geoData.states[address.state].count += 1;
          geoData.states[address.state].amount += amount;
        }

        // City analysis
        if (address.city) {
          if (!geoData.cities[address.city]) {
            geoData.cities[address.city] = { count: 0, amount: 0 };
          }
          geoData.cities[address.city].count += 1;
          geoData.cities[address.city].amount += amount;
        }

        // Pincode analysis
        if (address.pincode) {
          if (!geoData.pincodes[address.pincode]) {
            geoData.pincodes[address.pincode] = { count: 0, amount: 0 };
          }
          geoData.pincodes[address.pincode].count += 1;
          geoData.pincodes[address.pincode].amount += amount;
        }
      }
    });

    return {
      topStates: Object.keys(geoData.states)
        .map(state => ({
          state,
          orders: geoData.states[state].count,
          revenue: geoData.states[state].amount
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      topCities: Object.keys(geoData.cities)
        .map(city => ({
          city,
          orders: geoData.cities[city].count,
          revenue: geoData.cities[city].amount
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      topPincodes: Object.keys(geoData.pincodes)
        .map(pincode => ({
          pincode,
          orders: geoData.pincodes[pincode].count,
          revenue: geoData.pincodes[pincode].amount
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
    };
  }

  /**
   * Initialize Redis pub/sub subscriber for analytics updates
   */
  static initializePubSub() {
    if (!isRedisAvailable()) {
      console.warn('Redis not available, pub/sub functionality disabled');
      return null;
    }

    const subscriber = getRedisSubscriber();
    
    subscriber.subscribe('analytics:update');
    
    subscriber.on('message', (channel, message) => {
      if (channel === 'analytics:update') {
        try {
          const data = JSON.parse(message);
          analyticsEmitter.emit('analytics:update', data);
        } catch (error) {
          console.error('Error parsing analytics update message:', error);
        }
      }
    });

    return subscriber;
  }
}

module.exports = AnalyticsService;