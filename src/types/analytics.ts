// Analytics data type definitions

export interface KPIMetric {
  value: number;
  change: number;
}

export interface KPIData {
  totalRevenue: KPIMetric;
  totalSales: KPIMetric;
  newCustomers: KPIMetric;
  avgOrderValue: KPIMetric;
}

export interface SalesChartDataPoint {
  name: string;
  date: string;
  Sales: number;
  orderCount: number;
}

export interface SalesChartData {
  data: SalesChartDataPoint[];
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  orderCount: number;
}

export interface CategoryData {
  data: CategoryDataPoint[];
}

export interface TopProduct {
  name: string;
  sku: string;
  unitsSold: number;
  revenue: string;
}

export interface TopProductsData {
  data: TopProduct[];
}

export interface RecentOrder {
  orderId: string;
  customerName: string;
  totalAmount: number;
  orderDate: string;
  status: string;
  productCount: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  customersThisMonth: number;
  topCustomers: Array<{
    name: string;
    email: string;
    totalSpent: number;
    totalOrders: number;
  }>;
}

export interface DashboardData {
  kpis: KPIData;
  salesChart: SalesChartDataPoint[];
  categoryDistribution: CategoryDataPoint[];
  topProducts: TopProduct[];
  sheetsAnalytics?: SheetsAnalytics;
}

export interface SheetsAnalytics {
  kpis: KPIData;
  salesChart: SalesChartDataPoint[];
  categoryDistribution: CategoryDataPoint[];
  topProducts: TopProduct[];
  customerInsights: CustomerInsights;
  paymentAnalytics: PaymentAnalytics;
  geographicAnalytics: GeographicAnalytics;
  dataSource: string;
  totalOrders: number;
  totalCustomers: number;
  lastSyncTime: string;
  error?: string;
}

export interface CustomerInsights {
  totalCustomers: number;
  activeCustomers: number;
  totalLifetimeValue: number;
  averageLifetimeValue: number;
  topCustomers: Array<{
    customerId: string;
    name: string;
    email: string;
    totalSpent: number;
    totalOrders: number;
    avgOrderValue: number;
    lastOrderDate: string;
  }>;
  acquisitionTrend: Array<{
    month: string;
    customers: number;
  }>;
}

export interface PaymentAnalytics {
  methodBreakdown: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    online: number;
    cod: number;
    total: number;
  }>;
}

export interface GeographicAnalytics {
  topStates: Array<{
    state: string;
    orders: number;
    revenue: number;
  }>;
  topCities: Array<{
    city: string;
    orders: number;
    revenue: number;
  }>;
  topPincodes: Array<{
    pincode: string;
    orders: number;
    revenue: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  data: null;
}

// Loading states
export interface LoadingState {
  kpis: boolean;
  salesChart: boolean;
  categoryDistribution: boolean;
  topProducts: boolean;
  dashboard: boolean;
}

// Error states
export interface ErrorState {
  kpis: string | null;
  salesChart: string | null;
  categoryDistribution: string | null;
  topProducts: string | null;
  dashboard: string | null;
}