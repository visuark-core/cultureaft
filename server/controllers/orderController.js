const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const mongoose = require('mongoose');

/**
 * Generate unique order ID
 */
const generateOrderId = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp.slice(-6)}${random}`;
};

/**
 * Generate unique customer ID
 */
const generateCustomerId = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `CUST-${timestamp.slice(-6)}${random}`;
};

/**
 * Place a new order
 */
const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerId,
      customerInfo,
      items,
      paymentInfo,
      totalAmount,
      taxAmount,
      finalAmount
    } = req.body;

    // Validate required fields
    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order information',
        data: null
      });
    }

    // Find or create customer
    let customer;
    if (customerId) {
      customer = await Customer.findOne({ customerId }).session(session);
    }

    if (!customer) {
      // Check if customer exists by email
      customer = await Customer.findOne({ email: customerInfo.email }).session(session);
      
      if (!customer) {
        // Create new customer
        customer = new Customer({
          customerId: generateCustomerId(),
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          registrationDate: new Date(),
          addresses: [{
            type: 'home',
            street: customerInfo.address,
            city: customerInfo.city,
            state: customerInfo.state,
            pincode: customerInfo.pincode,
            country: 'India',
            isDefault: true
          }],
          totalOrders: 0,
          totalSpent: 0,
          status: 'active'
        });
        
        await customer.save({ session });
      }
    }

    // Validate and prepare order products
    const orderProducts = [];
    let calculatedTotal = 0;

    for (const item of items) {
      // Find product to get current price and validate
      let product = await Product.findOne({ 
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(item.id) ? item.id : null },
          { sku: item.id }
        ]
      }).session(session);

      if (!product) {
        // If product doesn't exist in database, create it from the item data
        // This handles cases where products are added to cart but not yet in the Product collection
        product = new Product({
          name: item.name,
          category: item.category || 'Uncategorized',
          price: item.price,
          sku: item.id.startsWith('SKU-') ? item.id : `SKU-${item.id}`,
          description: `Product: ${item.name}`,
          stock: 100, // Default stock
          image: item.image || ''
        });
        
        await product.save({ session });
      }

      const orderProduct = {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: item.price, // Use the price from cart (might have discounts)
        category: product.category
      };

      orderProducts.push(orderProduct);
      calculatedTotal += item.price * item.quantity;
    }

    // Create the order
    const order = new Order({
      orderId: generateOrderId(),
      customerId: customer._id,
      products: orderProducts,
      totalAmount: totalAmount || calculatedTotal,
      status: 'pending',
      orderDate: new Date(),
      shippingAddress: {
        street: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        pincode: customerInfo.pincode,
        country: 'India'
      },
      paymentMethod: paymentInfo.method || 'credit_card',
      paymentStatus: 'pending'
    });

    await order.save({ session });

    // Update customer statistics
    customer.totalOrders += 1;
    customer.totalSpent += order.totalAmount;
    customer.lastOrderDate = new Date();
    await customer.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    // Calculate estimated delivery (7-10 business days)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    res.status(201).json({
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status,
        estimatedDelivery: estimatedDelivery.toISOString().split('T')[0],
        totalAmount: order.totalAmount,
        customerName: `${customer.firstName} ${customer.lastName}`
      },
      message: 'Order placed successfully'
    });

  } catch (error) {
    // Rollback the transaction
    await session.abortTransaction();
    console.error('Error placing order:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to place order. Please try again.',
      data: null
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get order by ID
 */
const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId })
      .populate('customerId', 'firstName lastName email phone')
      .populate('products.productId', 'name image description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      data: null
    });
  }
};

/**
 * Get user's orders
 */
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.query;

    let query = {};
    
    if (userId) {
      query.customerId = userId;
    } else if (email) {
      // Find customer by email first
      const customer = await Customer.findOne({ email });
      if (!customer) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No orders found for this email'
        });
      }
      query.customerId = customer._id;
    } else {
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required',
        data: null
      });
    }

    const orders = await Order.find(query)
      .populate('customerId', 'firstName lastName email')
      .sort({ orderDate: -1 })
      .limit(50); // Limit to last 50 orders

    res.status(200).json({
      success: true,
      data: orders,
      message: 'Orders retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      data: null
    });
  }
};

/**
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
        data: null
      });
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      data: null
    });
  }
};

/**
 * Cancel order
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        data: null
      });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'completed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
        data: null
      });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.updatedAt = new Date();
    
    await order.save();

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      data: null
    });
  }
};

/**
 * Get all orders with advanced filtering and analytics (admin)
 */
const getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      paymentStatus,
      paymentMethod,
      startDate, 
      endDate,
      search,
      minAmount,
      maxAmount,
      customerId,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;
    
    let query = {};
    
    // Status filters
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      query.finalAmount = {};
      if (minAmount) query.finalAmount.$gte = parseFloat(minAmount);
      if (maxAmount) query.finalAmount.$lte = parseFloat(maxAmount);
    }
    
    // Customer filter
    if (customerId) {
      query.customerId = customerId;
    }
    
    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { orderId: searchRegex },
        { 'customerInfo.firstName': searchRegex },
        { 'customerInfo.lastName': searchRegex },
        { 'customerInfo.email': searchRegex },
        { 'customerInfo.phone': searchRegex },
        { transactionId: searchRegex },
        { razorpayOrderId: searchRegex }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(query)
      .populate('customerId', 'firstName lastName email phone totalOrders totalSpent status')
      .populate('products.productId', 'name image category')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Get order analytics
    const analytics = await getOrderAnalytics(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        analytics,
        filters: {
          status,
          paymentStatus,
          paymentMethod,
          startDate,
          endDate,
          search,
          minAmount,
          maxAmount,
          customerId
        }
      },
      message: 'Orders retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      data: null
    });
  }
};

/**
 * Get order analytics and insights
 */
const getOrderAnalytics = async (query = {}) => {
  try {
    // Basic stats
    const totalOrders = await Order.countDocuments(query);
    const totalRevenue = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    // Status breakdown
    const statusBreakdown = await Order.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } }
    ]);

    // Payment status breakdown
    const paymentBreakdown = await Order.aggregate([
      { $match: query },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } }
    ]);

    // Payment method breakdown
    const paymentMethodBreakdown = await Order.aggregate([
      { $match: query },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } }
    ]);

    // Average order value
    const avgOrderValue = totalRevenue[0]?.total ? totalRevenue[0].total / totalOrders : 0;

    // Daily revenue trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyTrend = await Order.aggregate([
      { 
        $match: { 
          ...query,
          orderDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top customers by order value
    const topCustomers = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$customerId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$finalAmount' },
          customerInfo: { $first: '$customerInfo' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    // Flagged orders (suspicious patterns)
    const flaggedOrders = await Order.find({
      ...query,
      $or: [
        { finalAmount: { $gt: 50000 } }, // High value orders
        { paymentStatus: 'failed' },
        { status: 'cancelled' }
      ]
    }).countDocuments();

    return {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      avgOrderValue: Math.round(avgOrderValue),
      statusBreakdown,
      paymentBreakdown,
      paymentMethodBreakdown,
      dailyTrend,
      topCustomers,
      flaggedOrders
    };

  } catch (error) {
    console.error('Error getting order analytics:', error);
    return {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      statusBreakdown: [],
      paymentBreakdown: [],
      paymentMethodBreakdown: [],
      dailyTrend: [],
      topCustomers: [],
      flaggedOrders: 0
    };
  }
};

/**
 * Process refund for an order (admin)
 */
const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason, refundType = 'full' } = req.body;
    const adminId = req.admin?._id;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        data: null
      });
    }

    // Validate refund conditions
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund unpaid order',
        data: null
      });
    }

    const refundAmount = refundType === 'full' ? order.finalAmount : amount;
    
    if (refundAmount > order.finalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed order amount',
        data: null
      });
    }

    // Update order status
    order.paymentStatus = 'refunded';
    order.status = 'cancelled';
    order.refundInfo = {
      amount: refundAmount,
      reason,
      refundType,
      processedBy: adminId,
      processedAt: new Date()
    };

    await order.save();

    // Log the refund action
    if (adminId) {
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        adminId,
        action: 'PROCESS_REFUND',
        resource: 'order',
        resourceId: order._id,
        changes: {
          orderId,
          refundAmount,
          reason,
          refundType
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'medium'
      });
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Refund processed successfully'
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      data: null
    });
  }
};

/**
 * Flag order for review (admin)
 */
const flagOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { flagType, reason, severity = 'medium' } = req.body;
    const adminId = req.admin?._id;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        data: null
      });
    }

    // Add flag to order
    if (!order.flags) {
      order.flags = [];
    }

    order.flags.push({
      type: flagType,
      reason,
      severity,
      createdBy: adminId,
      createdAt: new Date(),
      resolved: false
    });

    await order.save();

    // Log the flag action
    if (adminId) {
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        adminId,
        action: 'FLAG_ORDER',
        resource: 'order',
        resourceId: order._id,
        changes: {
          orderId,
          flagType,
          reason,
          severity
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity
      });
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order flagged successfully'
    });

  } catch (error) {
    console.error('Error flagging order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag order',
      data: null
    });
  }
};

/**
 * Get order analytics dashboard data
 */
const getOrdersDashboard = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const query = { orderDate: { $gte: startDate } };
    const analytics = await getOrderAnalytics(query);

    // Additional dashboard metrics
    const recentOrders = await Order.find()
      .populate('customerId', 'firstName lastName email')
      .sort({ orderDate: -1 })
      .limit(10);

    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const failedPayments = await Order.countDocuments({ paymentStatus: 'failed' });

    // Growth metrics (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    const periodDuration = Date.now() - startDate.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);

    const previousPeriodQuery = { 
      orderDate: { 
        $gte: previousPeriodStart, 
        $lt: startDate 
      } 
    };
    
    const previousAnalytics = await getOrderAnalytics(previousPeriodQuery);
    
    const growthMetrics = {
      ordersGrowth: calculateGrowthRate(analytics.totalOrders, previousAnalytics.totalOrders),
      revenueGrowth: calculateGrowthRate(analytics.totalRevenue, previousAnalytics.totalRevenue),
      avgOrderValueGrowth: calculateGrowthRate(analytics.avgOrderValue, previousAnalytics.avgOrderValue)
    };

    res.status(200).json({
      success: true,
      data: {
        ...analytics,
        recentOrders,
        pendingOrders,
        processingOrders,
        failedPayments,
        growthMetrics,
        period
      },
      message: 'Dashboard data retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      data: null
    });
  }
};

/**
 * Get customer insights for an order
 */
const getCustomerInsights = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId })
      .populate('customerId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        data: null
      });
    }

    const customerId = order.customerId._id;

    // Get customer's order history
    const customerOrders = await Order.find({ customerId })
      .sort({ orderDate: -1 })
      .limit(20);

    // Calculate customer metrics
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.finalAmount, 0);
    const avgOrderValue = totalSpent / totalOrders;
    
    // Customer segmentation
    let segment = 'new';
    if (totalOrders >= 10 && totalSpent >= 50000) segment = 'vip';
    else if (totalOrders >= 5 && totalSpent >= 20000) segment = 'loyal';
    else if (totalOrders >= 2) segment = 'returning';

    // Risk assessment
    const failedOrders = customerOrders.filter(o => o.paymentStatus === 'failed').length;
    const cancelledOrders = customerOrders.filter(o => o.status === 'cancelled').length;
    const riskScore = (failedOrders + cancelledOrders) / totalOrders * 100;

    let riskLevel = 'low';
    if (riskScore > 30) riskLevel = 'high';
    else if (riskScore > 15) riskLevel = 'medium';

    // Recent activity
    const lastOrderDate = customerOrders[0]?.orderDate;
    const daysSinceLastOrder = lastOrderDate ? 
      Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

    const insights = {
      customer: order.customerId,
      orderHistory: customerOrders,
      metrics: {
        totalOrders,
        totalSpent,
        avgOrderValue: Math.round(avgOrderValue),
        segment,
        riskLevel,
        riskScore: Math.round(riskScore),
        daysSinceLastOrder
      },
      recommendations: generateCustomerRecommendations(segment, riskLevel, daysSinceLastOrder)
    };

    res.status(200).json({
      success: true,
      data: insights,
      message: 'Customer insights retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching customer insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer insights',
      data: null
    });
  }
};

/**
 * Bulk update order status (admin)
 */
const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status, reason } = req.body;
    const adminId = req.admin?._id;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
        data: null
      });
    }

    const results = {
      successful: [],
      failed: [],
      totalProcessed: 0
    };

    for (const orderId of orderIds) {
      try {
        const order = await Order.findOne({ orderId });
        if (!order) {
          results.failed.push({ orderId, error: 'Order not found' });
          continue;
        }

        const oldStatus = order.status;
        order.status = status;
        order.statusUpdateReason = reason;
        order.statusUpdatedBy = adminId;
        order.statusUpdatedAt = new Date();

        await order.save();
        results.successful.push({ orderId, oldStatus, newStatus: status });

        // Log the update
        if (adminId) {
          const AuditLog = require('../models/AuditLog');
          await AuditLog.create({
            adminId,
            action: 'BULK_UPDATE_ORDER_STATUS',
            resource: 'order',
            resourceId: order._id,
            changes: { orderId, oldStatus, newStatus: status, reason },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            severity: 'medium'
          });
        }

      } catch (error) {
        results.failed.push({ orderId, error: error.message });
      }
      
      results.totalProcessed++;
    }

    const statusCode = results.failed.length > 0 ? 207 : 200;

    res.status(statusCode).json({
      success: results.failed.length === 0,
      message: `Bulk update completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      data: results
    });

  } catch (error) {
    console.error('Error bulk updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update order status',
      data: null
    });
  }
};

// Helper functions
const calculateGrowthRate = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const generateCustomerRecommendations = (segment, riskLevel, daysSinceLastOrder) => {
  const recommendations = [];

  if (segment === 'new') {
    recommendations.push('Send welcome series to encourage repeat purchase');
  } else if (segment === 'vip') {
    recommendations.push('Offer exclusive VIP benefits and early access');
  }

  if (riskLevel === 'high') {
    recommendations.push('Review account for potential fraud or issues');
  }

  if (daysSinceLastOrder > 90) {
    recommendations.push('Send re-engagement campaign to win back customer');
  } else if (daysSinceLastOrder > 30) {
    recommendations.push('Send targeted offers to encourage next purchase');
  }

  return recommendations;
};

module.exports = {
  placeOrder,
  getOrder,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  getOrderAnalytics,
  processRefund,
  flagOrder,
  getOrdersDashboard,
  getCustomerInsights,
  bulkUpdateOrderStatus
};