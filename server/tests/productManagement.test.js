const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Product = require('../models/Product');
const { AdminUser, AdminRole } = require('../models/AdminUser');
const jwt = require('jsonwebtoken');

describe('Product Management System', () => {
  let mongoServer;
  let adminToken;
  let admin;
  let testProduct;

  beforeAll(async () => {
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    // Create default roles
    await AdminUser.createDefaultRoles();

    // Create test admin
    const adminRole = await AdminRole.findOne({ name: 'Super Admin' });
    admin = new AdminUser({
      email: 'admin@test.com',
      passwordHash: 'hashedpassword',
      role: adminRole._id,
      profile: {
        firstName: 'Test',
        lastName: 'Admin'
      }
    });
    await admin.save();

    // Generate admin token
    adminToken = jwt.sign(
      { 
        adminId: admin._id,
        email: admin.email,
        role: adminRole.name
      },
      process.env.JWT_SECRET || 'test-secret',
      { 
        expiresIn: '1h',
        audience: 'admin-users',
        issuer: 'admin-system'
      }
    );
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up products before each test
    await Product.deleteMany({});
  });

  describe('Product CRUD Operations', () => {
    test('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        category: 'Electronics',
        price: 999.99,
        sku: 'TEST001',
        brand: 'TestBrand',
        description: 'A test product',
        pricing: {
          basePrice: 999.99,
          currency: 'INR',
          taxRate: 18
        },
        inventory: {
          stock: 100,
          lowStockThreshold: 10,
          warehouseLocation: 'Main Warehouse'
        }
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(productData.name);
      expect(response.body.data.product.sku).toBe(productData.sku);
      expect(response.body.data.product.createdBy).toBe(admin._id.toString());

      testProduct = response.body.data.product;
    });

    test('should get all products with pagination', async () => {
      // Create test products
      const products = [];
      for (let i = 1; i <= 5; i++) {
        const product = new Product({
          name: `Test Product ${i}`,
          category: 'Electronics',
          price: 100 * i,
          sku: `TEST00${i}`,
          createdBy: admin._id,
          pricing: {
            basePrice: 100 * i,
            currency: 'INR'
          },
          inventory: {
            stock: 10 * i,
            available: 10 * i
          }
        });
        await product.save();
        products.push(product);
      }

      const response = await request(app)
        .get('/api/products?page=1&limit=3')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(3);
      expect(response.body.data.pagination.totalProducts).toBe(5);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    test('should get single product by ID', async () => {
      const product = new Product({
        name: 'Single Test Product',
        category: 'Electronics',
        price: 500,
        sku: 'SINGLE001',
        createdBy: admin._id,
        pricing: {
          basePrice: 500,
          currency: 'INR'
        },
        inventory: {
          stock: 50,
          available: 50
        }
      });
      await product.save();

      const response = await request(app)
        .get(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(product.name);
      expect(response.body.data.product._id).toBe(product._id.toString());
    });

    test('should update product information', async () => {
      const product = new Product({
        name: 'Update Test Product',
        category: 'Electronics',
        price: 300,
        sku: 'UPDATE001',
        createdBy: admin._id,
        pricing: {
          basePrice: 300,
          currency: 'INR'
        },
        inventory: {
          stock: 30,
          available: 30
        }
      });
      await product.save();

      const updateData = {
        name: 'Updated Product Name',
        price: 350,
        pricing: {
          basePrice: 350
        }
      };

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(updateData.name);
      expect(response.body.data.product.pricing.basePrice).toBe(350);
    });

    test('should update product status', async () => {
      const product = new Product({
        name: 'Status Test Product',
        category: 'Electronics',
        price: 200,
        sku: 'STATUS001',
        createdBy: admin._id,
        status: 'active',
        pricing: {
          basePrice: 200,
          currency: 'INR'
        },
        inventory: {
          stock: 20,
          available: 20
        }
      });
      await product.save();

      const response = await request(app)
        .patch(`/api/products/${product._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'inactive',
          reason: 'Test deactivation'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.status).toBe('inactive');
    });

    test('should update product inventory', async () => {
      const product = new Product({
        name: 'Inventory Test Product',
        category: 'Electronics',
        price: 150,
        sku: 'INVENTORY001',
        createdBy: admin._id,
        pricing: {
          basePrice: 150,
          currency: 'INR'
        },
        inventory: {
          stock: 15,
          available: 15
        }
      });
      await product.save();

      const response = await request(app)
        .patch(`/api/products/${product._id}/inventory`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantity: 25,
          type: 'add',
          reason: 'Restocking'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.inventory.stock).toBe(40); // 15 + 25
    });

    test('should search products', async () => {
      // Create test products
      const products = [
        {
          name: 'iPhone 14',
          category: 'Electronics',
          brand: 'Apple',
          price: 80000,
          sku: 'IPHONE14',
          createdBy: admin._id
        },
        {
          name: 'Samsung Galaxy',
          category: 'Electronics',
          brand: 'Samsung',
          price: 60000,
          sku: 'GALAXY001',
          createdBy: admin._id
        }
      ];

      for (const productData of products) {
        const product = new Product({
          ...productData,
          pricing: { basePrice: productData.price, currency: 'INR' },
          inventory: { stock: 10, available: 10 }
        });
        await product.save();
      }

      const response = await request(app)
        .get('/api/products/search?q=iPhone')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('iPhone 14');
    });

    test('should delete product (soft delete)', async () => {
      const product = new Product({
        name: 'Delete Test Product',
        category: 'Electronics',
        price: 100,
        sku: 'DELETE001',
        createdBy: admin._id,
        pricing: {
          basePrice: 100,
          currency: 'INR'
        },
        inventory: {
          stock: 10,
          available: 10
        }
      });
      await product.save();

      const response = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test deletion'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.status).toBe('inactive');
    });
  });

  describe('Product Analytics', () => {
    test('should get product analytics', async () => {
      const product = new Product({
        name: 'Analytics Test Product',
        category: 'Electronics',
        price: 500,
        sku: 'ANALYTICS001',
        createdBy: admin._id,
        pricing: {
          basePrice: 500,
          currency: 'INR'
        },
        inventory: {
          stock: 50,
          available: 50
        },
        analytics: {
          views: 100,
          purchases: 5,
          revenue: 2500
        }
      });
      await product.save();

      const response = await request(app)
        .get(`/api/products/${product._id}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics.views).toBe(100);
      expect(response.body.data.analytics.purchases).toBe(5);
      expect(response.body.data.analytics.revenue).toBe(2500);
    });
  });

  describe('Product Validation', () => {
    test('should reject product creation without required fields', async () => {
      const invalidProductData = {
        // Missing name and category
        price: 100
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProductData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should reject duplicate SKU', async () => {
      // Create first product
      const product1 = new Product({
        name: 'First Product',
        category: 'Electronics',
        price: 100,
        sku: 'DUPLICATE001',
        createdBy: admin._id,
        pricing: { basePrice: 100, currency: 'INR' },
        inventory: { stock: 10, available: 10 }
      });
      await product1.save();

      // Try to create second product with same SKU
      const product2Data = {
        name: 'Second Product',
        category: 'Electronics',
        price: 200,
        sku: 'DUPLICATE001'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(product2Data)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });
});