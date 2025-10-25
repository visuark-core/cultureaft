const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
const Permission = require('../models/Permission');
const AuditLog = require('../models/AuditLog');
require('dotenv').config();

async function initializeAdminSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cultureaft');
    console.log('Connected to MongoDB');

    // Create indexes for all models
    console.log('Creating database indexes...');
    
    await AdminUser.createIndexes();
    console.log('✓ AdminUser indexes created');
    
    await Permission.createIndexes();
    console.log('✓ Permission indexes created');
    
    await AuditLog.createIndexes();
    console.log('✓ AuditLog indexes created');

    // Initialize default permissions
    console.log('Initializing default permissions...');
    const defaultPermissions = Permission.getDefaultPermissions();
    
    for (const permissionData of defaultPermissions) {
      const existingPermission = await Permission.findOne({ name: permissionData.name });
      if (!existingPermission) {
        // Create a system admin user for initial permissions (will be created later)
        const permission = new Permission({
          ...permissionData,
          createdBy: new mongoose.Types.ObjectId() // Temporary ID
        });
        await permission.save();
        console.log(`✓ Created permission: ${permissionData.name}`);
      }
    }

    // Check if super admin exists
    const existingSuperAdmin = await AdminUser.findOne({ 'role.name': 'super_admin' });
    
    if (!existingSuperAdmin) {
      console.log('No super admin found. Creating default super admin...');
      
      const defaultRoles = AdminUser.getDefaultRoles();
      const superAdminRole = defaultRoles.super_admin;
      
      // Check if email already exists
      const existingEmailUser = await AdminUser.findOne({ 
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@cultureaft.com' 
      });
      
      if (existingEmailUser) {
        console.log('✓ Admin user with this email already exists, updating to super admin role...');
        existingEmailUser.role = superAdminRole;
        await existingEmailUser.save();
        console.log(`✓ Updated existing admin to super admin: ${existingEmailUser.email}`);
      } else {
        const superAdmin = new AdminUser({
          email: process.env.SUPER_ADMIN_EMAIL || 'admin@cultureaft.com',
          passwordHash: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!',
          role: superAdminRole,
          profile: {
            firstName: 'Super',
            lastName: 'Admin'
          },
          audit: {
            createdBy: null, // Self-created
            createdAt: new Date(),
            updatedAt: new Date()
          },
          isActive: true
        });

        await superAdmin.save();
        console.log('✓ Super admin created successfully');
        console.log(`Email: ${superAdmin.email}`);
        console.log('Password: SuperAdmin123! (Please change this immediately)');

        // Log the super admin creation
        await AuditLog.logAction(
          superAdmin._id,
          'create',
          'admins',
          {
            resourceId: superAdmin._id.toString(),
            ipAddress: 'system',
            userAgent: 'initialization-script',
            severity: 'high',
            description: 'Super admin account created during system initialization'
          }
        );
      }

      // Update permissions to have the correct createdBy
      const superAdminUser = await AdminUser.findOne({ 'role.name': 'super_admin' });
      await Permission.updateMany(
        { createdBy: { $exists: false } },
        { createdBy: superAdminUser._id }
      );
    } else {
      console.log('✓ Super admin already exists');
    }

    // Verify system integrity
    console.log('Verifying system integrity...');
    
    const adminCount = await AdminUser.countDocuments();
    const permissionCount = await Permission.countDocuments();
    const auditLogCount = await AuditLog.countDocuments();
    
    console.log(`✓ System verification complete:`);
    console.log(`  - Admin users: ${adminCount}`);
    console.log(`  - Permissions: ${permissionCount}`);
    console.log(`  - Audit logs: ${auditLogCount}`);

    console.log('\n🎉 Admin system initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing admin system:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeAdminSystem();
}

module.exports = initializeAdminSystem;