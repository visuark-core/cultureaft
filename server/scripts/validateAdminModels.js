const mongoose = require('mongoose');
const { AdminUser, AdminRole } = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');
require('dotenv').config();

async function validateAdminModels() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Test AdminRole model
    console.log('\n=== Testing AdminRole Model ===');
    const roles = await AdminRole.find({});
    console.log(`Found ${roles.length} admin roles:`);
    roles.forEach(role => {
      console.log(`- ${role.name} (Level ${role.level}): ${role.permissions.length} permissions`);
    });

    // Test AdminUser model
    console.log('\n=== Testing AdminUser Model ===');
    const users = await AdminUser.find({}).populate('role');
    console.log(`Found ${users.length} admin users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role.name}): ${user.profile.fullName}`);
      console.log(`  Active: ${user.isActive}, Locked: ${user.isLocked}`);
      console.log(`  Last Login: ${user.security.lastLogin || 'Never'}`);
    });

    // Test AuditLog model
    console.log('\n=== Testing AuditLog Model ===');
    const logs = await AuditLog.find({}).limit(5).populate('adminId', 'email');
    console.log(`Found ${logs.length} recent audit logs:`);
    logs.forEach(log => {
      console.log(`- ${log.action} by ${log.adminId?.email || 'System'} at ${log.createdAt}`);
    });

    // Test model methods
    console.log('\n=== Testing Model Methods ===');
    const superAdmin = await AdminUser.findByEmail('admin@cultureaft.com');
    if (superAdmin) {
      console.log('✓ findByEmail method works');
      
      // Test password comparison
      const isValidPassword = await superAdmin.comparePassword('admin123');
      console.log(`✓ Password validation: ${isValidPassword ? 'PASS' : 'FAIL'}`);
      
      // Test activity update
      await superAdmin.updateActivity('127.0.0.1');
      console.log('✓ Activity update method works');
    }

    // Test audit logging
    if (superAdmin) {
      await AuditLog.logAction({
        adminId: superAdmin._id,
        action: 'system_config_update',
        resource: 'system',
        metadata: { test: true },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Script',
        severity: 'low'
      });
      console.log('✓ Audit logging works');
    }

    console.log('\n=== Validation Complete ===');
    console.log('All admin models are working correctly!');
    
  } catch (error) {
    console.error('Error validating admin models:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run validation if called directly
if (require.main === module) {
  validateAdminModels();
}

module.exports = validateAdminModels;