#!/usr/bin/env node

/**
 * Analytics Validation Script
 * Validates that analytics endpoints are returning real data, not mock data
 */

const http = require('http');

// Mock data signatures to detect
const MOCK_SIGNATURES = {
  revenue: [150000, 37500, 54000], // Common mock revenue values
  products: ['Handcrafted Wooden Chair', 'Traditional Carpet', 'Brass Decorative Item'],
  customers: ['John Doe', 'Jane Smith'], // Common mock customer names
  orderCounts: [45, 25, 18, 15, 12] // Common mock order counts
};

async function validateEndpoint(endpoint, validator) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:5000/api/analytics${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            const isReal = validator(response.data);
            resolve({ success: true, isReal, data: response.data });
          } else {
            resolve({ success: false, error: response.message });
          }
        } catch (error) {
          resolve({ success: false, error: error.message });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

// Validators for different endpoints
const validators = {
  kpis: (data) => {
    if (!data || !data.totalRevenue) return false;
    
    // Check if revenue matches common mock values
    const revenue = data.totalRevenue.value;
    if (MOCK_SIGNATURES.revenue.includes(revenue)) {
      return false; // Likely mock data
    }
    
    // Real data should have reasonable values
    return revenue > 0 && revenue < 10000000; // Between 0 and 1 crore
  },
  
  salesChart: (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    
    // Check for mock data patterns
    const hasRealVariation = data.some(item => item.Sales > 0 && item.Sales !== 5000 && item.Sales !== 7500);
    return hasRealVariation;
  },
  
  topProducts: (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    
    // Check if product names match mock signatures
    const productNames = data.map(p => p.name);
    const hasMockProducts = MOCK_SIGNATURES.products.some(mockProduct => 
      productNames.some(realProduct => realProduct.includes(mockProduct))
    );
    
    return !hasMockProducts; // Real if no mock products found
  },
  
  categoryDistribution: (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    
    // Real data should have varied category values
    const values = data.map(item => item.value);
    const hasVariation = new Set(values).size > 1;
    return hasVariation;
  }
};

async function runValidation() {
  console.log('🔍 Validating Analytics Data Authenticity');
  console.log('==========================================\n');
  
  const tests = [
    { endpoint: '/kpis?days=30', name: 'KPI Metrics', validator: validators.kpis },
    { endpoint: '/sales-chart?days=30', name: 'Sales Chart', validator: validators.salesChart },
    { endpoint: '/top-products?limit=10', name: 'Top Products', validator: validators.topProducts },
    { endpoint: '/category-distribution', name: 'Category Distribution', validator: validators.categoryDistribution }
  ];
  
  let realDataCount = 0;
  let totalTests = 0;
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    const result = await validateEndpoint(test.endpoint, test.validator);
    
    if (result.success) {
      totalTests++;
      if (result.isReal) {
        console.log(`   ✅ ${test.name}: REAL DATA DETECTED`);
        realDataCount++;
      } else {
        console.log(`   ⚠️  ${test.name}: MOCK DATA DETECTED`);
      }
    } else {
      console.log(`   ❌ ${test.name}: ERROR - ${result.error}`);
    }
    console.log('');
  }
  
  console.log('📊 Validation Results');
  console.log('=====================');
  console.log(`Real Data Endpoints: ${realDataCount}/${totalTests}`);
  console.log(`Mock Data Endpoints: ${totalTests - realDataCount}/${totalTests}`);
  
  if (realDataCount === totalTests) {
    console.log('🎉 SUCCESS: All endpoints are returning REAL data!');
    console.log('✅ Your analytics dashboard is ready for production use.');
  } else if (realDataCount > 0) {
    console.log('⚠️  PARTIAL: Some endpoints have real data, others have mock data.');
    console.log('💡 Consider running: node server/scripts/seedAnalyticsData.js');
  } else {
    console.log('❌ WARNING: All endpoints are returning MOCK data!');
    console.log('🔧 Action needed:');
    console.log('   1. Run: node server/scripts/seedAnalyticsData.js');
    console.log('   2. Verify Google Sheets integration');
    console.log('   3. Check if real orders exist in your system');
  }
  
  console.log('\n📋 Next Steps:');
  if (realDataCount < totalTests) {
    console.log('   • Add real data: node server/scripts/seedAnalyticsData.js');
    console.log('   • Test again: node validate-analytics.js');
    console.log('   • Check setup guide: REAL_ANALYTICS_SETUP.md');
  } else {
    console.log('   • Your analytics are ready!');
    console.log('   • Open the admin panel to see real insights');
    console.log('   • Monitor your business performance');
  }
}

runValidation().catch(console.error);