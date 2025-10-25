/**
 * Order utility functions
 */

/**
 * Generate a unique order number
 * @returns {string} Unique order number
 */
const generateUniqueOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD${timestamp}${random}`;
};

/**
 * Generate a unique order ID
 * @returns {string} Unique order ID
 */
const generateUniqueOrderId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${timestamp}_${random}`;
};

/**
 * Calculate order total with taxes and discounts
 * @param {Array} items - Order items
 * @param {Object} options - Calculation options
 * @returns {Object} Pricing breakdown
 */
const calculateOrderTotal = (items, options = {}) => {
  const {
    shippingCharges = 0,
    codCharges = 0,
    taxRate = 0.18, // 18% GST
    discountAmount = 0,
    discountPercentage = 0
  } = options;

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  let discount = discountAmount;
  if (discountPercentage > 0) {
    discount = Math.max(discount, (subtotal * discountPercentage) / 100);
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxes = discountedSubtotal * taxRate;
  const total = discountedSubtotal + taxes + shippingCharges + codCharges;

  return {
    subtotal,
    discount,
    taxes,
    shippingCharges,
    codCharges,
    total: Math.round(total * 100) / 100 // Round to 2 decimal places
  };
};

/**
 * Validate order data
 * @param {Object} orderData - Order data to validate
 * @returns {Object} Validation result
 */
const validateOrderData = (orderData) => {
  const errors = [];

  if (!orderData.customer || !orderData.customer.customerId) {
    errors.push('Customer information is required');
  }

  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Order must contain at least one item');
  }

  if (orderData.items) {
    orderData.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
      if (!item.price || item.price <= 0) {
        errors.push(`Item ${index + 1}: Valid price is required`);
      }
    });
  }

  if (!orderData.shipping || !orderData.shipping.address) {
    errors.push('Shipping address is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format order for display
 * @param {Object} order - Order object
 * @returns {Object} Formatted order
 */
const formatOrderForDisplay = (order) => {
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    orderId: order.orderId,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone
    },
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal
    })),
    pricing: order.pricing,
    status: order.status,
    paymentStatus: order.payment.status,
    paymentMethod: order.payment.method,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
};

/**
 * Get order status display information
 * @param {string} status - Order status
 * @returns {Object} Status display info
 */
const getOrderStatusInfo = (status) => {
  const statusMap = {
    pending: { label: 'Pending', color: 'orange', description: 'Order is being processed' },
    confirmed: { label: 'Confirmed', color: 'blue', description: 'Order has been confirmed' },
    processing: { label: 'Processing', color: 'purple', description: 'Order is being prepared' },
    shipped: { label: 'Shipped', color: 'indigo', description: 'Order has been shipped' },
    out_for_delivery: { label: 'Out for Delivery', color: 'yellow', description: 'Order is out for delivery' },
    delivered: { label: 'Delivered', color: 'green', description: 'Order has been delivered' },
    cancelled: { label: 'Cancelled', color: 'red', description: 'Order has been cancelled' },
    returned: { label: 'Returned', color: 'gray', description: 'Order has been returned' },
    completed: { label: 'Completed', color: 'green', description: 'Order is completed' }
  };

  return statusMap[status] || { label: status, color: 'gray', description: 'Unknown status' };
};

module.exports = {
  generateUniqueOrderNumber,
  generateUniqueOrderId,
  calculateOrderTotal,
  validateOrderData,
  formatOrderForDisplay,
  getOrderStatusInfo
};