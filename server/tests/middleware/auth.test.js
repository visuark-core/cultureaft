const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const {
  authenticateToken,
  requireRole,
  requirePermission,
  auditLogger,
  enforceHierarchy,
  bulkOperationProtection,
  checkHierarchicalPermission
} = require('../../middleware/auth');

const { AdminUser, AdminRole } = require('../../models/AdminUser');
const AuditLog = require('../../models/AuditLog');
const authService = require('../../services/authService');

describe('Enhanced Auth Middleware', () => {
  let mongoServer;
  let app;
  let superAdminRole, adminRole, moderatorRole;
  let superAdmin, admin, moderator;
  let superAdminToken, adminToken, moderatorToken;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test app
    app = express();
    app.use(express.json());

    // Create test roles
    superAdminRole = await AdminRole.create({
      name: 'Super Admin',
      level: 1,
      canCreateSubAdmins: true,
      permissions: [
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'admin', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'system', actions: ['create', 'read', 'update', 'delete'] }
      ]
    });

    adminRole = await AdminRole.create({
      name: 'Admin',
      level: 2,
      canCreateSubAdmins: true,
      permissions: [
        { resource: 'users', actions: ['read', 'update'] },
        { resource: 'products', actions: ['create', 'read', 'update', 'delete'] }
      ]
    });

    moderatorRole = await AdminRole.create({
      name: 'Moderator',
      level: 3,
      canCreateSubAdmins: false,
      permissions: [
        { resource: 'users', actions: ['read'] },
        { resource: 'content', actions: ['read', 'moderate'] }
      ]
    });

    // Create test admin users
    superAdmin = await AdminUser.create({
      email: 'superadmin@test.com',
      passwordHash: 'hashedpassword123',
      role: superAdminRole._id,
      profile: { firstName: 'Super', lastName: 'Admin' }
    });

    admin = await AdminUser.create({
      email: 'admin@test.com',
      passwordHash: 'hashedpassword123',
      role: adminRole._id,
      profile: { firstName: 'Admin', lastName: 'User' }
    });

    moderator = await AdminUser.create({
      email: 'moderator@test.com',
      passwordHash: 'hashedpassword123',
      role: moderatorRole._id,
      profile: { firstName: 'Moderator', lastName: 'User' }
    });

    // Generate tokens
    superAdminToken = authService.generateAccessToken({
      adminId: superAdmin._id,
      email: superAdmin.email,
      role: superAdminRole.name,
      level: superAdminRole.level,
      permissions: superAdminRole.permissions
    });

    adminToken = authService.generateAccessToken({
      adminId: admin._id,
      email: admin.email,
      role: adminRole.name,
      level: adminRole.level,
      permissions: adminRole.permissions
    });

    moderatorToken = authService.generateAccessToken({
      adminId: moderator._id,
      email: moderator.email,
      role: moderatorRole.name,
      level: moderatorRole.level,
      permissions: moderatorRole.permissions
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear audit logs before each test
    await AuditLog.deleteMany({});
  });

  describe('Role-based Access Control', () => {
    beforeEach(() => {
      app.get('/test-super-admin', 
        authenticateToken, 
        requireRole(1), 
        (req, res) => res.json({ success: true })
      );
      
      app.get('/test-admin', 
        authenticateToken, 
        requireRole(2), 
        (req, res) => res.json({ success: true })
      );
      
      app.get('/test-moderator', 
        authenticateToken, 
        requireRole(3), 
        (req, res) => res.json({ success: true })
      );
    });

    test('should allow super admin access to all levels', async () => {
      const responses = await Promise.all([
        request(app).get('/test-super-admin').set('Authorization', `Bearer ${superAdminToken}`),
        request(app).get('/test-admin').set('Authorization', `Bearer ${superAdminToken}`),
        request(app).get('/test-moderator').set('Authorization', `Bearer ${superAdminToken}`)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('should restrict admin access to appropriate levels', async () => {
      const superAdminResponse = await request(app)
        .get('/test-super-admin')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const adminResponse = await request(app)
        .get('/test-admin')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const moderatorResponse = await request(app)
        .get('/test-moderator')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(superAdminResponse.status).toBe(403);
      expect(adminResponse.status).toBe(200);
      expect(moderatorResponse.status).toBe(200);
    });

    test('should restrict moderator access to appropriate levels', async () => {
      const superAdminResponse = await request(app)
        .get('/test-super-admin')
        .set('Authorization', `Bearer ${moderatorToken}`);
      
      const adminResponse = await request(app)
        .get('/test-admin')
        .set('Authorization', `Bearer ${moderatorToken}`);
      
      const moderatorResponse = await request(app)
        .get('/test-moderator')
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(superAdminResponse.status).toBe(403);
      expect(adminResponse.status).toBe(403);
      expect(moderatorResponse.status).toBe(200);
    });
  });

  describe('Permission-based Access Control', () => {
    beforeEach(() => {
      app.get('/test-user-read', 
        authenticateToken, 
        requirePermission('users', 'read'), 
        (req, res) => res.json({ success: true })
      );
      
      app.post('/test-user-create', 
        authenticateToken, 
        requirePermission('users', 'create'), 
        (req, res) => res.json({ success: true })
      );
      
      app.delete('/test-user-delete', 
        authenticateToken, 
        requirePermission('users', 'delete'), 
        (req, res) => res.json({ success: true })
      );
    });

    test('should allow access based on explicit permissions', async () => {
      // Admin has read and update permissions for users
      const readResponse = await request(app)
        .get('/test-user-read')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(readResponse.status).toBe(200);

      // Admin doesn't have create permission for users
      const createResponse = await request(app)
        .post('/test-user-create')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(createResponse.status).toBe(403);
    });

    test('should allow super admin access through hierarchical inheritance', async () => {
      const responses = await Promise.all([
        request(app).get('/test-user-read').set('Authorization', `Bearer ${superAdminToken}`),
        request(app).post('/test-user-create').set('Authorization', `Bearer ${superAdminToken}`),
        request(app).delete('/test-user-delete').set('Authorization', `Bearer ${superAdminToken}`)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('should restrict moderator access appropriately', async () => {
      // Moderator has read permission for users
      const readResponse = await request(app)
        .get('/test-user-read')
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(readResponse.status).toBe(200);

      // Moderator doesn't have create or delete permissions
      const createResponse = await request(app)
        .post('/test-user-create')
        .set('Authorization', `Bearer ${moderatorToken}`);

      const deleteResponse = await request(app)
        .delete('/test-user-delete')
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(createResponse.status).toBe(403);
      expect(deleteResponse.status).toBe(403);
    });
  });

  describe('Hierarchical Permission Inheritance', () => {
    test('should correctly implement hierarchical permissions', async () => {
      // Test super admin (level 1) - should have all permissions
      const superAdminResult = await checkHierarchicalPermission(superAdminRole, 'users', 'delete');
      expect(superAdminResult).toBe(true);

      // Test admin (level 2) - should have most permissions except restricted ones
      const adminUserResult = await checkHierarchicalPermission(adminRole, 'users', 'read');
      expect(adminUserResult).toBe(true);

      const adminSystemResult = await checkHierarchicalPermission(adminRole, 'system', 'delete');
      expect(adminSystemResult).toBe(false);

      // Test moderator (level 3) - should have limited permissions
      const moderatorUserResult = await checkHierarchicalPermission(moderatorRole, 'users', 'read');
      expect(moderatorUserResult).toBe(true);

      const moderatorUserUpdateResult = await checkHierarchicalPermission(moderatorRole, 'users', 'update');
      expect(moderatorUserUpdateResult).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    beforeEach(() => {
      app.post('/test-audit', 
        authenticateToken, 
        auditLogger('test_action', 'test_resource'),
        (req, res) => res.json({ success: true, data: { id: 'test123' } })
      );
    });

    test('should create audit log entries for admin actions', async () => {
      await request(app)
        .post('/test-audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ testData: 'value' });

      const auditLogs = await AuditLog.find({ adminId: admin._id });
      expect(auditLogs).toHaveLength(1);

      const log = auditLogs[0];
      expect(log.action).toBe('test_action');
      expect(log.resource).toBe('test_resource');
      expect(log.resourceId).toBe('test123');
      expect(log.changes.requestData.testData).toBe('value');
      expect(log.request.method).toBe('POST');
      expect(log.status).toBe('success');
    });

    test('should log failed operations with appropriate severity', async () => {
      app.post('/test-audit-fail', 
        authenticateToken, 
        auditLogger('test_fail_action', 'test_resource'),
        (req, res) => res.status(400).json({ success: false, message: 'Test error' })
      );

      await request(app)
        .post('/test-audit-fail')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ testData: 'value' });

      const auditLogs = await AuditLog.find({ adminId: admin._id });
      expect(auditLogs).toHaveLength(1);

      const log = auditLogs[0];
      expect(log.status).toBe('failed');
      expect(log.severity).toBe('medium');
      expect(log.errorMessage).toBe('Test error');
    });
  });

  describe('Hierarchy Enforcement', () => {
    beforeEach(() => {
      app.post('/test-hierarchy', 
        authenticateToken, 
        enforceHierarchy('body.targetLevel'),
        (req, res) => res.json({ success: true })
      );
    });

    test('should prevent admins from managing equal or higher level users', async () => {
      // Admin (level 2) trying to manage super admin (level 1)
      const response = await request(app)
        .post('/test-hierarchy')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ targetLevel: 1 });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('hierarchy level');

      // Check audit log
      const auditLogs = await AuditLog.find({ action: 'HIERARCHY_VIOLATION' });
      expect(auditLogs).toHaveLength(1);
    });

    test('should allow admins to manage lower level users', async () => {
      // Admin (level 2) managing moderator (level 3)
      const response = await request(app)
        .post('/test-hierarchy')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ targetLevel: 3 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Bulk Operation Protection', () => {
    beforeEach(() => {
      app.post('/test-bulk', 
        authenticateToken, 
        bulkOperationProtection(5),
        (req, res) => res.json({ success: true })
      );
    });

    test('should reject bulk operations exceeding limits', async () => {
      const response = await request(app)
        .post('/test-bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: new Array(10).fill({ id: 'test' }) });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Bulk operation limit exceeded');

      // Check audit log
      const auditLogs = await AuditLog.find({ action: 'BULK_LIMIT_EXCEEDED' });
      expect(auditLogs).toHaveLength(1);
    });

    test('should allow bulk operations within limits', async () => {
      const response = await request(app)
        .post('/test-bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: new Array(3).fill({ id: 'test' }) });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should require higher permissions for large bulk operations', async () => {
      // Moderator (level 3) trying large bulk operation
      const response = await request(app)
        .post('/test-bulk')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ items: new Array(4).fill({ id: 'test' }) });

      expect(response.status).toBe(200); // Should pass as it's under 100 items

      // Test with more items (this would require a different test setup)
      app.post('/test-large-bulk', 
        authenticateToken, 
        bulkOperationProtection(200),
        (req, res) => res.json({ success: true })
      );

      const largeResponse = await request(app)
        .post('/test-large-bulk')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ items: new Array(150).fill({ id: 'test' }) });

      expect(largeResponse.status).toBe(403);
      expect(largeResponse.body.message).toContain('admin level permissions');
    });
  });

  describe('Security Event Logging', () => {
    test('should log permission denied events', async () => {
      app.get('/test-permission-denied', 
        authenticateToken, 
        requirePermission('system', 'delete'),
        (req, res) => res.json({ success: true })
      );

      await request(app)
        .get('/test-permission-denied')
        .set('Authorization', `Bearer ${moderatorToken}`);

      const auditLogs = await AuditLog.find({ action: 'PERMISSION_DENIED' });
      expect(auditLogs).toHaveLength(1);

      const log = auditLogs[0];
      expect(log.adminId.toString()).toBe(moderator._id.toString());
      expect(log.severity).toBe('medium');
    });

    test('should generate comprehensive security reports', async () => {
      // Create some test audit logs
      await AuditLog.create([
        {
          adminId: admin._id,
          action: 'PERMISSION_DENIED',
          resource: 'users',
          request: { ipAddress: '192.168.1.1', userAgent: 'test', method: 'GET', endpoint: '/test' },
          severity: 'medium'
        },
        {
          adminId: moderator._id,
          action: 'HIERARCHY_VIOLATION',
          resource: 'admin',
          request: { ipAddress: '192.168.1.2', userAgent: 'test', method: 'POST', endpoint: '/test' },
          severity: 'high'
        }
      ]);

      const report = await AuditLog.generateSecurityReport(1);
      
      expect(report.summary.totalLogs).toBe(2);
      expect(report.summary.securityEvents).toBe(1); // high severity
      expect(report.summary.permissionViolations).toBe(2);
      expect(report.details.suspiciousIPs).toHaveLength(2);
    });
  });
});