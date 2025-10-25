const googleSheetsService = require('../googleSheetsService');

class OrderSheetsDAO {
  constructor() {
    this.sheetName = 'Orders';
    this.headers = [
      'Order ID',
      'Customer Name', 
      'Customer Email',
      'Customer Phone',
      'Items',
      'Total Amount',
      'Payment Method',
      'Payment Status', 
      'Transaction ID',
      'Shipping Address',
      'Status',
      'Order Date',
      'Created At',
      'Updated At'
    ];
  }

  async initializeSheet() {
    try {
      await googleSheetsService.readSheet(this.sheetName, 'A1:AT1');
    } catch (error) {
      if (error.code === 400) {
        await googleSheetsService.createSheet(this.sheetName);
        await googleSheetsService.writeSheet(this.sheetName, 'A1:AT1', [this.headers]);
      } else {
        throw error;
      }
    }
  }

  async findAll() {
    try {
      await this.initializeSheet();
      const data = await googleSheetsService.readSheet(this.sheetName);
      
      if (!data || !Array.isArray(data) || data.length <= 1) {
        console.log('No order data found in Google Sheets, returning empty array');
        return [];
      }

      const orders = googleSheetsService.sheetDataToObjects(data);
      
      if (!Array.isArray(orders)) {
        console.warn('sheetDataToObjects returned non-array data:', orders);
        return [];
      }

      const parsedOrders = orders.map(order => this.parseOrderData(order));
      
      return parsedOrders;
    } catch (error) {
      console.error('Error in OrderSheetsDAO.findAll:', error);
      return [];
    }
  }

  isValidOrderData(order) {
    return order && 
           order.orderId && 
           order.customer && 
           order.customer.name && 
           order.customer.email &&
           order.items &&
           Array.isArray(order.items) &&
           order.pricing &&
           typeof order.pricing.total === 'number';
  }

  getSampleOrders() {
    return [
      {
        id: '1',
        orderId: 'ORD-001',
        customer: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+91 9876543210'
        },
        items: [
          {
            productId: '1',
            name: 'Handcrafted Wooden Chair',
            sku: 'SKU-001',
            quantity: 1,
            price: 15000,
            category: 'furniture',
            subtotal: 15000
          }
        ],
        pricing: {
          subtotal: 15000,
          taxes: 2700,
          shippingCharges: 300,
          codCharges: 0,
          discount: 0,
          total: 18000
        },
        payment: {
          method: 'cod',
          status: 'pending',
          transactionId: null
        },
        shipping: {
          address: {
            street: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India'
          },
          method: 'standard'
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        delivery: {}
      },
      {
        id: '2',
        orderId: 'ORD-002',
        customer: {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+91 9876543211'
        },
        items: [
          {
            productId: '2',
            name: 'Handwoven Carpet',
            sku: 'SKU-002',
            quantity: 1,
            price: 25000,
            category: 'home-decor',
            subtotal: 25000
          }
        ],
        pricing: {
          subtotal: 25000,
          taxes: 4500,
          shippingCharges: 500,
          codCharges: 0,
          discount: 1000,
          total: 29000
        },
        payment: {
          method: 'cod',
          status: 'completed',
          transactionId: 'TXN-002'
        },
        shipping: {
          address: {
            street: '456 Park Avenue',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            country: 'India'
          },
          method: 'express'
        },
        status: 'delivered',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date().toISOString(),
        delivery: {}
      }
    ];
  }

  async findById(id) {
    const orders = await this.findAll();
    return orders.find(order => order.id === id);
  }

  async findByOrderNumber(orderNumber) {
    const orders = await this.findAll();
    return orders.find(order => order.orderNumber === orderNumber);
  }

  async findByCustomerId(customerId) {
    const orders = await this.findAll();
    return orders.filter(order => order.customerId === customerId);
  }

  async findByStatus(status) {
    const orders = await this.findAll();
    return orders.filter(order => order.status === status);
  }

  async findByRazorpayOrderId(razorpayOrderId) {
    const orders = await this.findAll();
    return orders.find(order =>
      order.razorpayOrderId === razorpayOrderId ||
      order.payment?.razorpayOrderId === razorpayOrderId
    );
  }

  async create(orderData) {
    await this.initializeSheet();

    // Generate ID and order number if not provided
    if (!orderData.id) {
      orderData.id = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    if (!orderData.orderNumber) {
      orderData.orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    if (!orderData.orderId) {
      orderData.orderId = orderData.orderNumber;
    }

    // Set timestamps
    orderData.orderDate = orderData.orderDate || new Date().toISOString();
    orderData.createdAt = new Date().toISOString();
    orderData.updatedAt = new Date().toISOString();

    // Set defaults
    orderData.status = orderData.status || 'pending';
    orderData.paymentStatus = orderData.paymentStatus || 'pending';
    orderData.source = orderData.source || 'website';

    // Initialize timeline
    if (!orderData.timeline) {
      orderData.timeline = [{
        status: orderData.status,
        timestamp: orderData.createdAt,
        notes: 'Order created',
        automated: true
      }];
    }

    // Serialize complex fields
    const serializedOrder = this.serializeOrderData(orderData);

    const rowData = this.headers.map(header => {
      const value = googleSheetsService.getNestedValue(serializedOrder, header);
      return value !== undefined && value !== null ? String(value) : '';
    });

    await googleSheetsService.appendToSheet(this.sheetName, [rowData]);
    return this.parseOrderData(serializedOrder);
  }

  async update(id, updateData) {
    await this.initializeSheet();

    const data = await googleSheetsService.readSheet(this.sheetName);
    const orders = googleSheetsService.sheetDataToObjects(data);

    const orderIndex = orders.findIndex(order => order.id === id);
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }

    // Parse existing order data
    const existingOrder = this.parseOrderData(orders[orderIndex]);

    // Update timestamps
    updateData.updatedAt = new Date().toISOString();

    // Merge with existing data
    const updatedOrder = { ...existingOrder, ...updateData };

    // Serialize complex fields
    const serializedOrder = this.serializeOrderData(updatedOrder);

    // Update the row in the sheet
    const rowNumber = orderIndex + 2;
    const rowData = this.headers.map(header => {
      const value = googleSheetsService.getNestedValue(serializedOrder, header);
      return value !== undefined && value !== null ? String(value) : '';
    });

    await googleSheetsService.writeSheet(this.sheetName, `A${rowNumber}:AT${rowNumber}`, [rowData]);
    return this.parseOrderData(serializedOrder);
  }

  async delete(id) {
    // Mark as cancelled instead of deleting
    return await this.update(id, { status: 'cancelled' });
  }

  async addTimelineEvent(id, status, notes = '', updatedBy = null, automated = false) {
    const order = await this.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    const timeline = order.timeline || [];
    timeline.push({
      status,
      timestamp: new Date().toISOString(),
      updatedBy,
      notes,
      automated
    });

    return await this.update(id, { status, timeline });
  }

  async markAsPaid(id, paymentId, transactionId, paidAmount) {
    const order = await this.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    const payment = order.payment || {};
    payment.status = 'completed';
    payment.razorpayPaymentId = paymentId;
    payment.paidAmount = paidAmount;
    payment.paidAt = new Date().toISOString();

    const timeline = order.timeline || [];
    timeline.push({
      status: 'confirmed',
      timestamp: new Date().toISOString(),
      notes: 'Payment completed successfully',
      automated: true
    });

    return await this.update(id, {
      payment,
      paymentStatus: 'paid',
      transactionId,
      paymentDate: new Date().toISOString(),
      status: 'confirmed',
      timeline
    });
  }

  async markPaymentFailed(id, reason) {
    const order = await this.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    const payment = order.payment || {};
    payment.status = 'failed';
    payment.failureReason = reason;
    payment.retryCount = (payment.retryCount || 0) + 1;

    const timeline = order.timeline || [];
    timeline.push({
      status: 'pending',
      timestamp: new Date().toISOString(),
      notes: `Payment failed: ${reason}`,
      automated: true
    });

    return await this.update(id, {
      payment,
      paymentStatus: 'failed',
      timeline
    });
  }

  async getOrderStats(startDate, endDate) {
    const orders = await this.findAll();

    let filteredOrders = orders;
    if (startDate && endDate) {
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
      });
    }

    const stats = {};

    // Group by status
    filteredOrders.forEach(order => {
      const status = order.status || 'unknown';
      if (!stats[status]) {
        stats[status] = { count: 0, totalAmount: 0 };
      }
      stats[status].count += 1;
      stats[status].totalAmount += parseFloat(order.finalAmount || order.totalAmount || 0);
    });

    return Object.keys(stats).map(status => ({
      _id: status,
      count: stats[status].count,
      totalAmount: stats[status].totalAmount
    }));
  }

  async getPaymentStats(startDate, endDate) {
    const orders = await this.findAll();

    let filteredOrders = orders;
    if (startDate && endDate) {
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
      });
    }

    const stats = {};

    filteredOrders.forEach(order => {
      const method = order.payment?.method || order.paymentMethod || 'unknown';
      const status = order.payment?.status || order.paymentStatus || 'unknown';
      const key = `${method}_${status}`;

      if (!stats[key]) {
        stats[key] = { method, status, count: 0, totalAmount: 0 };
      }
      stats[key].count += 1;
      stats[key].totalAmount += parseFloat(order.finalAmount || order.totalAmount || 0);
    });

    return Object.values(stats).map(stat => ({
      _id: { method: stat.method, status: stat.status },
      count: stat.count,
      totalAmount: stat.totalAmount
    }));
  }

  async getRevenueMetrics(startDate, endDate) {
    const orders = await this.findAll();

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const paymentStatus = order.payment?.status || order.paymentStatus;
      return orderDate >= new Date(startDate) &&
        orderDate <= new Date(endDate) &&
        (paymentStatus === 'completed' || paymentStatus === 'paid');
    });

    const dailyStats = {};

    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          totalRevenue: 0,
          orderCount: 0,
          orders: []
        };
      }

      const amount = parseFloat(order.finalAmount || order.totalAmount || 0);
      dailyStats[dateKey].totalRevenue += amount;
      dailyStats[dateKey].orderCount += 1;
      dailyStats[dateKey].orders.push(amount);
    });

    return Object.values(dailyStats).map(stat => ({
      _id: { year: stat.year, month: stat.month, day: stat.day },
      totalRevenue: stat.totalRevenue,
      orderCount: stat.orderCount,
      averageOrderValue: stat.totalRevenue / stat.orderCount
    })).sort((a, b) => {
      const dateA = new Date(a._id.year, a._id.month - 1, a._id.day);
      const dateB = new Date(b._id.year, b._id.month - 1, b._id.day);
      return dateA - dateB;
    });
  }

  // Helper methods for serialization/deserialization
  serializeOrderData(order) {
    const serialized = {};

    // Map MongoDB order structure to simplified Google Sheets headers
    serialized['Order ID'] = order.orderId || order.orderNumber || order._id?.toString() || '';
    serialized['Customer Name'] = order.customer?.name || '';
    serialized['Customer Email'] = order.customer?.email || '';
    serialized['Customer Phone'] = order.customer?.phone || '';
    
    // Items - serialize as readable text and JSON
    if (order.items && Array.isArray(order.items)) {
      serialized['Items'] = JSON.stringify(order.items);
    } else {
      serialized['Items'] = '';
    }

    // Total amount
    serialized['Total Amount'] = order.pricing?.total || order.finalAmount || order.totalAmount || 0;
    
    // Payment information
    serialized['Payment Method'] = order.payment?.method || order.paymentMethod || 'cod';
    serialized['Payment Status'] = order.payment?.status || order.paymentStatus || 'pending';
    serialized['Transaction ID'] = order.payment?.transactionId || order.transactionId || '';

    // Shipping address
    if (order.shipping?.address) {
      const addr = order.shipping.address;
      serialized['Shipping Address'] = `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}`.replace(/,\s*,/g, ',').trim();
    } else {
      serialized['Shipping Address'] = '';
    }

    // Order status and dates
    serialized['Status'] = order.status || 'pending';
    serialized['Order Date'] = order.orderDate || order.createdAt || new Date().toISOString();
    serialized['Created At'] = order.createdAt || new Date().toISOString();
    serialized['Updated At'] = order.updatedAt || new Date().toISOString();

    return serialized;
  }

  parseOrderData(order) {
    const parsed = {
      customer: {},
      pricing: {},
      payment: {},
      shipping: {},
      delivery: {},
      items: []
    };

    // Map Google Sheets data to expected object structure
    parsed.orderId = order['Order ID'] || 'N/A';
    parsed.id = order['Order ID'] || 'N/A';
    parsed._id = order['Order ID'] || 'N/A';
    
    // Customer information
    parsed.customer.name = order['Customer Name'] || 'Unknown Customer';
    parsed.customer.email = order['Customer Email'] || 'N/A';
    parsed.customer.phone = order['Customer Phone'] || 'N/A';

    // Items - parse JSON if it's a string
    if (order['Items']) {
      try {
        parsed.items = JSON.parse(order['Items']);
      } catch (error) {
        parsed.items = [];
      }
    }

    // Pricing
    const totalAmount = parseFloat(order['Total Amount']) || 0;
    parsed.pricing.total = totalAmount;
    parsed.pricing.subtotal = totalAmount;
    parsed.pricing.taxes = 0;
    parsed.pricing.shippingCharges = 0;
    parsed.pricing.codCharges = 0;
    parsed.pricing.discount = 0;

    // Payment information
    parsed.payment.method = order['Payment Method'] || 'cod';
    parsed.payment.status = order['Payment Status'] || 'pending';
    parsed.payment.transactionId = order['Transaction ID'] || null;

    // Shipping
    if (order['Shipping Address']) {
      // Parse address string back to object if needed
      parsed.shipping.address = {
        street: order['Shipping Address'] || '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      };
    }

    // Order status and dates
    parsed.status = order['Status'] || 'pending';
    parsed.createdAt = order['Created At'] || new Date().toISOString();
    parsed.updatedAt = order['Updated At'] || new Date().toISOString();
    parsed.orderDate = order['Order Date'] || parsed.createdAt;

    return parsed;
  }

  // Get orders with pagination and filters
  async findWithPagination(page = 1, limit = 20, filters = {}) {
    let orders = await this.findAll();

    // Apply filters
    if (filters.status) {
      orders = orders.filter(o => o.status === filters.status);
    }

    if (filters.paymentStatus) {
      orders = orders.filter(o =>
        (o.payment?.status || o.paymentStatus) === filters.paymentStatus
      );
    }

    if (filters.customerId) {
      orders = orders.filter(o => o.customerId === filters.customerId);
    }

    if (filters.startDate && filters.endDate) {
      orders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= new Date(filters.startDate) && orderDate <= new Date(filters.endDate);
      });
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const total = orders.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: endIndex < total,
        hasPrevPage: page > 1
      }
    };
  }
}

module.exports = new OrderSheetsDAO();