#!/usr/bin/env node

/**
 * Analytics Integration Test Startup Script
 * This script helps test the analytics functionality step by step
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analytics Integration Test');
console.log('============================\n');

// Test 1: Check if server is running
async function testServerConnection() {
  console.log('1. Testing server connection...');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('   ✅ Server is running and healthy');
            resolve(true);
          } else {
            console.log('   ❌ Server responded but not healthy');
            resolve(false);
          }
        } catch (error) {
          console.log('   ❌ Invalid response from server');
          resolve(false);
        }
      });
    });
    
    req.on('error', () => {
      console.log('   ❌ Server is not running on port 5000');
      console.log('   💡 Start the server with: cd server && npm start');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ❌ Server connection timeout');
      resolve(false);
    });
  });
}

// Test 2: Check analytics endpoints
async function testAnalyticsEndpoints() {
  console.log('\n2. Testing analytics endpoints...');
  
  const endpoints = [
    '/api/analytics/health',
    '/api/analytics/dashboard?days=30'
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:5000${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`   ✅ ${endpoint} - OK`);
        } else {
          console.log(`   ❌ ${endpoint} - Status: ${res.statusCode}`);
        }
        resolve();
      });
    });
    
    req.on('error', () => {
      console.log(`   ❌ ${endpoint} - Connection failed`);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log(`   ❌ ${endpoint} - Timeout`);
      resolve();
    });
  });
}

// Test 3: Check Google Sheets configuration
function testGoogleSheetsConfig() {
  console.log('\n3. Checking Google Sheets configuration...');
  
  const serverEnvPath = path.join(__dirname, 'server', '.env');
  const credentialsPath = path.join(__dirname, 'server', 'config', 'google-credentials.json');
  
  if (fs.existsSync(serverEnvPath)) {
    const envContent = fs.readFileSync(serverEnvPath, 'utf8');
    
    if (envContent.includes('GOOGLE_SHEETS_SPREADSHEET_ID')) {
      console.log('   ✅ Google Sheets Spreadsheet ID configured');
    } else {
      console.log('   ❌ Google Sheets Spreadsheet ID not found in .env');
    }
    
    if (envContent.includes('GOOGLE_SHEETS_CREDENTIALS_PATH')) {
      console.log('   ✅ Google Sheets credentials path configured');
    } else {
      console.log('   ❌ Google Sheets credentials path not found in .env');
    }
  } else {
    console.log('   ❌ Server .env file not found');
  }
  
  if (fs.existsSync(credentialsPath)) {
    console.log('   ✅ Google credentials file exists');
  } else {
    console.log('   ❌ Google credentials file not found');
    console.log('   💡 Place your service account JSON file at: server/config/google-credentials.json');
  }
}

// Test 4: Check frontend configuration
function testFrontendConfig() {
  console.log('\n4. Checking frontend configuration...');
  
  const frontendFiles = [
    'src/admin/Analytics.tsx',
    'src/services/analyticsService.ts',
    'src/types/analytics.ts'
  ];
  
  frontendFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file} exists`);
    } else {
      console.log(`   ❌ ${file} not found`);
    }
  });
}

// Main test function
async function runTests() {
  const serverOnline = await testServerConnection();
  
  if (serverOnline) {
    await testAnalyticsEndpoints();
  }
  
  testGoogleSheetsConfig();
  testFrontendConfig();
  
  console.log('\n📋 Test Summary');
  console.log('================');
  
  if (serverOnline) {
    console.log('✅ Server is running - you can test the analytics page');
    console.log('🌐 Open: http://localhost:5173/admin (or your frontend URL)');
    console.log('📊 Navigate to Analytics section');
  } else {
    console.log('❌ Server is not running');
    console.log('💡 Next steps:');
    console.log('   1. cd server');
    console.log('   2. npm install');
    console.log('   3. npm start');
    console.log('   4. Run this test again');
  }
  
  console.log('\n🔧 Troubleshooting:');
  console.log('   - If analytics show "mock data", the API endpoints are not responding');
  console.log('   - Check server logs for any errors');
  console.log('   - Ensure MongoDB is running and connected');
  console.log('   - Verify Google Sheets credentials if using sheets integration');
}

// Run the tests
runTests().catch(console.error);