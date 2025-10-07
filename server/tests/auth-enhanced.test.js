const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const authService = require('../services/authService');
const { AdminUser, AdminRole } = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');

describe('Enhanced Authentication and Authorization Tests', () => {
  let mongoServer;
  let testRoles = {};
  let testAdmins = {};

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test roles with hierarchical structure
    testRoles.superAdmin = await AdminRole.create({
      name: 'Super Admin',
      level: 1,
      canCreateSubAdmins: true,
      permi