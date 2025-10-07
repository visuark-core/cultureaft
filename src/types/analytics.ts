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
  userStats: boolean;
  userGrowth: boolean;
}

// Error states
export interface ErrorState {
  kpis: string | null;
  salesChart: string | null;
  categoryDistribution: string | null;
  topProducts: string | null;
  dashboard: string | null;
  userStats: string | null;
  userGrowth: string | null;
}