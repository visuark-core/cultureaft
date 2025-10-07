const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SystemSettings = require('../models/SystemSettings');
const AdminUser = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');

async function initializeSystemAdmin() {
  try {
    console.log('Initializing System Administration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find a super admin to use for initialization
    const superAdmin = await AdminUser.findOne({ 'role.level': 1 });
    
    if (!superAdmin) {
      console.error('No super admin found. Please create a super admin first.');
      process.exit(1);
    }

    console.log(`Using super admin: ${superAdmin.email}`);

    // Initialize default system settings
    console.log('Creating default system settings...');
    await SystemSettings.createDefaults(superAdmin._id);
    console.log('Default system settings created');

    // Log the initialization
    await AuditLog.logAction({
      adminId: superAdmin._id,
      action: 'system_admin_initialize',
      resource: 'system',
      resourceId: 'initialization',
      metadata: {
        reason: 'System administration initialization script',
        timestamp: new Date()
      },
      ipAddress: '127.0.0.1',
      userAgent: 'System Script',
      method: 'SCRIPT',
      endpoint: '/scripts/initializeSystemAdmin',
      severity: 'high'
    });

    console.log('System administration initialized successfully!');
    
    // Display summary
    const settingsCount = await SystemSettings.countDocuments();
    console.log(`\nSummary:`);
    console.log(`- System settings created: ${settingsCount}`);
    console.log(`- Initialized by: ${superAdmin.email}`);
    console.log(`- Timestamp: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('Error initializing system administration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization
if (require.main === module) {
  initializeSystemAdmin();
}

module.exports = initializeSystemAdmin;