const dataService = require('../services/dataService');
const { validationResult } = require('express-validator');

class DataController {
  // Customer endpoints
  async getAllCustomers(req, res) {
    try {
      const customers = await dataService.findAllCustomers();
      res.json({
        success: true,
        data: customers,
        count: customers.length
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers',
        error: error.message
      });
    }
  }

  async getCustomerById(req, res) {
    try {
      const { id } = req.params;
      const customer = await dataService.findCustomerById(id);
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer',
        error: error.message
      });
    }
  }

  async createCustomer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const customer = await dataService.createCustomer(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error: error.message
      });
    }
  }

  async updateCustomer(req, res) {
    try {
      const { id } = req.params;
      const customer = await dataService.updateCustomer(id, req.body);
      
      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer',
        error: error.message
      });
    }
  }

  // Product endpoints
  async getAllProducts(req, res) {
    try {
      const { active, featured, category, search, page = 1, limit = 20 } = req.query;
      
      let products;
      
      if (active === 'true') {
        products = await dataService.findActiveProducts();
      } else {
        products = await dataService.findAllProducts();
      }

      // Apply filters
      if (featured === 'true') {
        products = products.filter(p => p.isFeatured === true || p.isFeatured === 'true');
      }
      
      if (category) {
        products = products.filter(p => p.category === category);
      }
      
      if (search) {
        products = await dataService.searchProducts(search);
      }

      // Pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedProducts = products.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(products.length / parseInt(limit)),
          totalItems: products.length,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message
      });
    }
  }

  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await dataService.findProductById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        error: error.message
      });
    }
  }

  async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const product = await dataService.createProduct(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message
      });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await dataService.updateProduct(id, req.body);
      
      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message
      });
    }
  }

  // Order endpoints
  async getAllOrders(req, res) {
    try {
      const { status, customerId, page = 1, limit = 20, startDate, endDate } = req.query;
      
      let orders = await dataService.findAllOrders();

      // Apply filters
      if (status) {
        orders = orders.filter(o => o.status === status);
      }
      
      if (customerId) {
        orders = orders.filter(o => o.customerId === customerId);
      }
      
      if (startDate && endDate) {
        orders = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
        });
      }

      // Sort by creation date (newest first)
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedOrders = orders.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(orders.length / parseInt(limit)),
          totalItems: orders.length,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: error.message
      });
    }
  }

  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await dataService.findOrderById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: error.message
      });
    }
  }

  async createOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const order = await dataService.createOrder(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error.message
      });
    }
  }

  async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await dataService.updateOrder(id, req.body);
      
      res.json({
        success: true,
        message: 'Order updated successfully',
        data: order
      });
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order',
        error: error.message
      });
    }
  }

  // Admin User endpoints
  async getAllAdminUsers(req, res) {
    try {
      const admins = await dataService.findAllAdminUsers();
      
      // Remove sensitive information
      const sanitizedAdmins = admins.map(admin => {
        const { passwordHash, security, ...sanitized } = admin;
        return {
          ...sanitized,
          security: {
            lastLogin: security?.lastLogin,
            mfaEnabled: security?.mfaEnabled,
            loginAttempts: security?.loginAttempts
          }
        };
      });

      res.json({
        success: true,
        data: sanitizedAdmins,
        count: sanitizedAdmins.length
      });
    } catch (error) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admin users',
        error: error.message
      });
    }
  }

  // Analytics endpoints
  async getAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const [orderStats, revenueMetrics, customerStats, productStats] = await Promise.all([
        dataService.getOrderStats(start, end),
        dataService.getRevenueMetrics(start, end),
        dataService.getCustomerStats(),
        dataService.getProductStats()
      ]);

      res.json({
        success: true,
        data: {
          orders: orderStats,
          revenue: revenueMetrics,
          customers: customerStats,
          products: productStats,
          dateRange: {
            startDate: start.toISOString(),
            endDate: end.toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message
      });
    }
  }

  // Data source status
  async getDataSourceStatus(req, res) {
    try {
      const useGoogleSheets = process.env.USE_GOOGLE_SHEETS === 'true';
      const fallbackToMongo = process.env.FALLBACK_TO_MONGO === 'true';
      
      res.json({
        success: true,
        data: {
          primaryDataSource: useGoogleSheets ? 'Google Sheets' : 'MongoDB',
          fallbackEnabled: fallbackToMongo,
          googleSheetsEnabled: useGoogleSheets,
          mongoDbAvailable: !!require('../models/Customer'),
          spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || null
        }
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          primaryDataSource: 'Unknown',
          fallbackEnabled: false,
          googleSheetsEnabled: false,
          mongoDbAvailable: false,
          error: error.message
        }
      });
    }
  }
}

module.exports = new DataController();