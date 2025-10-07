const mongoose = require('mongoose');
const { AdminUser, AdminRole } = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initializeAdminSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Create default admin roles
    console.log('Creating default admin roles...');
    await AdminUser.createDefaultRoles();
    console.log('Default admin roles created successfully');

    // Get Super Admin role
    const superAdminRole = await AdminRole.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      throw new Error('Super Admin role not found');
    }

    // Check if super admin already exists
    const existingSuperAdmin = await AdminUser.findOne({ 
      role: superAdminRole._id 
    });

    if (existingSuperAdmin) {
      console.log('Super Admin already exists:', existingSuperAdmin.email);
    } else {
      // Create default super admin
      const defaultSuperAdmin = new AdminUser({
        email: 'admin@cultureaft.com',
        passwordHash: 'admin123', // This will be hashed by the pre-save middleware
        role: superAdminRole._id,
        profile: {
          firstName: 'Culture',
          lastName: 'Admin'
        },
        metadata: {
          department: 'Administration',
          notes: 'Default super admin account created during system initialization'
        }
      });

      await defaultSuperAdmin.save();
      console.log('Default Super Admin created successfully');
      console.log('Email: admin@cultureaft.com');
      console.log('Password: admin123');
      console.log('Please change the password after first login');

      // Log the admin creation
      await AuditLog.logAction({
        adminId: defaultSuperAdmin._id,
        action: 'admin_create',
        resource: 'admin',
        resourceId: defaultSuperAdmin._id.toString(),
        metadata: {
          reason: 'System initialization',
          notes: 'Default super admin account created'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        severity: 'medium'
      });
    }

    // Create indexes (handle gracefully if they already exist)
    console.log('Creating database indexes...');
    try {
      await AdminUser.createIndexes();
      await AdminRole.createIndexes();
      await AuditLog.createIndexes();
      console.log('Database indexes created successfully');
    } catch (error) {
      if (error.code === 86) { // IndexKeySpecsConflict
        console.log('Some indexes already exist, skipping...');
      } else {
        console.warn('Warning creating indexes:', error.message);
      }
    }

    console.log('Admin system initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing admin system:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeAdminSystem();
}

module.exports = initializeAdminSystem;