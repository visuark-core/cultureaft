const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

class FinancialReportingService {
  constructor() {
    this.reportTypes = {
      DAILY_SALES: 'daily_sales',
      MONTHLY_REVENUE: 'monthly_revenue',
      PAYMENT_METHODS: 'payment_methods',
      CUSTOMER_ANALYTICS: 'customer_analytics',
      PRODUCT_PERFORMANCE: 'product_performance',
      PAYMENT_RECONCILIATION: 'payment_reconciliation',
      REFUND_ANALYSIS: 'refund_analysis',
      COD_PERFORMANCE: 'cod_performance',
      PAYMENT_FAILURE_ANALYSIS: 'payment_failure_analysis'
    };
  }
  /**
   * Generates a comprehensive financial report for a given period.
   * @param {Date} startDate - Start date for the report.
   * @param {Date} endDate - End date for the report.
   * @returns {Promise<Object>} Financial report data.
   */
  async generateFinancialReport(startDate, endDate) {
    try {
      // Fetch order statistics
      const orderStats = await Order.getOrderStats(startDate, endDate);

      // Fetch payment statistics
      const paymentStats = await Order.getPaymentStats(startDate, endDate);

      // Fetch revenue metrics
      const revenueMetrics = await Order.getRevenueMetrics(startDate, endDate);

      // Fetch customer metrics
      const customerMetrics = await Order.getCustomerMetrics(startDate, endDate);

      // Aggregate total revenue and expenses (placeholder for now)
      const totalRevenue = revenueMetrics.reduce((sum, metric) => sum + metric.totalRevenue, 0);
      const totalOrders = revenueMetrics.reduce((sum, metric) => sum + metric.orderCount, 0);

      // You can add more complex calculations here for expenses, profit, etc.

      return {
        success: true,
        data: {
          summary: {
            totalRevenue,
            totalOrders,
            // Add more summary metrics as needed
          },
          orderStats,
          paymentStats,
          revenueMetrics,
          customerMetrics,
        },
        message: 'Financial report generated successfully',
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      return {
        success: false,
        message: 'Failed to generate financial report',
        error: error.message || error,
      };
    }
  }

  /**
   * Performs payment reconciliation by comparing payment records with order records.
   * This is a simplified example and can be expanded for more robust reconciliation.
   * @param {Date} startDate - Start date for reconciliation.
   * @param {Date} endDate - End date for reconciliation.
   * @returns {Promise<Object>} Reconciliation report.
   */
  async reconcilePayments(startDate, endDate) {
    try {
      const payments = await Payment.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'paid'
      }).populate('orderId');

      const reconciliationIssues = [];
      let reconciledCount = 0;
      let unreconciledCount = 0;

      for (const payment of payments) {
        const order = payment.orderId;

        if (!order) {
          reconciliationIssues.push({
            type: 'ORPHAN_PAYMENT',
            paymentId: payment._id,
            razorpayOrderId: payment.razorpayOrderId,
            amount: payment.amount,
            message: 'Payment record exists but no corresponding order found.'
          });
          unreconciledCount++;
          continue;
        }

        // Check if order payment status matches
        if (order.payment.status !== 'completed' && order.payment.status !== 'refunded') {
          reconciliationIssues.push({
            type: 'STATUS_MISMATCH',
            paymentId: payment._id,
            orderId: order._id,
            razorpayOrderId: payment.razorpayOrderId,
            paymentStatus: payment.status,
            orderPaymentStatus: order.payment.status,
            message: `Payment status '${payment.status}' does not match order payment status '${order.payment.status}'.`
          });
          unreconciledCount++;
        }

        // Check if amounts match
        if (payment.amount !== Math.round(order.pricing.total * 100)) {
          reconciliationIssues.push({
            type: 'AMOUNT_MISMATCH',
            paymentId: payment._id,
            orderId: order._id,
            razorpayOrderId: payment.razorpayOrderId,
            paymentAmount: payment.amount,
            orderAmount: order.pricing.total,
            message: `Payment amount '${payment.amount}' does not match order total '${order.pricing.total}'.`
          });
          unreconciledCount++;
        }
        
        if (reconciliationIssues.length === 0) {
          reconciledCount++;
        }
      }

      return {
        success: true,
        data: {
          totalPayments: payments.length,
          reconciledCount,
          unreconciledCount,
          reconciliationIssues
        },
        message: 'Payment reconciliation completed'
      };

    } catch (error) {
      console.error('Error reconciling payments:', error);
      return {
        success: false,
        message: 'Failed to reconcile payments',
        error: error.message || error
      };
    }
  }

  /**
   * Generates comprehensive payment analytics report
   * @param {Date} startDate - Start date for the report
   * @param {Date} endDate - End date for the report
   * @returns {Promise<Object>} Payment analytics report
   */
  async generatePaymentAnalyticsReport(startDate, endDate) {
    try {
      const [
        paymentMethodStats,
        refundAnalysis,
        codPerformance,
        failureAnalysis,
        revenueBreakdown
      ] = await Promise.all([
        this.getPaymentMethodStatistics(startDate, endDate),
        this.getRefundAnalysis(startDate, endDate),
        this.getCODPerformanceMetrics(startDate, endDate),
        this.getPaymentFailureAnalysis(startDate, endDate),
        this.getRevenueBreakdown(startDate, endDate)
      ]);

      return {
        success: true,
        data: {
          period: { startDate, endDate },
          paymentMethodStats,
          refundAnalysis,
          codPerformance,
          failureAnalysis,
          revenueBreakdown,
          generatedAt: new Date()
        },
        message: 'Payment analytics report generated successfully'
      };

    } catch (error) {
      console.error('Error generating payment analytics report:', error);
      return {
        success: false,
        message: 'Failed to generate payment analytics report',
        error: error.message || error
      };
    }
  }

  /**
   * Gets payment method statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Payment method statistics
   */
  async getPaymentMethodStatistics(startDate, endDate) {
    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            method: '$payment.method',
            status: '$payment.status'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.total' },
          averageAmount: { $avg: '$pricing.total' }
        }
      },
      {
        $group: {
          _id: '$_id.method',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
              totalAmount: '$totalAmount',
              averageAmount: '$averageAmount'
            }
          },
          totalTransactions: { $sum: '$count' },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    return stats.reduce((acc, method) => {
      acc[method._id || 'unknown'] = {
        totalTransactions: method.totalTransactions,
        totalRevenue: method.totalRevenue,
        averageTransactionValue: method.totalRevenue / method.totalTransactions,
        statusBreakdown: method.statuses.reduce((statusAcc, status) => {
          statusAcc[status.status] = {
            count: status.count,
            totalAmount: status.totalAmount,
            averageAmount: status.averageAmount
          };
          return statusAcc;
        }, {})
      };
      return acc;
    }, {});
  }

  /**
   * Gets refund analysis
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Refund analysis
   */
  async getRefundAnalysis(startDate, endDate) {
    const refundStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          'payment.refunds.0': { $exists: true }
        }
      },
      {
        $unwind: '$payment.refunds'
      },
      {
        $group: {
          _id: {
            method: '$payment.method',
            status: '$payment.refunds.status'
          },
          count: { $sum: 1 },
          totalRefunded: { $sum: '$payment.refunds.amount' },
          averageRefund: { $avg: '$payment.refunds.amount' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalRefunds = refundStats.reduce((sum, stat) => sum + stat.count, 0);
    const totalRefundAmount = refundStats.reduce((sum, stat) => sum + stat.totalRefunded, 0);

    return {
      totalRefunds,
      totalRefundAmount,
      refundRate: totalOrders > 0 ? (totalRefunds / totalOrders) * 100 : 0,
      averageRefundAmount: totalRefunds > 0 ? totalRefundAmount / totalRefunds : 0,
      refundsByMethod: refundStats.reduce((acc, stat) => {
        const method = stat._id.method || 'unknown';
        if (!acc[method]) acc[method] = {};
        acc[method][stat._id.status] = {
          count: stat.count,
          totalAmount: stat.totalRefunded,
          averageAmount: stat.averageRefund
        };
        return acc;
      }, {})
    };
  }

  /**
   * Gets COD performance metrics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} COD performance metrics
   */
  async getCODPerformanceMetrics(startDate, endDate) {
    const codStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          'payment.method': 'cod'
        }
      },
      {
        $group: {
          _id: '$payment.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.total' },
          averageAmount: { $avg: '$pricing.total' },
          codCharges: { $sum: '$pricing.codCharges' }
        }
      }
    ]);

    const totalCODOrders = codStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedCOD = codStats.find(stat => stat._id === 'completed');
    const failedCOD = codStats.find(stat => stat._id === 'failed');

    return {
      totalCODOrders,
      completedOrders: completedCOD?.count || 0,
      failedOrders: failedCOD?.count || 0,
      successRate: totalCODOrders > 0 ? ((completedCOD?.count || 0) / totalCODOrders) * 100 : 0,
      totalRevenue: completedCOD?.totalAmount || 0,
      totalCODCharges: codStats.reduce((sum, stat) => sum + (stat.codCharges || 0), 0),
      averageOrderValue: completedCOD?.averageAmount || 0,
      statusBreakdown: codStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount,
          averageAmount: stat.averageAmount,
          codCharges: stat.codCharges || 0
        };
        return acc;
      }, {})
    };
  }

  /**
   * Gets payment failure analysis
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Payment failure analysis
   */
  async getPaymentFailureAnalysis(startDate, endDate) {
    const failureStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          'payment.status': 'failed'
        }
      },
      {
        $group: {
          _id: {
            method: '$payment.method',
            reason: '$payment.failureReason'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.total' },
          retryCount: { $avg: '$payment.retryCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalFailures = failureStats.reduce((sum, stat) => sum + stat.count, 0);
    const totalFailedAmount = failureStats.reduce((sum, stat) => sum + stat.totalAmount, 0);

    return {
      totalFailures,
      totalFailedAmount,
      averageRetryCount: failureStats.length > 0 ? 
        failureStats.reduce((sum, stat) => sum + stat.retryCount, 0) / failureStats.length : 0,
      topFailureReasons: failureStats.slice(0, 10),
      failuresByMethod: failureStats.reduce((acc, stat) => {
        const method = stat._id.method || 'unknown';
        if (!acc[method]) acc[method] = [];
        acc[method].push({
          reason: stat._id.reason || 'Unknown',
          count: stat.count,
          totalAmount: stat.totalAmount,
          averageRetryCount: stat.retryCount
        });
        return acc;
      }, {})
    };
  }

  /**
   * Gets revenue breakdown by various dimensions
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Revenue breakdown
   */
  async getRevenueBreakdown(startDate, endDate) {
    const [dailyRevenue, methodRevenue, statusRevenue] = await Promise.all([
      // Daily revenue breakdown
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            revenue: { $sum: '$pricing.total' },
            orders: { $sum: 1 },
            averageOrderValue: { $avg: '$pricing.total' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),

      // Revenue by payment method
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: '$payment.method',
            revenue: { $sum: '$pricing.total' },
            orders: { $sum: 1 },
            averageOrderValue: { $avg: '$pricing.total' }
          }
        }
      ]),

      // Revenue by order status
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            revenue: { $sum: '$pricing.total' },
            orders: { $sum: 1 },
            averageOrderValue: { $avg: '$pricing.total' }
          }
        }
      ])
    ]);

    return {
      dailyRevenue,
      methodRevenue: methodRevenue.reduce((acc, method) => {
        acc[method._id || 'unknown'] = {
          revenue: method.revenue,
          orders: method.orders,
          averageOrderValue: method.averageOrderValue
        };
        return acc;
      }, {}),
      statusRevenue: statusRevenue.reduce((acc, status) => {
        acc[status._id] = {
          revenue: status.revenue,
          orders: status.orders,
          averageOrderValue: status.averageOrderValue
        };
        return acc;
      }, {}),
      totalRevenue: methodRevenue.reduce((sum, method) => sum + method.revenue, 0),
      totalOrders: methodRevenue.reduce((sum, method) => sum + method.orders, 0)
    };
  }

  /**
   * Generates payment settlement report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Settlement report
   */
  async generateSettlementReport(startDate, endDate) {
    try {
      const settlements = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: {
              method: '$payment.method',
              date: {
                year: { $year: '$payment.paidAt' },
                month: { $month: '$payment.paidAt' },
                day: { $dayOfMonth: '$payment.paidAt' }
              }
            },
            grossAmount: { $sum: '$pricing.total' },
            orderCount: { $sum: 1 },
            codCharges: { $sum: '$pricing.codCharges' },
            shippingCharges: { $sum: '$pricing.shippingCharges' },
            taxes: { $sum: '$pricing.taxes' }
          }
        },
        { $sort: { '_id.date.year': 1, '_id.date.month': 1, '_id.date.day': 1 } }
      ]);

      const summary = settlements.reduce((acc, settlement) => {
        const method = settlement._id.method || 'unknown';
        if (!acc[method]) {
          acc[method] = {
            totalOrders: 0,
            grossAmount: 0,
            codCharges: 0,
            shippingCharges: 0,
            taxes: 0,
            netAmount: 0
          };
        }
        
        acc[method].totalOrders += settlement.orderCount;
        acc[method].grossAmount += settlement.grossAmount;
        acc[method].codCharges += settlement.codCharges || 0;
        acc[method].shippingCharges += settlement.shippingCharges || 0;
        acc[method].taxes += settlement.taxes || 0;
        acc[method].netAmount = acc[method].grossAmount - acc[method].codCharges;
        
        return acc;
      }, {});

      return {
        success: true,
        data: {
          period: { startDate, endDate },
          settlements,
          summary,
          generatedAt: new Date()
        },
        message: 'Settlement report generated successfully'
      };

    } catch (error) {
      console.error('Error generating settlement report:', error);
      return {
        success: false,
        message: 'Failed to generate settlement report',
        error: error.message || error
      };
    }
  }
}

module.exports = new FinancialReportingService();