const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const InventoryService = require('../services/inventoryService');
const dataService = require('../services/dataService');
const orderService = require('../services/orderService');

const COD_CHARGE_PERCENTAGE = 0.02; // 2% COD charge

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
 * Check inventory availability for items
 */
const checkInventoryAvailability = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required',
      });
    }

    const availabilityResults = [];
    const unavailableItems = [];

    for (const item of items) {
      try {
        const availability = await InventoryService.verifyAvailability(item.productId, item.quantity);
        
        availabilityResults.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          available: availability.available,
          currentStock: availability.currentStock,
          message: availability.message
        });

        if (!availability.available) {
          unavailableItems.push({
            productId: item.productId,
            requestedQuantity: item.quantity,
            availableQuantity: availability.currentStock,
            message: availability.message
          });
        }
      } catch (error) {
        const errorResponse = InventoryService.handleInventoryError(error, { productId: item.productId });
        unavailableItems.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableQuantity: 0,
          message: errorResponse.userMessage
        });
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${unavailableItems.length} item(s) are not available in the requested quantities`,
        unavailableItems,
        availabilityResults
      });
    }

    res.status(200).json({
      success: true,
      message: 'All items are available',
      availabilityResults
    });

  } catch (error) {
    console.error('Error checking inventory availability:', error);
    const errorResponse = InventoryService.handleInventoryError(error);
    res.status(500).json({
      success: false,
      message: errorResponse.userMessage,
      error: errorResponse.errorCode
    });
  }
};

/**
 * Place a new order with enhanced features
 */
const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let sessionId;

  try {
    const {
      customerId,
      customerInfo,
      items: rawItems,
      paymentInfo,
      pricing,
      shipping,
      totalAmount,
      taxAmount,
      finalAmount
    } = req.body;

    // Normalize items - handle both array and object formats
    let items;
    if (Array.isArray(rawItems)) {
      items = rawItems;
    } else if (rawItems && typeof rawItems === 'object') {
      // Convert object with numeric keys to array
      items = Object.values(rawItems);
    } else {
      items = [];
    }

    // Validate required fields
    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order information',
        data: null
      });
    }

    // Find or create customer using data service
    let customer;
    if (customerId) {
      customer = await dataService.findCustomerById(customerId);
    }

    if (!customer) {
      // Check if customer exists by email
      const existingCustomers = await dataService.findAllCustomers();
      customer = existingCustomers.find(c => c.email === customerInfo.email);
      
      if (!customer) {
        // Create new customer
        const customerData = {
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
        };
        
        customer = await dataService.createCustomer(customerData);
        // Ensure we have the customerId for later use
        if (!customer.customerId && customerData.customerId) {
          customer.customerId = customerData.customerId;
        }
      }
    }

    // Validate and prepare order products with inventory management
    const orderProducts = [];
    const orderItems = [];
    let calculatedTotal = 0;
    sessionId = new mongoose.Types.ObjectId().toString();
    
    // Prepare items for inventory service (ensure productId field)
    const itemsForInventory = items.map(item => ({
      ...item,
      productId: item.productId || item.id
    }));
    
    // Reserve items using enhanced InventoryService
    const reservationResult = await InventoryService.reserveItems(itemsForInventory, sessionId);

    if (!reservationResult.success) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: reservationResult.message,
        unavailableItems: reservationResult.unavailableItems,
        errorCode: 'INVENTORY_RESERVATION_FAILED'
      });
    }

    for (const item of items) {
      // Find product to get current price and validate
      let product = await Product.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(item.id) ? item.id : null },
          { sku: item.id }
        ]
      }).session(session);

      if (!product) {
        // If product doesn't exist in database, create or update it from the item data
        const sku = item.id.startsWith('SKU-') ? item.id : `SKU-${item.id}`;
        
        try {
          product = await Product.findOneAndUpdate(
            { sku: sku },
            {
              name: item.name,
              category: item.category || 'Uncategorized',
              price: item.price,
              sku: sku,
              description: `Product: ${item.name}`,
              stock: 1000, // Higher default stock for COD system
              image: item.image || '',
              status: 'active'
            },
            { 
              upsert: true, 
              new: true, 
              session,
              setDefaultsOnInsert: true 
            }
          );
        } catch (duplicateError) {
          // If there's still a duplicate error, try to find the existing product
          product = await Product.findOne({ sku: sku }).session(session);
          if (!product) {
            throw duplicateError; // Re-throw if we still can't find it
          }
        }
      }

      // Prepare order product (backward compatibility)
      const orderProduct = {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: item.price, // Use the price from cart (might have discounts)
        category: product.category
      };

      // Prepare order item (new enhanced format)
      const orderItem = {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: item.price,
        category: product.category,
        variant: {},
        subtotal: item.price * item.quantity,
        discount: 0,
        tax: Math.round(item.price * item.quantity * 0.18)
      };

      orderProducts.push(orderProduct);
      orderItems.push(orderItem);
      calculatedTotal += item.price * item.quantity;
    }

    // Calculate pricing breakdown
    const subtotal = pricing?.subtotal || calculatedTotal;
    const shippingCharges = shipping?.shippingCost || 0;
    let codCharges = 0;
    if (paymentInfo.method === 'cod') {
      codCharges = Math.round(subtotal * COD_CHARGE_PERCENTAGE);
    }
    const taxes = pricing?.taxAmount || Math.round((subtotal + shippingCharges + codCharges) * 0.18);
    const total = pricing?.finalAmount || finalAmount || (subtotal + shippingCharges + codCharges + taxes);

    // Create the order using data service (Google Sheets)
    const orderId = generateOrderId();
    const orderData = {
      orderId: orderId,
      customerId: customer._id,
      
      // Backward compatibility fields
      products: orderProducts,
      totalAmount: totalAmount || total,
      finalAmount: total,
      taxAmount: taxes,
      paymentMethod: paymentInfo.method === 'cod' ? 'cash_on_delivery' : paymentInfo.method,
      paymentStatus: paymentInfo.method === 'cod' ? 'pending' : 'pending',
      
      // Enhanced fields
      customer: {
        customerId: customer._id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone
      },
      items: orderItems,
      pricing: {
        subtotal: subtotal,
        shippingCharges: shippingCharges,
        codCharges: codCharges,
        taxes: taxes,
        discount: 0,
        total: total
      },
      payment: {
        method: 'cod',
        status: 'pending',
        transactionId: paymentInfo.transactionId,
        paidAmount: 0,
        paidAt: paymentInfo.method === 'cod' ? null : (paymentInfo.transactionId !== 'pending' ? new Date() : null)
      },
      shipping: {
        address: {
          street: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          pincode: customerInfo.pincode,
          country: 'India'
        },
        method: shipping?.method || 'standard',
        estimatedDelivery: shipping?.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        shippingCost: shippingCharges
      },
      status: paymentInfo.method === 'cod' ? 'confirmed' : 'pending',
      timeline: [{
        status: paymentInfo.method === 'cod' ? 'confirmed' : 'pending',
        timestamp: new Date(),
        notes: paymentInfo.method === 'cod' ? 'Order confirmed - Cash on Delivery' : 'Order placed - Awaiting payment confirmation',
        automated: true
      }],
      inventory: {
        reserved: true,
        reservedAt: new Date(),
        reservationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    };

    // Save order to Google Sheets
    const order = await dataService.createOrder(orderData);

    // Update customer statistics using data service
    const customerIdForUpdate = customer.customerId || customer.id || customer._id;
    if (customerIdForUpdate) {
      try {
        await dataService.updateCustomerStats(customerIdForUpdate, orderData.totalAmount);
      } catch (statsError) {
        console.log('Warning: Could not update customer stats:', statsError.message);
        // Don't fail the order if stats update fails
      }
    }

    // Commit the transaction
    await session.commitTransaction();

    // Calculate estimated delivery (7-10 business days)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    res.status(201).json({
      success: true,
      data: {
        orderId: orderData.orderId,
        status: orderData.status,
        estimatedDelivery: estimatedDelivery.toISOString().split('T')[0],
        totalAmount: orderData.totalAmount,
        customerName: `${customer.firstName} ${customer.lastName}`,
        pricing: orderData.pricing
      },
      message: 'Order placed successfully'
    });

  } catch (error) {
    // Rollback the transaction
    await session.abortTransaction();
    console.error('Error placing order:', error);
    
    // Release the reservation if the order fails
    if (sessionId) {
      const releaseResult = await InventoryService.releaseReservation(sessionId);
      console.log('Reservation release result:', releaseResult.message);
    }

    const errorResponse = InventoryService.handleInventoryError(error, { sessionId });
    res.status(500).json({
      success: false,
      message: errorResponse.userMessage,
      errorCode: errorResponse.errorCode,
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
    const { id } = req.params; // Changed from orderId to id to match route parameter
    
    const order = await Order.findById(id) // Using findById
      .populate('customer.customerId', 'firstName lastName email phone addresses')
      .populate('items.productId', 'name image sku description price');

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
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await orderService.updateOrderStatus(id, status, req.admin.id, notes);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update order status',
      data: null
    });
  }
};

/**
 * Cancel order
 */
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await orderService.cancelOrder(id, req.admin.id, reason);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('Cannot cancel')) statusCode = 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to cancel order',
      data: null
    });
  }
};

/**
 * Get all orders (admin)
 */
const getAllOrders = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      paymentMethod: req.query.paymentMethod,
      orderDateFrom: req.query.orderDateFrom,
      orderDateTo: req.query.orderDateTo,
      minAmount: req.query.minAmount,
      maxAmount: req.query.maxAmount,
      customerId: req.query.customerId,
      category: req.query.category,
      city: req.query.city,
      state: req.query.state
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      search: req.query.search || ''
    };

    const result = await orderService.getOrders(filters, options);

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders',
      data: null
    });
  }
};



/**
 * Assign a delivery agent to an order.
 */
const assignDeliveryAgentToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId, estimatedDelivery } = req.body;

    const order = await orderService.assignDeliveryAgent(id, agentId, estimatedDelivery, req.admin.id);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Delivery agent assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning delivery agent:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to assign delivery agent',
      data: null
    });
  }
};

/**
 * Record a delivery attempt for an order.
 */
const recordDeliveryAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, notes, nextAttemptDate } = req.body;

    const order = await orderService.recordDeliveryAttempt(id, { status, reason, notes, nextAttemptDate }, req.admin.id);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Delivery attempt recorded successfully'
    });

  } catch (error) {
    console.error('Error recording delivery attempt:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to record delivery attempt',
      data: null
    });
  }
};

/**
 * Upload delivery proof for an order.
 */
const uploadDeliveryProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, data, location, verifiedBy } = req.body;

    const order = await orderService.uploadDeliveryProof(id, { type, data, location, verifiedBy }, req.admin.id);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Delivery proof uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading delivery proof:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to upload delivery proof',
      data: null
    });
  }
};

/**
 * Release inventory reservation for abandoned checkout
 */
const releaseInventoryReservation = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const releaseResult = await InventoryService.releaseReservation(sessionId);

    res.status(200).json({
      success: releaseResult.success,
      message: releaseResult.message
    });

  } catch (error) {
    console.error('Error releasing inventory reservation:', error);
    const errorResponse = InventoryService.handleInventoryError(error, { sessionId });
    res.status(500).json({
      success: false,
      message: errorResponse.userMessage,
      errorCode: errorResponse.errorCode
    });
  }
};

/**
 * Get inventory reservation details
 */
const getInventoryReservation = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const reservation = InventoryService.getReservation(sessionId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'No active reservation found for this session'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        items: reservation.items,
        reservedAt: reservation.reservedAt,
        expiresAt: reservation.expiresAt,
        timeRemaining: reservation.timeRemaining
      },
      message: 'Reservation details retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting inventory reservation:', error);
    const errorResponse = InventoryService.handleInventoryError(error, { sessionId });
    res.status(500).json({
      success: false,
      message: errorResponse.userMessage,
      errorCode: errorResponse.errorCode
    });
  }
};

/**
 * Get inventory statistics (admin only)
 */
const getInventoryStats = async (req, res) => {
  try {
    const stats = InventoryService.getInventoryStats();

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Inventory statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting inventory stats:', error);
    const errorResponse = InventoryService.handleInventoryError(error);
    res.status(500).json({
      success: false,
      message: errorResponse.userMessage,
      errorCode: errorResponse.errorCode
    });
  }
};

/**
 * Cleanup expired reservations (admin only)
 */
const cleanupExpiredReservations = async (req, res) => {
  try {
    InventoryService.cleanupExpiredReservations();

    res.status(200).json({
      success: true,
      message: 'Expired reservations cleanup completed'
    });

  } catch (error) {
    console.error('Error cleaning up expired reservations:', error);
    const errorResponse = InventoryService.handleInventoryError(error);
    res.status(500).json({
      success: false,
      message: errorResponse.userMessage,
      errorCode: errorResponse.errorCode
    });
  }
};

/**
 * Generate inventory reconciliation report (admin only)
 */
const generateInventoryReport = async (req, res) => {
  try {
    const InventoryReconciliation = require('../utils/inventoryReconciliation');
    const { category, includeDiscrepancies = true } = req.query;

    const report = await InventoryReconciliation.generateInventoryReport({
      category,
      includeDiscrepancies: includeDiscrepancies === 'true'
    });

    if (!report.success) {
      return res.status(500).json({
        success: false,
        message: report.message,
        error: report.error
      });
    }

    res.status(200).json({
      success: true,
      data: report.report,
      message: 'Inventory report generated successfully'
    });

  } catch (error) {
    console.error('Error generating inventory report:', error);
    const errorResponse = InventoryService.handleInventoryError(error);
    res.status(500).json({
      success: false,
      message: errorResponse.userMessage,
      errorCode: errorResponse.errorCode
    });
  }
};

/**
 * Cleanup abandoned orders (admin only)
 */
const cleanupAbandonedOrders = async (req, res) => {
  try {
    const InventoryReconciliation = require('../utils/inventoryReconciliation');
    const { hoursOld = 24 } = req.query;

    const result = await InventoryReconciliation.cleanupAbandonedOrders(parseInt(hoursOld));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      message: `Cleaned up ${result.cleanedOrders} abandoned orders`
    });

  } catch (error) {
    console.error('Error cleaning up abandoned orders:', error);
    const errorResponse = InventoryService.handleInventoryError(error);
    res.status(500).json({
      success: false,
      message: errorResponse.userMessage,
      errorCode: errorResponse.errorCode
    });
  }
};

module.exports = {
  placeOrder,
  checkInventoryAvailability,
  getOrder,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,

  // Delivery Management
  assignDeliveryAgentToOrder,
  recordDeliveryAttempt,
  uploadDeliveryProof,
  // Inventory Management
  releaseInventoryReservation,
  getInventoryReservation,
  getInventoryStats,
  cleanupExpiredReservations,
  generateInventoryReport,
  cleanupAbandonedOrders
};