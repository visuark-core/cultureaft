#!/usr/bin/env node

/**
 * Test Real Analytics Data
 * This script tests if the analytics endpoints are returning real data
 */

const http = require('http');

console.log('🔍 Testing Real Analytics Data');
console.log('==============================\n');

async function testEndpoint(endpoint, description) {
  console.log(`Testing ${description}...`);
  
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:5000/api/analytics${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log(`   ✅ ${description} - SUCCESS`);
            console.log(`   📊 Data preview:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
            resolve(true);
          } else {
            console.log(`   ❌ ${description} - FAILED: ${response.message}`);
            resolve(false);
          }
        } catch (error) {
          console.log(`   ❌ ${description} - PARSE ERROR: ${error.message}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ ${description} - CONNECTION ERROR: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log(`   ❌ ${description} - TIMEOUT`);
      resolve(false);
    });
  });
}

async function runTests() {
  const tests = [
    { endpoint: '/health', description: 'Health Check' },
    { endpoint: '/dashboard?days=30', description: 'Dashboard Data' },
    { endpoint: '/kpis?days=30', description: 'KPI Metrics' },
    { endpoint: '/sales-chart?days=30', description: 'Sales Chart Data' },
    { endpoint: '/category-distribution', description: 'Category Distribution' },
    { endpoint: '/top-products?limit=5', description: 'Top Products' },
    { endpoint: '/sheets-analytics?days=30', description: 'Google Sheets Analytics' }
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    const success = await testEndpoint(test.endpoint, test.description);
    if (success) successCount++;
    console.log(''); // Add spacing
  }
  
  console.log('📋 Test Results');
  console.log('================');
  console.log(`✅ Successful: ${successCount}/${tests.length}`);
  console.log(`❌ Failed: ${tests.length - successCount}/${tests.length}`);
  
  if (successCount === tests.length) {
    console.log('🎉 All analytics endpoints are working with real data!');
  } else if (successCount > 0) {
    console.log('⚠️ Some endpoints are working. Check the failed ones above.');
  } else {
    console.log('❌ No endpoints are working. Check if:');
    console.log('   1. Server is running on port 5000');
    console.log('   2. Google Sheets is configured');
    console.log('   3. Database has data or run: node server/scripts/seedAnalyticsData.js');
  }
}

runTests().catch(console.error);