#!/usr/bin/env node

/**
 * Simple Migration Runner
 * 
 * This script runs the migration from MongoDB to Google Sheets
 * keeping only authentication data and admin/audit data in MongoDB.
 */

const MigrationManager = require('./migrateToSheetsOnly');

async function runMigration() {
  console.log('🚀 Starting Migration Process...\n');
  
  const migration = new MigrationManager();
  
  try {
    await migration.run();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️  Migration interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Migration terminated');
  process.exit(1);
});

// Run migration
runMigration();