const mongoose = require('mongoose');

// Import MongoDB models that remain in MongoDB
const AdminUser = require('../models/AdminUser');
const Analytics = require('../models/Analytics');
const AuditLog = require('../models/AuditLog');

// Import Google Sheets DAOs
const CustomerSheetsDAO = require('./sheets/CustomerSheetsDAO');
const OrderSheetsDAO = require('./sheets/OrderSheetsDAO');
const googleSheetsService = require('./googleSheetsService');

/**
 * DataService - Hybrid MongoDB + Google Sheets
 * 
 * This service handles data operations using a hybrid approach:
 * - Google Sheets: Customer data, Order data, Product data
 * - MongoDB: Admin users, Analytics, Audit logs, Authentication
 */
class DataService {
  constructor() {
    console.log('DataService initialized with hybrid MongoDB + Google Sheets approach');
  }

  // Customer operations (Google Sheets)
  async findAllCustomers() {
    return await CustomerSheetsDAO.findAll();
  }

  async findCustomerById(id) {
    return await CustomerSheetsDAO.findById(id);
  }

  async findCustomerByEmail(email) {
    return await CustomerSheetsDAO.findByEmail(email);
  }

  async createCustomer(customerData) {
    return await CustomerSheetsDAO.create(customerData);
  }

  async updateCustomer(id, updateData) {
    return await CustomerSheetsDAO.update(id, updateData);
  }

  async updateCustomerStats(customerId, orderAmount) {
    return await CustomerSheetsDAO.updateStats(customerId, orderAmount);
  }

  async findCustomersByStatus(status) {
    return await CustomerSheetsDAO.findByStatus(status);
  }

  async getCustomerStats() {
    return await CustomerSheetsDAO.getCustomerStats();
  }

  // Order operations (Google Sheets)
  async findAllOrders() {
    return await OrderSheetsDAO.findAll();
  }

  async findOrderById(id) {
    return await OrderSheetsDAO.findById(id);
  }

  async findOrderByOrderNumber(orderNumber) {
    return await OrderSheetsDAO.findByOrderNumber(orderNumber);
  }

  async findOrdersByCustomerId(customerId) {
    return await OrderSheetsDAO.findByCustomerId(customerId);
  }

  async findOrdersByStatus(status) {
    return await OrderSheetsDAO.findByStatus(status);
  }

  async findOrderByRazorpayOrderId(razorpayOrderId) {
    return await OrderSheetsDAO.findByRazorpayOrderId(razorpayOrderId);
  }

  async createOrder(orderData) {
    return await OrderSheetsDAO.create(orderData);
  }

  async updateOrder(id, updateData) {
    return await OrderSheetsDAO.update(id, updateData);
  }

  async addOrderTimelineEvent(id, status, notes, updatedBy, automated = false) {
    return await OrderSheetsDAO.addTimelineEvent(id, status, notes, updatedBy, automated);
  }

  async markOrderAsPaid(id, paymentId, transactionId, paidAmount) {
    return await OrderSheetsDAO.markAsPaid(id, paymentId, transactionId, paidAmount);
  }

  async markOrderPaymentFailed(id, reason) {
    return await OrderSheetsDAO.markPaymentFailed(id, reason);
  }

  async getOrdersWithPagination(page = 1, limit = 20, filters = {}) {
    return await OrderSheetsDAO.findWithPagination(page, limit, filters);
  }

  // Product operations (Google Sheets)
  async findAllProducts() {
    try {
      const data = await googleSheetsService.readSheet('Products');
      if (!data || data.length <= 1) return [];
      
      return googleSheetsService.sheetDataToObjects(data).map(product => ({
        _id: product.id,
        id: product.id,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        price: parseFloat(product.price) || 0,
        originalPrice: parseFloat(product.originalPrice) || 0,
        discountPercentage: parseFloat(product.discountPercentage) || 0,
        sku: product.sku,
        description: product.description,
        shortDescription: product.shortDescription,
        craftsman: product.craftsman,
        image: product.image,
        images: this.parseJsonField(product.images),
        materials: this.parseJsonField(product.materials),
        dimensions: product.dimensions,
        weight: product.weight,
        origin: product.origin,
        rating: parseFloat(product.rating) || 0,
        reviewCount: parseInt(product.reviewCount) || 0,
        isNew: product.isNew === 'true',
        isFeatured: product.isFeatured === 'true',
        isActive: product.isActive === 'true',
        stock: parseInt(product.stock) || 0,
        minQuantity: parseInt(product.minQuantity) || 1,
        maxQuantity: parseInt(product.maxQuantity) || 10,
        tags: this.parseJsonField(product.tags),
        hsn: product.hsn,
        taxRate: parseFloat(product.taxRate) || 0.18,
        careInstructions: this.parseJsonField(product.careInstructions),
        warranty: product.warranty,
        shippingWeight: parseFloat(product.shippingWeight) || 0,
        shippingDimensions: this.parseJsonField(product.shippingDimensions),
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching products from Google Sheets:', error);
      return [];
    }
  }

  async findProductById(id) {
    const products = await this.findAllProducts();
    return products.find(product => product.id === id || product._id === id);
  }

  async findProductBySku(sku) {
    const products = await this.findAllProducts();
    return products.find(product => product.sku === sku);
  }

  async createProduct(productData) {
    const productSheetName = 'Products';
    const productHeaders = [
      'id', 'name', 'category', 'subcategory', 'price', 'originalPrice', 'discountPercentage',
      'sku', 'description', 'shortDescription', 'craftsman', 'image', 'images', 'materials',
      'dimensions', 'weight', 'origin', 'rating', 'reviewCount', 'isNew', 'isFeatured',
      'isActive', 'stock', 'minQuantity', 'maxQuantity', 'tags', 'hsn', 'taxRate',
      'careInstructions', 'warranty', 'shippingWeight', 'shippingDimensions',
      'metaTitle', 'metaDescription', 'createdAt', 'updatedAt'
    ];

    // Generate ID if not provided
    if (!productData.id) {
      productData.id = `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // Set timestamps
    productData.createdAt = new Date().toISOString();
    productData.updatedAt = new Date().toISOString();

    const rowData = productHeaders.map(header => {
      const value = productData[header];
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        return JSON.stringify(value);
      }
      return value !== undefined && value !== null ? String(value) : '';
    });

    await googleSheetsService.appendToSheet(productSheetName, [rowData]);
    return { ...productData, _id: productData.id };
  }

  async updateProduct(id, updateData) {
    const products = await this.findAllProducts();
    const productIndex = products.findIndex(p => p.id === id || p._id === id);
    
    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    // Update the product data
    const updatedProduct = { ...products[productIndex], ...updateData };
    updatedProduct.updatedAt = new Date().toISOString();

    // Update in Google Sheets
    const productHeaders = [
      'id', 'name', 'category', 'subcategory', 'price', 'originalPrice', 'discountPercentage',
      'sku', 'description', 'shortDescription', 'craftsman', 'image', 'images', 'materials',
      'dimensions', 'weight', 'origin', 'rating', 'reviewCount', 'isNew', 'isFeatured',
      'isActive', 'stock', 'minQuantity', 'maxQuantity', 'tags', 'hsn', 'taxRate',
      'careInstructions', 'warranty', 'shippingWeight', 'shippingDimensions',
      'metaTitle', 'metaDescription', 'createdAt', 'updatedAt'
    ];

    const rowNumber = productIndex + 2; // +2 for header row and 0-based indexing
    const rowData = productHeaders.map(header => {
      const value = updatedProduct[header];
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        return JSON.stringify(value);
      }
      return value !== undefined && value !== null ? String(value) : '';
    });

    await googleSheetsService.writeSheet('Products', `A${rowNumber}:AK${rowNumber}`, [rowData]);
    return updatedProduct;
  }

  // Admin User operations (MongoDB)
  async findAllAdminUsers() {
    return await AdminUser.find({}).select('-passwordHash -security.sessionTokens');
  }

  async findAdminUserById(id) {
    return await AdminUser.findById(id).select('-passwordHash -security.sessionTokens');
  }

  async findAdminUserByEmail(email) {
    return await AdminUser.findOne({ email }).select('-passwordHash -security.sessionTokens');
  }

  async createAdminUser(adminData) {
    const admin = new AdminUser(adminData);
    return await admin.save();
  }

  async updateAdminUser(id, updateData) {
    return await AdminUser.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash -security.sessionTokens');
  }

  async deleteAdminUser(id) {
    return await AdminUser.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  // Analytics operations (MongoDB)
  async createAnalyticsEvent(eventData) {
    const analytics = new Analytics(eventData);
    return await analytics.save();
  }

  async findAnalyticsByDateRange(startDate, endDate) {
    return await Analytics.find({
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ timestamp: -1 });
  }

  async getAnalyticsStats(startDate, endDate) {
    return await Analytics.aggregate([
      {
        $match: {
          timestamp: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  // Audit Log operations (MongoDB)
  async createAuditLog(logData) {
    const auditLog = new AuditLog(logData);
    return await auditLog.save();
  }

  async findAuditLogsByDateRange(startDate, endDate) {
    return await AuditLog.find({
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ timestamp: -1 });
  }

  async findAuditLogsByUser(userId) {
    return await AuditLog.find({ userId }).sort({ timestamp: -1 }).limit(100);
  }

  async findAuditLogsByResource(resource, resourceId) {
    return await AuditLog.find({ resource, resourceId }).sort({ timestamp: -1 });
  }

  // Analytics and reporting (hybrid)
  async getOrderStats(startDate, endDate) {
    return await OrderSheetsDAO.getOrderStats(startDate, endDate);
  }

  async getPaymentStats(startDate, endDate) {
    return await OrderSheetsDAO.getPaymentStats(startDate, endDate);
  }

  async getRevenueMetrics(startDate, endDate) {
    return await OrderSheetsDAO.getRevenueMetrics(startDate, endDate);
  }

  // Utility methods
  parseJsonField(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch (error) {
      return [];
    }
  }

  // Health check
  async healthCheck() {
    const health = {
      status: 'healthy',
      dataSource: 'Hybrid (MongoDB + Google Sheets)',
      timestamp: new Date().toISOString(),
      checks: {}
    };

    try {
      // Test Google Sheets connectivity
      await CustomerSheetsDAO.findAll();
      health.checks.googleSheets = 'connected';
      
      // Test individual sheets
      const sheets = ['Customers', 'Orders', 'Products'];
      for (const sheet of sheets) {
        try {
          await googleSheetsService.readSheet(sheet, 'A1:A1');
          health.checks[sheet] = 'accessible';
        } catch (error) {
          health.checks[sheet] = 'error: ' + error.message;
          if (health.status === 'healthy') {
            health.status = 'degraded';
          }
        }
      }

      // Test MongoDB connectivity
      await mongoose.connection.db.admin().ping();
      health.checks.mongodb = 'connected';

      // Test MongoDB collections
      const collections = ['AdminUser', 'Analytics', 'AuditLog'];
      for (const collection of collections) {
        try {
          await mongoose.connection.db.collection(collection.toLowerCase() + 's').findOne({});
          health.checks[collection] = 'accessible';
        } catch (error) {
          health.checks[collection] = 'error: ' + error.message;
          if (health.status === 'healthy') {
            health.status = 'degraded';
          }
        }
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }

  // Migration helpers
  async validateDataIntegrity() {
    const report = {
      timestamp: new Date().toISOString(),
      checks: {},
      issues: [],
      summary: { passed: 0, failed: 0 }
    };

    try {
      // Check customers (Google Sheets)
      const customers = await this.findAllCustomers();
      report.checks.customers = {
        count: customers.length,
        source: 'Google Sheets',
        hasRequiredFields: customers.every(c => c.email && c.firstName && c.lastName)
      };
      if (!report.checks.customers.hasRequiredFields) {
        report.issues.push('Some customers missing required fields');
        report.summary.failed++;
      } else {
        report.summary.passed++;
      }

      // Check orders (Google Sheets)
      const orders = await this.findAllOrders();
      report.checks.orders = {
        count: orders.length,
        source: 'Google Sheets',
        hasRequiredFields: orders.every(o => o.orderId && o.customer && o.items)
      };
      if (!report.checks.orders.hasRequiredFields) {
        report.issues.push('Some orders missing required fields');
        report.summary.failed++;
      } else {
        report.summary.passed++;
      }

      // Check products (Google Sheets)
      const products = await this.findAllProducts();
      report.checks.products = {
        count: products.length,
        source: 'Google Sheets',
        hasRequiredFields: products.every(p => p.name && p.sku && p.price)
      };
      if (!report.checks.products.hasRequiredFields) {
        report.issues.push('Some products missing required fields');
        report.summary.failed++;
      } else {
        report.summary.passed++;
      }

      // Check admin users (MongoDB)
      const adminUsers = await this.findAllAdminUsers();
      report.checks.adminUsers = {
        count: adminUsers.length,
        source: 'MongoDB',
        hasRequiredFields: adminUsers.every(a => a.email && a.role)
      };
      if (!report.checks.adminUsers.hasRequiredFields) {
        report.issues.push('Some admin users missing required fields');
        report.summary.failed++;
      } else {
        report.summary.passed++;
      }

      // Check analytics (MongoDB)
      const analyticsCount = await Analytics.countDocuments();
      report.checks.analytics = {
        count: analyticsCount,
        source: 'MongoDB'
      };
      report.summary.passed++;

      // Check audit logs (MongoDB)
      const auditLogCount = await AuditLog.countDocuments();
      report.checks.auditLogs = {
        count: auditLogCount,
        source: 'MongoDB'
      };
      report.summary.passed++;

    } catch (error) {
      report.issues.push(`Validation error: ${error.message}`);
      report.summary.failed++;
    }

    return report;
  }
}

module.exports = new DataService();