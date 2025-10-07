const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const User = require('../models/User');
const { AdminUser, AdminRole } = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');
const userController = require('../controllers/userController');
const userRoutes = require('../routes/users');
const authService = require('../services/authService');

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware for testing
app.use((req, res, next) => {
    req.admin = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@admin.com',
        role: {
            name: 'Super Admin',
            level: 1,
            permissions: [
                { resource: 'users', actions: ['create', 'read', 'update', 'delete'] }
            ]
        }
    };
    req.adminId = req.admin._id;
    req.ip = '127.0.0.1';
    next();
});

// Create simplified routes for testing without complex middleware
app.get('/api/users', userController.getUsers);
app.get('/api/users/search', userController.searchUsers);
app.get('/api/users/:userId', userController.getUserById);
app.put('/api/users/:userId', userController.updateUser);
app.patch('/api/users/:userId/status', userController.updateUserStatus);
app.post('/api/users/:userId/flags', userController.addUserFlag);
app.patch('/api/users/:userId/flags/:flagId/resolve', userController.resolveUserFlag);
app.post('/api/users/:userId/notes', userController.addUserNote);
app.get('/api/users/:userId/activity', userController.getUserActivity);
app.get('/api/users/:userId/analytics', userController.getUserAnalytics);
app.delete('/api/users/:userId', userController.deleteUser);

describe('User Management System', () => {
    let mongoServer;
    let testUser;
    let testAdmin;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Create test admin role
        const adminRole = await AdminRole.create({
            name: 'Super Admin',
            level: 1,
            permissions: [
                { resource: 'users', actions: ['create', 'read', 'update', 'delete'] }
            ],
            canCreateSubAdmins: true
        });

        // Create test admin
        testAdmin = await AdminUser.create({
            email: 'test@admin.com',
            passwordHash: 'hashedpassword',
            role: adminRole._id,
            profile: {
                firstName: 'Test',
                lastName: 'Admin'
            }
        });
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear collections before each test
        await User.deleteMany({});
        await AuditLog.deleteMany({});

        // Create test user
        testUser = await User.create({
            customerId: 'TEST001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            status: 'active',
            registrationDate: new Date(),
            analytics: {
                totalOrders: 5,
                totalSpent: 1000,
                averageOrderValue: 200,
                segmentation: 'active'
            },
            activity: {
                loginCount: 10,
                lastLogin: new Date(),
                pageViews: 50
            }
        });
    });

    describe('Enhanced User Model', () => {
        test('should create user with enhanced fields', async () => {
            const user = await User.create({
                customerId: 'TEST002',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                status: 'active',
                analytics: {
                    totalOrders: 3,
                    totalSpent: 500,
                    segmentation: 'new'
                },
                activity: {
                    loginCount: 2,
                    pageViews: 15
                }
            });

            expect(user.customerId).toBe('TEST002');
            expect(user.fullName).toBe('Jane Smith');
            expect(user.analytics.segmentation).toBe('new');
            expect(user.activity.loginCount).toBe(2);
        });

        test('should calculate engagement score', () => {
            const score = testUser.calculateEngagementScore();
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(100);
        });

        test('should update user segmentation', () => {
            testUser.updateSegmentation();
            expect(['new', 'active', 'loyal', 'at_risk', 'churned', 'vip']).toContain(testUser.analytics.segmentation);
        });

        test('should add and resolve flags', async () => {
            await testUser.addFlag({
                type: 'suspicious_activity',
                reason: 'Multiple failed login attempts',
                severity: 'medium'
            }, testAdmin._id);

            expect(testUser.flags).toHaveLength(1);
            expect(testUser.flags[0].type).toBe('suspicious_activity');
            expect(testUser.flags[0].resolved).toBe(false);

            await testUser.resolveFlag(testUser.flags[0]._id, testAdmin._id, 'Resolved after investigation');
            expect(testUser.flags[0].resolved).toBe(true);
        });
    });

    describe('User API Endpoints', () => {
        test('should get all users with pagination', async () => {
            // Create additional test users
            await User.create([
                {
                    customerId: 'TEST003',
                    firstName: 'Alice',
                    lastName: 'Johnson',
                    email: 'alice@example.com',
                    status: 'active'
                },
                {
                    customerId: 'TEST004',
                    firstName: 'Bob',
                    lastName: 'Wilson',
                    email: 'bob@example.com',
                    status: 'suspended'
                }
            ]);

            const response = await request(app)
                .get('/api/users')
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toHaveLength(3);
            expect(response.body.data.pagination.totalUsers).toBe(3);
        });

        test('should filter users by status', async () => {
            await User.create({
                customerId: 'TEST005',
                firstName: 'Charlie',
                lastName: 'Brown',
                email: 'charlie@example.com',
                status: 'suspended'
            });

            const response = await request(app)
                .get('/api/users')
                .query({ status: 'suspended' });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toHaveLength(1);
            expect(response.body.data.users[0].status).toBe('suspended');
        });

        test('should search users by name or email', async () => {
            const response = await request(app)
                .get('/api/users')
                .query({ search: 'john' });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toHaveLength(1);
            expect(response.body.data.users[0].firstName.toLowerCase()).toContain('john');
        });

        test('should get single user by ID', async () => {
            const response = await request(app)
                .get(`/api/users/${testUser._id}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user._id).toBe(testUser._id.toString());
            expect(response.body.data.user.email).toBe('john.doe@example.com');
        });

        test('should update user information', async () => {
            const updateData = {
                firstName: 'Johnny',
                phone: '+9876543210',
                status: 'active'
            };

            const response = await request(app)
                .put(`/api/users/${testUser._id}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.firstName).toBe('Johnny');
            expect(response.body.data.user.phone).toBe('+9876543210');
        });

        test('should update user status', async () => {
            const response = await request(app)
                .patch(`/api/users/${testUser._id}/status`)
                .send({
                    status: 'suspended',
                    reason: 'Policy violation'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.status).toBe('suspended');
        });

        test('should add flag to user', async () => {
            const flagData = {
                type: 'suspicious_activity',
                reason: 'Unusual login pattern detected',
                severity: 'medium'
            };

            const response = await request(app)
                .post(`/api/users/${testUser._id}/flags`)
                .send(flagData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.flags).toHaveLength(1);
            expect(response.body.data.user.flags[0].type).toBe('suspicious_activity');
        });

        test('should add note to user', async () => {
            const noteData = {
                content: 'Customer contacted support regarding account issues',
                isPrivate: false
            };

            const response = await request(app)
                .post(`/api/users/${testUser._id}/notes`)
                .send(noteData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.notes).toHaveLength(1);
            expect(response.body.data.user.notes[0].content).toBe(noteData.content);
        });

        test('should get user analytics', async () => {
            const response = await request(app)
                .get(`/api/users/${testUser._id}/analytics`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.analytics).toHaveProperty('totalOrders');
            expect(response.body.data.analytics).toHaveProperty('totalSpent');
            expect(response.body.data.analytics).toHaveProperty('engagementScore');
        });

        test('should handle user not found', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/users/${nonExistentId}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });
    });

    describe('Advanced Search and Filtering', () => {
        beforeEach(async () => {
            // Create diverse test data
            await User.create([
                {
                    customerId: 'VIP001',
                    firstName: 'Premium',
                    lastName: 'Customer',
                    email: 'premium@example.com',
                    status: 'active',
                    analytics: {
                        totalOrders: 50,
                        totalSpent: 10000,
                        segmentation: 'vip'
                    },
                    tags: ['vip', 'high-value']
                },
                {
                    customerId: 'NEW001',
                    firstName: 'New',
                    lastName: 'User',
                    email: 'newuser@example.com',
                    status: 'active',
                    analytics: {
                        totalOrders: 0,
                        totalSpent: 0,
                        segmentation: 'new'
                    },
                    emailVerified: false
                },
                {
                    customerId: 'RISK001',
                    firstName: 'At',
                    lastName: 'Risk',
                    email: 'atrisk@example.com',
                    status: 'active',
                    analytics: {
                        totalOrders: 5,
                        totalSpent: 500,
                        segmentation: 'at_risk'
                    },
                    flags: [{
                        type: 'suspicious_activity',
                        reason: 'Unusual spending pattern',
                        severity: 'medium',
                        resolved: false
                    }]
                }
            ]);
        });

        test('should filter by spending range', async () => {
            const response = await request(app)
                .get('/api/users')
                .query({ minSpent: 5000 });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toHaveLength(1);
            expect(response.body.data.users[0].analytics.totalSpent).toBeGreaterThanOrEqual(5000);
        });

        test('should filter by segmentation', async () => {
            const response = await request(app)
                .get('/api/users')
                .query({ segmentation: 'vip' });

            expect(response.status).toBe(200);
            expect(response.body.data.users).toHaveLength(1);
            expect(response.body.data.users[0].analytics.segmentation).toBe('vip');
        });

        test('should filter users with flags', async () => {
            const response = await request(app)
                .get('/api/users')
                .query({ hasFlags: 'true' });

            expect(response.status).toBe(200);
            expect(response.body.data.users.length).toBeGreaterThan(0);
            expect(response.body.data.users[0].flags.length).toBeGreaterThan(0);
        });

        test('should filter by email verification status', async () => {
            const response = await request(app)
                .get('/api/users')
                .query({ emailVerified: 'false' });

            expect(response.status).toBe(200);
            expect(response.body.data.users.length).toBeGreaterThan(0);
            expect(response.body.data.users[0].emailVerified).toBe(false);
        });

        test('should sort users by total spent', async () => {
            const response = await request(app)
                .get('/api/users')
                .query({ sortBy: 'analytics.totalSpent', sortOrder: 'desc' });

            expect(response.status).toBe(200);
            const users = response.body.data.users;
            expect(users.length).toBeGreaterThan(1);

            // Check if sorted in descending order
            for (let i = 0; i < users.length - 1; i++) {
                expect(users[i].analytics.totalSpent).toBeGreaterThanOrEqual(users[i + 1].analytics.totalSpent);
            }
        });
    });

    describe('User Statistics', () => {
        test('should get user statistics', async () => {
            // Create users with different statuses
            await User.create([
                {
                    customerId: 'STAT001',
                    firstName: 'Active',
                    lastName: 'User1',
                    email: 'active1@example.com',
                    status: 'active',
                    analytics: { totalSpent: 100, totalOrders: 2 }
                },
                {
                    customerId: 'STAT002',
                    firstName: 'Suspended',
                    lastName: 'User1',
                    email: 'suspended1@example.com',
                    status: 'suspended',
                    analytics: { totalSpent: 200, totalOrders: 3 }
                }
            ]);

            const stats = await User.getUserStats();

            expect(stats).toHaveProperty('totalUsers');
            expect(stats).toHaveProperty('activeUsers');
            expect(stats).toHaveProperty('suspendedUsers');
            expect(stats).toHaveProperty('totalRevenue');
            expect(stats.totalUsers).toBeGreaterThan(0);
        });
    });
});