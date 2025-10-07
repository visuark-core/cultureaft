const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cors = require('cors');

// Import models and routes
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const analyticsRoutes = require('../routes/analytics');
const { handleValidationError } = require('../middleware/validation');

describe('Analytics API Integration Tests', () => {
  let app;
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create Express app for testing
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/analytics', analyticsRoutes);
    app.use(handleValidationError);
    
    // Global error handler
    app.use((error, req, res, next) => {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        data: null
      });
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await Order.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
  });

  describe('GET /api/analytics/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/analytics/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Analytics service is healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/analytics/kpis', () => {
    beforeEach(async () => {
      // Create test data
      const customer = await Customer.create({
        customerId: 'CUST-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        registrationDate: new Date()
      });

      await Order.create({
        orderId: 'ORD-001',
        customerId: customer._id,
        products: [{
          productId: new mongoose.Types.ObjectId(),
          name: 'Test Product',
          sku: 'SKU-001',
          quantity: 1,
          price: 1000,
          category: 'Furniture'
        }],
        totalAmount: 1000,
        status: 'completed',
        orderDate: new Date()
      });
    });

    it('should return KPI data successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/kpis')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('totalSales');
      expect(response.body.data).toHaveProperty('newCustomers');
      expect(response.body.data).toHaveProperty('avgOrderValue');

      expect(response.body.data.totalRevenue.value).toBe(1000);
      expect(response.body.data.totalSales.value).toBe(1);
    });

    it('should validate days parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/kpis?days=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Days parameter must be a number');
    });

    it('should reject days parameter out of range', async () => {
      const response = await request(app)
        .get('/api/analytics/kpis?days=500')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Days parameter must be a number between 1 and 365');
    });

    it('should include rate limiting headers', async () => {
      const response = await request(app)
        .get('/api/analytics/kpis')
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('GET /api/analytics/sales-chart', () => {
    beforeEach(async () => {
      const customer = await Customer.create({
        customerId: 'CUST-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      });

      // Create orders for different days
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      await Order.create({
        orderId: 'ORD-001',
        customerId: customer._id,
        products: [{
          productId: new mongoose.Types.ObjectId(),
          name: 'Test Product 1',
          sku: 'SKU-001',
          quantity: 1,
          price: 1000,
          category: 'Furniture'
        }],
        totalAmount: 1000,
        status: 'completed',
        orderDate: today
      });

      await Order.create({
        orderId: 'ORD-002',
        customerId: customer._id,
        products: [{
          productId: new mongoose.Types.ObjectId(),
          name: 'Test Product 2',
          sku: 'SKU-002',
          quantity: 1,
          price: 2000,
          category: 'Decor'
        }],
        totalAmount: 2000,
        status: 'delivered',
        orderDate: yesterday
      });
    });

    it('should return sales chart data', async () => {
      const response = await request(app)
        .get('/api/analytics/sales-chart?days=7')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(7);

      const firstDay = response.body.data[0];
      expect(firstDay).toHaveProperty('name');
      expect(firstDay).toHaveProperty('Sales');
      expect(firstDay).toHaveProperty('orderCount');
    });

    it('should handle empty data gracefully', async () => {
      await Order.deleteMany({});

      const response = await request(app)
        .get('/api/analytics/sales-chart')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All days should have zero sales
      response.body.data.forEach(day => {
        expect(day.Sales).toBe(0);
        expect(day.orderCount).toBe(0);
      });
    });
  });

  describe('GET /api/analytics/category-distribution', () => {
    beforeEach(async () => {
      const customer = await Customer.create({
        customerId: 'CUST-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      });

      await Order.create({
        orderId: 'ORD-001',
        customerId: customer._id,
        products: [
          {
            productId: new mongoose.Types.ObjectId(),
            name: 'Furniture Item',
            sku: 'SKU-001',
            quantity: 2,
            price: 1000,
            category: 'Furniture'
          },
          {
            productId: new mongoose.Types.ObjectId(),
            name: 'Decor Item',
            sku: 'SKU-002',
            quantity: 1,
            price: 500,
            category: 'Decor'
          }
        ],
        totalAmount: 2500,
        status: 'completed',
        orderDate: new Date()
      });
    });

    it('should return category distribution data', async () => {
      const response = await request(app)
        .get('/api/analytics/category-distribution')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);

      const categories = response.body.data.map(cat => cat.name);
      expect(categories).toContain('Furniture');
      expect(categories).toContain('Decor');

      const furnitureCategory = response.body.data.find(cat => cat.name === 'Furniture');
      expect(furnitureCategory.value).toBe(2000);
    });

    it('should return empty array when no data exists', async () => {
      await Order.deleteMany({});

      const response = await request(app)
        .get('/api/analytics/category-distribution')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/analytics/top-products', () => {
    beforeEach(async () => {
      const customer = await Customer.create({
        customerId: 'CUST-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      });

      // Create orders with different products
      await Order.create({
        orderId: 'ORD-001',
        customerId: customer._id,
        products: [{
          productId: new mongoose.Types.ObjectId(),
          name: 'Popular Product',
          sku: 'SKU-001',
          quantity: 5,
          price: 1000,
          category: 'Furniture'
        }],
        totalAmount: 5000,
        status: 'completed',
        orderDate: new Date()
      });

      await Order.create({
        orderId: 'ORD-002',
        customerId: customer._id,
        products: [{
          productId: new mongoose.Types.ObjectId(),
          name: 'Less Popular Product',
          sku: 'SKU-002',
          quantity: 2,
          price: 1500,
          category: 'Decor'
        }],
        totalAmount: 3000,
        status: 'delivered',
        orderDate: new Date()
      });
    });

    it('should return top products data', async () => {
      const response = await request(app)
        .get('/api/analytics/top-products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);

      // Check sorting (highest units sold first)
      expect(response.body.data[0].name).toBe('Popular Product');
      expect(response.body.data[0].unitsSold).toBe(5);
      expect(response.body.data[1].name).toBe('Less Popular Product');
      expect(response.body.data[1].unitsSold).toBe(2);

      // Check revenue formatting
      expect(response.body.data[0].revenue).toBe('₹5,000');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/top-products?limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Popular Product');
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/top-products?limit=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Limit parameter must be a number');
    });
  });

  describe('GET /api/analytics/dashboard', () => {
    beforeEach(async () => {
      const customer = await Customer.create({
        customerId: 'CUST-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        registrationDate: new Date()
      });

      await Order.create({
        orderId: 'ORD-001',
        customerId: customer._id,
        products: [{
          productId: new mongoose.Types.ObjectId(),
          name: 'Test Product',
          sku: 'SKU-001',
          quantity: 1,
          price: 1000,
          category: 'Furniture'
        }],
        totalAmount: 1000,
        status: 'completed',
        orderDate: new Date()
      });
    });

    it('should return comprehensive dashboard data', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('kpis');
      expect(response.body.data).toHaveProperty('salesChart');
      expect(response.body.data).toHaveProperty('categoryDistribution');
      expect(response.body.data).toHaveProperty('topProducts');

      // Verify KPIs structure
      expect(response.body.data.kpis).toHaveProperty('totalRevenue');
      expect(response.body.data.kpis).toHaveProperty('totalSales');
      expect(response.body.data.kpis).toHaveProperty('newCustomers');
      expect(response.body.data.kpis).toHaveProperty('avgOrderValue');

      // Verify arrays
      expect(Array.isArray(response.body.data.salesChart)).toBe(true);
      expect(Array.isArray(response.body.data.categoryDistribution)).toBe(true);
      expect(Array.isArray(response.body.data.topProducts)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple requests quickly
      const requests = [];
      for (let i = 0; i < 65; i++) { // Exceed the 60 requests per minute limit
        requests.push(request(app).get('/api/analytics/health'));
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Rate limited response should have proper structure
      const rateLimitedResponse = rateLimitedResponses[0];
      expect(rateLimitedResponse.body.success).toBe(false);
      expect(rateLimitedResponse.body.message).toContain('Too many requests');
      expect(rateLimitedResponse.body).toHaveProperty('retryAfter');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/analytics/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers).toHaveProperty('referrer-policy', 'strict-origin-when-cross-origin');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Close database connection to simulate error
      await mongoose.disconnect();

      const response = await request(app)
        .get('/api/analytics/kpis')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to calculate KPI metrics');

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });

    it('should return proper error format for invalid requests', async () => {
      const response = await request(app)
        .get('/api/analytics/nonexistent-endpoint')
        .expect(404);

      // Express default 404 handling
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize query parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/kpis?days=30&malicious=<script>alert("xss")</script>')
        .expect(200);

      // Request should succeed (malicious parameter ignored)
      expect(response.body.success).toBe(true);
    });
  });
});