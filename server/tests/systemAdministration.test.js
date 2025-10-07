const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const AdminUser = require('../models/AdminUser');
const SystemSettings = require('../models/SystemSettings');
const SystemMetrics = require('../models/SystemMetrics');
const AuditLog = require('../models/AuditLog');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('System Administration', () => {
  let mongoServer;
  let superAdmin;
  let adminToken;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await AdminUser.deleteMany({});
    await SystemSettings.deleteMany({});
    await SystemMetrics.deleteMany({});
    await AuditLog.deleteMany({});

    // Create a super admin for testing
    superAdmin = await AdminUser.create({
      email: 'superadmin@test.com',
      passwordHash: '$2b$10$test.hash.for.testing.purposes.only',
      profile: {
        firstName: 'Super',
        lastName: 'Admin'
      },
      role: {
        name: 'Super Admin',
        level: 1,
        permissions: [
          { resource: 'system', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'products', actions: ['create', 'read', 'update', 'delete'] }
        ]
      },
      isActive: true
    });

    // Generate a test token (simplified for testing)
    adminToken = 'test-admin-token';
  });

  describe('System Settings', () => {
    test('should initialize default system settings', async () => {
      const response = await request(app)
        .post('/api/system/settings/initialize')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('initialized successfully');

      // Verify settings were created
      const settings = await SystemSettings.find({});
      expect(settings.length).toBeGreaterThan(0);
    });

    test('should get system settings by category', async () => {
      // First initialize settings
      await SystemSettings.createDefaults(superAdmin._id);

      const response = await request(app)
        .get('/api/system/settings/general')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should update a system setting', async () => {
      // First initialize settings
      await SystemSettings.createDefaults(superAdmin._id);

      const response = await request(app)
        .put('/api/system/settings/general/site_name')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          value: 'Updated Site Name',
          reason: 'Testing update functionality'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.value).toBe('Updated Site Name');
    });
  });

  describe('System Health and Metrics', () => {
    test('should get system health status', async () => {
      const response = await request(app)
        .get('/api/system/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('health');
      expect(response.body.data).toHaveProperty('systemInfo');
    });

    test('should record system metrics', async () => {
      const response = await request(app)
        .post('/api/system/metrics/record')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('timestamp');

      // Verify metrics were saved
      const metrics = await SystemMetrics.find({});
      expect(metrics.length).toBe(1);
    });

    test('should get system statistics', async () => {
      const response = await request(app)
        .get('/api/system/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('system');
    });
  });

  describe('Audit Logs', () => {
    test('should get audit logs with pagination', async () => {
      // Create some test audit logs
      await AuditLog.create({
        adminId: superAdmin._id,
        action: 'test_action',
        resource: 'system',
        resourceId: 'test',
        request: {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          method: 'GET',
          endpoint: '/test',
          requestId: 'test-123'
        },
        severity: 'low',
        status: 'success'
      });

      const response = await request(app)
        .get('/api/system/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('logs');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.logs.length).toBe(1);
    });

    test('should filter audit logs by resource', async () => {
      // Create test audit logs with different resources
      await AuditLog.create({
        adminId: superAdmin._id,
        action: 'test_action',
        resource: 'system',
        resourceId: 'test',
        request: {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          method: 'GET',
          endpoint: '/test',
          requestId: 'test-123'
        },
        severity: 'low',
        status: 'success'
      });

      await AuditLog.create({
        adminId: superAdmin._id,
        action: 'test_action',
        resource: 'user',
        resourceId: 'test',
        request: {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          method: 'GET',
          endpoint: '/test',
          requestId: 'test-124'
        },
        severity: 'low',
        status: 'success'
      });

      const response = await request(app)
        .get('/api/system/audit?resource=system')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs.length).toBe(1);
      expect(response.body.data.logs[0].resource).toBe('system');
    });

    test('should generate security report', async () => {
      // Create some security-related audit logs
      await AuditLog.create({
        adminId: superAdmin._id,
        action: 'login_failed',
        resource: 'auth',
        resourceId: 'test',
        request: {
          ipAddress: '192.168.1.100',
          userAgent: 'test-agent',
          method: 'POST',
          endpoint: '/auth/login',
          requestId: 'test-125'
        },
        severity: 'high',
        status: 'failed'
      });

      const response = await request(app)
        .get('/api/system/security/report?days=7')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('report');
      expect(response.body.data.report).toHaveProperty('summary');
    });
  });

  describe('System Models', () => {
    test('SystemSettings model should create default settings', async () => {
      await SystemSettings.createDefaults(superAdmin._id);
      
      const settings = await SystemSettings.find({});
      expect(settings.length).toBeGreaterThan(0);
      
      // Check for specific default settings
      const siteName = await SystemSettings.findOne({ category: 'general', key: 'site_name' });
      expect(siteName).toBeTruthy();
      expect(siteName.value).toBe('Admin Dashboard');
    });

    test('SystemSettings model should update setting with history', async () => {
      await SystemSettings.createDefaults(superAdmin._id);
      
      const originalSetting = await SystemSettings.findOne({ category: 'general', key: 'site_name' });
      const originalValue = originalSetting.value;
      
      const updatedSetting = await SystemSettings.updateSetting(
        'general',
        'site_name',
        'New Site Name',
        superAdmin._id,
        'Test update'
      );
      
      expect(updatedSetting.value).toBe('New Site Name');
      expect(updatedSetting.history.length).toBe(1);
      expect(updatedSetting.history[0].value).toBe(originalValue);
      expect(updatedSetting.version).toBe(2);
    });

    test('SystemMetrics model should record metrics', async () => {
      const metricsData = {
        timestamp: new Date(),
        server: {
          uptime: 3600,
          memory: { used: 1000000, total: 2000000, percentage: 50 },
          cpu: { usage: 25, loadAverage: [0.5, 0.3, 0.2] }
        },
        database: {
          connections: { active: 1, available: 10, total: 10 },
          storage: { dataSize: 1000000, indexSize: 500000, totalSize: 1500000 }
        },
        application: {
          requests: { total: 100, successful: 95, failed: 5, avgResponseTime: 200 },
          users: { active: 10, concurrent: 5, totalSessions: 10 },
          errors: { total: 5, critical: 0, warnings: 2 }
        },
        business: {
          orders: { total: 50, completed: 45, pending: 3, cancelled: 2 },
          users: { registered: 100, active: 80, suspended: 5 },
          products: { total: 200, active: 180, outOfStock: 10 }
        }
      };
      
      const metrics = await SystemMetrics.recordMetrics(metricsData);
      
      expect(metrics).toBeTruthy();
      expect(metrics.server.cpu.usage).toBe(25);
      expect(metrics.application.users.active).toBe(10);
    });

    test('SystemMetrics model should get current health', async () => {
      // Record some metrics first
      await SystemMetrics.recordMetrics({
        timestamp: new Date(),
        server: {
          uptime: 3600,
          memory: { used: 1000000, total: 2000000, percentage: 50 },
          cpu: { usage: 25, loadAverage: [0.5, 0.3, 0.2] }
        },
        database: {
          connections: { active: 1, available: 10, total: 10 },
          storage: { dataSize: 1000000, indexSize: 500000, totalSize: 1500000 }
        },
        application: {
          requests: { total: 100, successful: 95, failed: 5, avgResponseTime: 200 },
          users: { active: 10, concurrent: 5, totalSessions: 10 },
          errors: { total: 5, critical: 0, warnings: 2 }
        },
        business: {
          orders: { total: 50, completed: 45, pending: 3, cancelled: 2 },
          users: { registered: 100, active: 80, suspended: 5 },
          products: { total: 200, active: 180, outOfStock: 10 }
        }
      });
      
      const health = await SystemMetrics.getCurrentHealth();
      
      expect(health).toBeTruthy();
      expect(health.status).toBe('healthy');
      expect(health.issues).toBeInstanceOf(Array);
    });
  });
});