const DatabaseManager = require('../services/DatabaseManager');

// Create a singleton instance of DatabaseManager
const databaseManager = new DatabaseManager();

/**
 * Legacy connectDB function for backward compatibility
 * Uses the new DatabaseManager under the hood
 */
const connectDB = async () => {
  try {
    await databaseManager.connect();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Export both the legacy function and the manager instance
module.exports = connectDB;
module.exports.databaseManager = databaseManager;