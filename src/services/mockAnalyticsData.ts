// Mock analytics data for fallback when API is not available
export const mockKPIData = {
  totalRevenue: { value: 150000, change: 12.5 },
  totalSales: { value: 45, change: 8.2 },
  newCustomers: { value: 12, change: 15.3 },
  avgOrderValue: { value: 3333, change: 4.1 }
};

export const mockSalesData = [
  { name: 'Day 1', date: '2024-10-01', Sales: 5000, orderCount: 2 },
  { name: 'Day 2', date: '2024-10-02', Sales: 7500, orderCount: 3 },
  { name: 'Day 3', date: '2024-10-03', Sales: 6200, orderCount: 2 },
  { name: 'Day 4', date: '2024-10-04', Sales: 8900, orderCount: 4 },
  { name: 'Day 5', date: '2024-10-05', Sales: 12000, orderCount: 5 },
  { name: 'Day 6', date: '2024-10-06', Sales: 9800, orderCount: 3 },
  { name: 'Day 7', date: '2024-10-07', Sales: 11500, orderCount: 4 }
];

export const mockCategoryData = [
  { name: 'Furniture', value: 45000, orderCount: 15 },
  { name: 'Home Decor', value: 32000, orderCount: 12 },
  { name: 'Handicrafts', value: 28000, orderCount: 10 },
  { name: 'Textiles', value: 25000, orderCount: 8 },
  { name: 'Jewelry', value: 20000, orderCount: 6 }
];

export const mockTopProducts = [
  { name: 'Handcrafted Wooden Chair', sku: 'SKU-001', unitsSold: 25, revenue: '₹37,500' },
  { name: 'Traditional Carpet', sku: 'SKU-002', unitsSold: 18, revenue: '₹54,000' },
  { name: 'Brass Decorative Item', sku: 'SKU-003', unitsSold: 15, revenue: '₹22,500' },
  { name: 'Handwoven Textile', sku: 'SKU-004', unitsSold: 12, revenue: '₹18,000' },
  { name: 'Silver Jewelry Set', sku: 'SKU-005', unitsSold: 8, revenue: '₹32,000' }
];

export const mockDashboardData = {
  kpis: mockKPIData,
  salesChart: mockSalesData,
  categoryDistribution: mockCategoryData,
  topProducts: mockTopProducts,
  sheetsAnalytics: null
};