const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const User = require('../models/User');
const { AdminUser } = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');

// Create a minimal test app
const app = express();
app.use(express.json());

// Mock middleware
app.use((req, res, next) => {
  req.admin = {
    _id: new mongoose.Types.ObjectId(),
    email: 'test@admin.com',
    role: { name: 'SuperAdmin', level: 1 }
  };
  req.ip = '127.0.0.1';
  req.get = () => 'test-agent';
  next();
});

// Import the controller functions directly
const {
  bulkUpdateUsers,
  bulkUpdateUserStatus,
  bulkDeleteUsers,
  exportUsersCSV,
  getCSVTemplate
} = require('../controllers/userController');

// Add routes
app.post('/bulk/update', bulkUpdateUsers);
app.post('/bulk/status', bulkUpdateUserStatus);
app.post('/bulk/delete', bulkDeleteUsers);
app.post('/export/csv', exportUsersCSV);
app.get('/template', getCSVTemplate);

describe('Bulk Operations Integration Test', () => {
  let mongoServer;
  let testUsers = [];

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await AuditLog.deleteMany({});

    // Create test users
    testUsers = [];
    for (let i = 1; i <= 3; i++) {
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

  test('should perform bulk user updates', async () => {
    const updates = [
      {
        userId: testUsers[0]._id.toString(),
        data: { firstName: 'UpdatedUser1' }
      },
      {
        userId: testUsers[1]._id.toString(),
        data: { firstName: 'UpdatedUser2' }
      }
    ];

    const response = await request(app)
      .post('/bulk/update')
      .send({ updates })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.totalSuccessful).toBe(2);
    expect(response.body.data.totalFailed).toBe(0);

    // Verify users were updated
    const updatedUser1 = await User.findById(testUsers[0]._id);
    const updatedUser2 = await User.findById(testUsers[1]._id);
    
    expect(updatedUser1.firstName).toBe('UpdatedUser1');
    expect(updatedUser2.firstName).toBe('UpdatedUser2');
  });

  test('should perform bulk status updates', async () => {
    const userIds = [testUsers[0]._id.toString(), testUsers[1]._id.toString()];
    
    const response = await request(app)
      .post('/bulk/status')
      .send({ 
        userIds, 
        status: 'suspended',
        reason: 'Test suspension'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.totalSuccessful).toBe(2);

    // Verify status was updated
    const updatedUser1 = await User.findById(testUsers[0]._id);
    const updatedUser2 = await User.findById(testUsers[1]._id);
    
    expect(updatedUser1.status).toBe('suspended');
    expect(updatedUser2.status).toBe('suspended');
  });

  test('should perform bulk delete (soft delete)', async () => {
    const userIds = [testUsers[0]._id.toString()];
    
    const response = await request(app)
      .post('/bulk/delete')
      .send({ 
        userIds,
        reason: 'Test deletion'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.totalSuccessful).toBe(1);

    // Verify user was soft deleted
    const deletedUser = await User.findById(testUsers[0]._id);
    expect(deletedUser.status).toBe('inactive');
  });

  test('should export users to CSV', async () => {
    const response = await request(app)
      .post('/export/csv')
      .send({
        fields: ['customerId', 'firstName', 'lastName', 'email'],
        filename: 'test_export.csv'
      })
      .expect(200);

    expect(response.headers['content-type']).toContain('application/octet-stream');
    expect(response.headers['content-disposition']).toContain('test_export.csv');
  });

  test('should download CSV template', async () => {
    const response = await request(app)
      .get('/template')
      .expect(200);

    expect(response.headers['content-type']).toContain('application/octet-stream');
    expect(response.headers['content-disposition']).toContain('user_import_template.csv');
  });

  test('should handle partial failures in bulk operations', async () => {
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
      .post('/bulk/update')
      .send({ updates })
      .expect(207); // Multi-status

    expect(response.body.success).toBe(false);
    expect(response.body.data.totalSuccessful).toBe(1);
    expect(response.body.data.totalFailed).toBe(1);
    expect(response.body.data.failed[0].error).toBe('User not found');
  });
});