const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

class AnalyticsService {
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
}

module.exports = AnalyticsService;