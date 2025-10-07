const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const { AdminUser } = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');
const fs = require('fs');
const path = require('path');

describe('Bulk User Operations API', () => {
  let mongoServer;
  let adminToken;
  let testUsers = [];
  let testAdmin;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test admin
    testAdmin = new AdminUser({
      email: 'admin@test.com',
      passwordHash: 'hashedpassword',
      role: {
        name: 'SuperAdmin',
        level: 1,
        permissions: [
          { resource: 'users', actions: ['create', 'read', 'update', 'delete'] }
        ]
      },
      profile: {
        firstName: 'Test',
        lastName: 'Admin'
      },
      isActive: true
    });
    await testAdmin.save();

    // Mock JWT token for admin
    adminToken = 'mock-admin-token';
    
    // Mock authentication middleware
    jest.spyOn(require('../middleware/auth'), 'authenticateToken').mockImplementation((req, res, next) => {
      req.admin = testAdmin;
      next();
    });
    
    jest.spyOn(require('../middleware/auth'), 'validateSession').mockImplementation((req, res, next) => {
      next();
    });
    
    jest.spyOn(require('../middleware/auth'), 'requirePermission').mockImplementation(() => (req, res, next) => {
      next();
    });
    
    jest.spyOn(require('../middleware/auth'), 'auditLogger').mockImplementation(() => (req, res, next) => {
      next();
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await AuditLog.deleteMany({});

    // Create test users
    testUsers = [];
    for (let i = 1; i <= 5; i++) {
      const user = new User({
        customerId: `TEST_USER_${i}`,
        firstName: `User${i}`,
        lastName: `Test`,
        email: `user${i}@test.com`,
        status: 'active',
        registrationDate: new Date()
      });
      await user.save();
      testUsers.push(user);
    }
  });

  afterEach(async () => {
    // Clean up any uploaded files
    const uploadsDir = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
    }
  });

  describe('POST /api/users/bulk/update', () => {
    it('should successfully update multiple users', async () => {
      const updates = [
        {
          userId: testUsers[0]._id.toString(),
          data: { firstName: 'UpdatedUser1', lastName: 'UpdatedTest' }
        },
        {
          userId: testUsers[1]._id.toString(),
          data: { firstName: 'UpdatedUser2', phone: '+1234567890' }
        }
      ];

      const response = await request(app)
        .post('/api/users/bulk/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ updates })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSuccessful).toBe(2);
      expect(response.body.data.totalFailed).toBe(0);
      expect(response.body.data.successful).toHaveLength(2);

      // Verify users were updated
      const updatedUser1 = await User.findById(testUsers[0]._id);
      const updatedUser2 = await User.findById(testUsers[1]._id);
      
      expect(updatedUser1.firstName).toBe('UpdatedUser1');
      expect(updatedUser1.lastName).toBe('UpdatedTest');
      expect(updatedUser2.firstName).toBe('UpdatedUser2');
      expect(updatedUser2.phone).toBe('+1234567890');

      // Verify audit logs were created
      const auditLogs = await AuditLog.find({ action: 'BULK_UPDATE_USER' });
      expect(auditLogs).toHaveLength(2);
    });

    it('should handle partial failures gracefully', async () => {
      const updates = [
        {
          userId: testUsers[0]._id.toString(),
          data: { firstName: 'UpdatedUser1' }
        },
        {
          userId: new mongoose.Types.ObjectId().toString(), // Non-existent user
          data: { firstName: 'NonExistentUser' }
        }
      ];

      const response = await request(app)
        .post('/api/users/bulk/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ updates })
        .expect(207); // Multi-status

      expect(response.body.success).toBe(false);
      expect(response.body.data.totalSuccessful).toBe(1);
      expect(response.body.data.totalFailed).toBe(1);
      expect(response.body.data.failed[0].error).toBe('User not found');
    });

    it('should validate input data', async () => {
      const response = await request(app)
        .post('/api/users/bulk/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ updates: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/users/bulk/status', () => {
    it('should successfully update status for multiple users', async () => {
      const userIds = [testUsers[0]._id.toString(), testUsers[1]._id.toString()];
      const status = 'suspended';
      const reason = 'Bulk suspension for testing';

      const response = await request(app)
        .post('/api/users/bulk/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds, status, reason })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSuccessful).toBe(2);
      expect(response.body.data.totalFailed).toBe(0);

      // Verify users status was updated
      const updatedUser1 = await User.findById(testUsers[0]._id);
      const updatedUser2 = await User.findById(testUsers[1]._id);
      
      expect(updatedUser1.status).toBe('suspended');
      expect(updatedUser2.status).toBe('suspended');

      // Verify flags were added for suspended users
      expect(updatedUser1.flags).toHaveLength(1);
      expect(updatedUser2.flags).toHaveLength(1);
      expect(updatedUser1.flags[0].type).toBe('manual_review');
      expect(updatedUser2.flags[0].type).toBe('manual_review');
    });

    it('should handle non-existent users', async () => {
      const userIds = [
        testUsers[0]._id.toString(),
        new mongoose.Types.ObjectId().toString()
      ];

      const response = await request(app)
        .post('/api/users/bulk/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds, status: 'suspended' })
        .expect(207);

      expect(response.body.data.totalSuccessful).toBe(1);
      expect(response.body.data.totalFailed).toBe(1);
    });
  });

  describe('POST /api/users/bulk/delete', () => {
    it('should successfully soft delete multiple users', async () => {
      const userIds = [testUsers[0]._id.toString(), testUsers[1]._id.toString()];
      const reason = 'Bulk deletion for testing';

      const response = await request(app)
        .post('/api/users/bulk/delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds, reason })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSuccessful).toBe(2);
      expect(response.body.data.totalFailed).toBe(0);

      // Verify users were soft deleted (status set to inactive)
      const deletedUser1 = await User.findById(testUsers[0]._id);
      const deletedUser2 = await User.findById(testUsers[1]._id);
      
      expect(deletedUser1.status).toBe('inactive');
      expect(deletedUser2.status).toBe('inactive');

      // Verify flags were added
      expect(deletedUser1.flags).toHaveLength(1);
      expect(deletedUser2.flags).toHaveLength(1);
      expect(deletedUser1.flags[0].severity).toBe('high');
      expect(deletedUser2.flags[0].severity).toBe('high');
    });
  });

  describe('POST /api/users/export/csv', () => {
    it('should export users to CSV with default fields', async () => {
      const response = await request(app)
        .post('/api/users/export/csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      expect(response.headers['content-type']).toContain('application/octet-stream');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export users with custom fields and filters', async () => {
      const exportData = {
        fields: ['customerId', 'firstName', 'lastName', 'email', 'status'],
        filters: { status: 'active' },
        filename: 'custom_export.csv'
      };

      const response = await request(app)
        .post('/api/users/export/csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(exportData)
        .expect(200);

      expect(response.headers['content-disposition']).toContain('custom_export.csv');
    });

    it('should handle empty results', async () => {
      const response = await request(app)
        .post('/api/users/export/csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ filters: { status: 'nonexistent' } })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No users found matching the criteria');
    });
  });

  describe('GET /api/users/import/template', () => {
    it('should download CSV import template', async () => {
      const response = await request(app)
        .get('/api/users/import/template')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/octet-stream');
      expect(response.headers['content-disposition']).toContain('user_import_template.csv');
    });
  });

  describe('POST /api/users/import/csv', () => {
    let csvFilePath;

    beforeEach(() => {
      // Create test CSV file
      const csvContent = `firstName,lastName,email,phone,status,tags
NewUser1,Test,newuser1@test.com,+1111111111,active,vip
NewUser2,Test,newuser2@test.com,+2222222222,active,premium
ExistingUser,Test,user1@test.com,+3333333333,active,updated`;

      csvFilePath = path.join(__dirname, '../uploads/test_import.csv');
      fs.writeFileSync(csvFilePath, csvContent);
    });

    it('should import new users from CSV', async () => {
      const response = await request(app)
        .post('/api/users/import/csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('csvFile', csvFilePath)
        .field('updateExisting', 'false')
        .expect(207); // Some will fail due to existing email

      expect(response.body.data.totalProcessed).toBe(3);
      expect(response.body.data.totalSuccessful).toBe(2); // 2 new users
      expect(response.body.data.totalSkipped).toBe(1); // 1 existing user

      // Verify new users were created
      const newUser1 = await User.findOne({ email: 'newuser1@test.com' });
      const newUser2 = await User.findOne({ email: 'newuser2@test.com' });
      
      expect(newUser1).toBeTruthy();
      expect(newUser2).toBeTruthy();
      expect(newUser1.firstName).toBe('NewUser1');
      expect(newUser2.firstName).toBe('NewUser2');
    });

    it('should perform dry run without creating users', async () => {
      const response = await request(app)
        .post('/api/users/import/csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('csvFile', csvFilePath)
        .field('dryRun', 'true')
        .expect(200);

      expect(response.body.data.totalProcessed).toBe(3);
      expect(response.body.data.totalSuccessful).toBe(3);
      expect(response.body.data.successful[0].action).toBe('would_create');

      // Verify no users were actually created
      const newUser1 = await User.findOne({ email: 'newuser1@test.com' });
      expect(newUser1).toBeFalsy();
    });

    it('should update existing users when updateExisting is true', async () => {
      const response = await request(app)
        .post('/api/users/import/csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('csvFile', csvFilePath)
        .field('updateExisting', 'true')
        .expect(200);

      expect(response.body.data.totalProcessed).toBe(3);
      expect(response.body.data.totalSuccessful).toBe(3);

      // Verify existing user was updated
      const updatedUser = await User.findOne({ email: 'user1@test.com' });
      expect(updatedUser.firstName).toBe('ExistingUser');
      expect(updatedUser.tags).toContain('updated');
    });

    it('should handle invalid CSV file', async () => {
      const invalidCsvPath = path.join(__dirname, '../uploads/invalid.txt');
      fs.writeFileSync(invalidCsvPath, 'not a csv file');

      const response = await request(app)
        .post('/api/users/import/csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('csvFile', invalidCsvPath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only CSV files are allowed');
    });

    it('should handle missing required fields in CSV', async () => {
      const invalidCsvContent = `firstName,lastName
IncompleteUser,Test`;

      const invalidCsvPath = path.join(__dirname, '../uploads/invalid_import.csv');
      fs.writeFileSync(invalidCsvPath, invalidCsvContent);

      const response = await request(app)
        .post('/api/users/import/csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('csvFile', invalidCsvPath)
        .expect(207);

      expect(response.body.data.totalFailed).toBe(1);
      expect(response.body.data.failed[0].error).toContain('Missing required fields');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      jest.spyOn(User, 'findById').mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/users/bulk/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          updates: [{
            userId: testUsers[0]._id.toString(),
            data: { firstName: 'Test' }
          }]
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Bulk update failed');
    });

    it('should validate authentication for all bulk operations', async () => {
      // Mock authentication failure
      jest.spyOn(require('../middleware/auth'), 'authenticateToken').mockImplementationOnce((req, res, next) => {
        res.status(401).json({ success: false, message: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/users/bulk/update')
        .send({
          updates: [{
            userId: testUsers[0]._id.toString(),
            data: { firstName: 'Test' }
          }]
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    it('should create audit logs for all bulk operations', async () => {
      const updates = [{
        userId: testUsers[0]._id.toString(),
        data: { firstName: 'AuditTest' }
      }];

      await request(app)
        .post('/api/users/bulk/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ updates })
        .expect(200);

      // Check individual operation audit log
      const individualLog = await AuditLog.findOne({ action: 'BULK_UPDATE_USER' });
      expect(individualLog).toBeTruthy();
      expect(individualLog.adminId.toString()).toBe(testAdmin._id.toString());
      expect(individualLog.resourceId).toBe(testUsers[0]._id.toString());

      // Check summary audit log
      const summaryLog = await AuditLog.findOne({ action: 'BULK_UPDATE_USERS_SUMMARY' });
      expect(summaryLog).toBeTruthy();
      expect(summaryLog.changes.totalProcessed).toBe(1);
      expect(summaryLog.changes.totalSuccessful).toBe(1);
    });
  });
});