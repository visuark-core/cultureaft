const mongoose = require('mongoose');
const { AdminUser, AdminRole } = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');
require('dotenv').config();

async function updateAdminCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Get Super Admin role
    const superAdminRole = await AdminRole.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      throw new Error('Super Admin role not found');
    }

    // Check if the new admin already exists
    let admin = await AdminUser.findByEmail('admin@cultureaft.com');
    
    if (admin) {
      console.log('Admin with email admin@cultureaft.com already exists');
      // Update password
      admin.passwordHash = 'admin123'; // Will be hashed by pre-save middleware
      await admin.save();
      console.log('Password updated successfully');
    } else {
      // Check if old admin exists and remove it
      const oldAdmin = await AdminUser.findByEmail('admin@example.com');
      if (oldAdmin) {
        await AdminUser.deleteOne({ _id: oldAdmin._id });
        console.log('Removed old admin account: admin@example.com');
      }

      // Create new admin with correct credentials
      admin = new AdminUser({
        email: 'admin@cultureaft.com',
        passwordHash: 'admin123', // This will be hashed by the pre-save middleware
        role: superAdminRole._id,
        profile: {
          firstName: 'Culture',
          lastName: 'Admin'
        },
        metadata: {
          department: 'Administration',
          notes: 'Super admin account for CultureAft platform'
        }
      });

      await admin.save();
      console.log('New Super Admin created successfully');
    }

    console.log('=== Admin Credentials ===');
    console.log('Email: admin@cultureaft.com');
    console.log('Password: admin123');
    console.log('Role: Super Admin');
    console.log('========================');

    // Log the admin update
    await AuditLog.logAction({
      adminId: admin._id,
      action: 'admin_update',
      resource: 'admin',
      resourceId: admin._id.toString(),
      metadata: {
        reason: 'Admin credentials update',
        notes: 'Updated admin email and password'
      },
      ipAddress: '127.0.0.1',
      userAgent: 'System',
      severity: 'medium'
    });

    console.log('Admin credentials updated successfully!');
    
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run update if called directly
if (require.main === module) {
  updateAdminCredentials();
}

module.exports = updateAdminCredentials;