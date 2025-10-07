const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixUserData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Use updateMany to fix users with missing analytics
    const analyticsResult = await User.updateMany(
      { analytics: { $exists: false } },
      {
        $set: {
          analytics: {
            totalOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0,
            lastOrderDate: null,
            favoriteCategories: [],
            paymentMethods: [],
            engagementScore: 0,
            lifetimeValue: 0,
            churnRisk: 'low',
            segmentation: 'new'
          }
        }
      }
    );
    console.log(`Fixed analytics for ${analyticsResult.modifiedCount} users`);

    // Use updateMany to fix users with missing flags
    const flagsResult = await User.updateMany(
      { flags: { $exists: false } },
      { $set: { flags: [] } }
    );
    console.log(`Fixed flags for ${flagsResult.modifiedCount} users`);

    // Use updateMany to fix users with missing notes
    const notesResult = await User.updateMany(
      { notes: { $exists: false } },
      { $set: { notes: [] } }
    );
    console.log(`Fixed notes for ${notesResult.modifiedCount} users`);

    // Use updateMany to fix users with missing activity
    const activityResult = await User.updateMany(
      { activity: { $exists: false } },
      {
        $set: {
          activity: {
            lastLogin: null,
            loginCount: 0,
            pageViews: 0,
            sessionDuration: 0,
            lastPageVisited: null,
            deviceInfo: {},
            ipAddresses: [],
            failedLoginAttempts: 0,
            lastFailedLogin: null
          }
        }
      }
    );
    console.log(`Fixed activity for ${activityResult.modifiedCount} users`);

    const totalFixed = analyticsResult.modifiedCount + flagsResult.modifiedCount + 
                      notesResult.modifiedCount + activityResult.modifiedCount;
    console.log(`Total field fixes applied: ${totalFixed}`);
    console.log('User data fix completed successfully');

  } catch (error) {
    console.error('Error fixing user data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixUserData();
}

module.exports = fixUserData;