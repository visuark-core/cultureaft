#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GoogleSheetsSetup = require('../config/google-sheets-setup');
const dataMigrationService = require('../services/dataMigrationService');

async function main() {
  console.log('🚀 Google Sheets Setup and Migration Tool');
  console.log('==========================================\n');

  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'validate':
        await validateSetup();
        break;
      case 'create':
        await createSpreadsheet();
        break;
      case 'migrate':
        await migrateData();
        break;
      case 'clear':
        await clearData();
        break;
      case 'template':
        await createTemplate();
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function validateSetup() {
  console.log('🔍 Validating Google Sheets setup...\n');
  
  const isValid = await GoogleSheetsSetup.validateSetup();
  
  if (isValid) {
    console.log('✅ Google Sheets setup is valid and ready to use!');
  } else {
    console.log('❌ Google Sheets setup validation failed.');
    console.log('\nPlease check:');
    console.log('1. GOOGLE_SHEETS_SPREADSHEET_ID is set in your .env file');
    console.log('2. Google credentials file exists and is valid');
    console.log('3. Service account has access to the spreadsheet');
  }
}

async function createSpreadsheet() {
  console.log('📊 Creating new Google Spreadsheet...\n');
  
  const result = await GoogleSheetsSetup.createSpreadsheet();
  
  console.log('✅ Spreadsheet created successfully!');
  console.log(`📋 Spreadsheet ID: ${result.spreadsheetId}`);
  console.log(`🔗 URL: ${result.url}`);
  console.log('\n📝 Next steps:');
  console.log(`1. Add this to your .env file: GOOGLE_SHEETS_SPREADSHEET_ID=${result.spreadsheetId}`);
  console.log('2. Run "npm run setup-sheets migrate" to migrate existing data');
}

async function migrateData() {
  console.log('🔄 Starting data migration from MongoDB to Google Sheets...\n');
  
  // First validate the setup
  const isValid = await GoogleSheetsSetup.validateSetup();
  if (!isValid) {
    throw new Error('Google Sheets setup is not valid. Please run "validate" command first.');
  }
  
  await dataMigrationService.migrateAllData();
  
  console.log('\n📊 Migration validation:');
  await dataMigrationService.validateMigration();
  
  console.log('\n✅ Data migration completed successfully!');
}

async function clearData() {
  console.log('🗑️  Clearing all data from Google Sheets...\n');
  
  const isValid = await GoogleSheetsSetup.validateSetup();
  if (!isValid) {
    throw new Error('Google Sheets setup is not valid. Please run "validate" command first.');
  }
  
  await dataMigrationService.clearSheetsData();
  
  console.log('✅ Google Sheets data cleared successfully!');
}

async function createTemplate() {
  console.log('📄 Creating Google credentials template...\n');
  
  const templatePath = GoogleSheetsSetup.generateCredentialsTemplate();
  
  console.log('✅ Credentials template created!');
  console.log('\n📝 Next steps:');
  console.log('1. Go to Google Cloud Console (https://console.cloud.google.com/)');
  console.log('2. Create a new project or select an existing one');
  console.log('3. Enable the Google Sheets API');
  console.log('4. Create a Service Account');
  console.log('5. Download the Service Account key (JSON format)');
  console.log('6. Replace the template content with your actual credentials');
  console.log(`7. Save the file as: server/config/google-credentials.json`);
}

function showHelp() {
  console.log('Google Sheets Setup Commands:');
  console.log('============================\n');
  console.log('validate    - Validate current Google Sheets setup');
  console.log('create      - Create a new Google Spreadsheet with proper structure');
  console.log('migrate     - Migrate data from MongoDB to Google Sheets');
  console.log('clear       - Clear all data from Google Sheets (keeps headers)');
  console.log('template    - Generate Google credentials template file');
  console.log('help        - Show this help message\n');
  
  console.log('Usage Examples:');
  console.log('===============');
  console.log('node scripts/setupGoogleSheets.js validate');
  console.log('node scripts/setupGoogleSheets.js create');
  console.log('node scripts/setupGoogleSheets.js migrate');
  console.log('npm run setup-sheets validate');
  console.log('npm run setup-sheets create\n');
  
  console.log('Environment Variables Required:');
  console.log('==============================');
  console.log('GOOGLE_SHEETS_SPREADSHEET_ID - The ID of your Google Spreadsheet');
  console.log('GOOGLE_SHEETS_CREDENTIALS_PATH - Path to your Google credentials JSON file (optional)');
  console.log('USE_GOOGLE_SHEETS - Set to "true" to use Google Sheets as primary data source\n');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  validateSetup,
  createSpreadsheet,
  migrateData,
  clearData,
  createTemplate
};