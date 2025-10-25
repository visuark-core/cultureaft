import axios, { AxiosResponse } from 'axios';
import {
  KPIData,
  SalesChartDataPoint,
  CategoryDataPoint,
  TopProduct,
  RecentOrder,
  CustomerAnalytics,
  DashboardData,
  ApiResponse,
  ApiError
} from '../types/analytics';
import { mockDashboardData } from './mockAnalyticsData';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const ANALYTICS_API_URL = `${API_BASE_URL}/api/analytics`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: ANALYTICS_API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making API request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API response error:', error);
    
    // Handle different error scenarios
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please try again');
    }
    
    if (!error.response) {
      throw new Error('Network error - please check your connection');
    }
    
    const status = error.response.status;
    const message = error.response.data?.message || 'An error occurred';
    
    switch (status) {
      case 404:
        throw new Error('Analytics service not found');
      case 500:
        throw new Error(`Server error: ${message}`);
      case 503:
        throw new Error('Analytics service is temporarily unavailable');
      default:
        throw new Error(message);
    }
  }
);

class AnalyticsService {
  /**
   * Get KPI metrics with retry logic
   */
  static async getKPIs(days: number = 30, retries: number = 3): Promise<KPIData> {
    try {
      const response: AxiosResponse<ApiResponse<KPIData>> = await apiClient.get('/kpis', {
        params: { days }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      
      return response.data.data;
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying KPIs request, ${retries} attempts remaining`);
        await this.delay(1000); // Wait 1 second before retry
        return this.getKPIs(days, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Get sales chart data
   */
  static async getSalesChart(days: number = 30): Promise<SalesChartDataPoint[]> {
    try {
      const response: AxiosResponse<ApiResponse<SalesChartDataPoint[]>> = await apiClient.get('/sales-chart', {
        params: { days }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching sales chart data:', error);
      throw error;
    }
  }

  /**
   * Get category distribution data
   */
  static async getCategoryDistribution(): Promise<CategoryDataPoint[]> {
    try {
      const response: AxiosResponse<ApiResponse<CategoryDataPoint[]>> = await apiClient.get('/category-distribution');
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching category distribution:', error);
      throw error;
    }
  }

  /**
   * Get top products data
   */
  static async getTopProducts(limit: number = 10): Promise<TopProduct[]> {
    try {
      const response: AxiosResponse<ApiResponse<TopProduct[]>> = await apiClient.get('/top-products', {
        params: { limit }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  }

  /**
   * Get recent orders data
   */
  static async getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
    try {
      const response: AxiosResponse<ApiResponse<RecentOrder[]>> = await apiClient.get('/recent-orders', {
        params: { limit }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  }

  /**
   * Get customer analytics data
   */
  static async getCustomerAnalytics(): Promise<CustomerAnalytics> {
    try {
      const response: AxiosResponse<ApiResponse<CustomerAnalytics>> = await apiClient.get('/customer-analytics');
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      throw error;
    }
  }

  /**
   * Get all dashboard data in one request (optimized)
   */
  static async getDashboardData(days: number = 30): Promise<DashboardData> {
    try {
      const response: AxiosResponse<ApiResponse<DashboardData>> = await apiClient.get('/dashboard', {
        params: { days }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Try to get real data from individual endpoints as fallback
      try {
        console.log('Attempting to fetch data from individual endpoints...');
        const [kpis, salesChart, categoryDistribution, topProducts] = await Promise.all([
          this.getKPIs(days).catch(() => null),
          this.getSalesChart(days).catch(() => []),
          this.getCategoryDistribution().catch(() => []),
          this.getTopProducts(10).catch(() => [])
        ]);

        return {
          kpis,
          salesChart,
          categoryDistribution,
          topProducts,
          sheetsAnalytics: null
        };
      } catch (fallbackError) {
        console.error('All endpoints failed, using mock data as last resort:', fallbackError);
        return mockDashboardData as DashboardData;
      }
    }
  }

  /**
   * Get Google Sheets analytics data
   */
  static async getSheetsAnalytics(days: number = 30): Promise<any> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await apiClient.get('/sheets-analytics', {
        params: { days }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching Google Sheets analytics:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive real analytics data (prioritizes Google Sheets)
   */
  static async getRealAnalyticsData(days: number = 30): Promise<DashboardData> {
    try {
      console.log('🔍 Fetching real analytics data from server...');
      
      // First try to get the complete dashboard data
      const dashboardResponse = await apiClient.get('/dashboard', {
        params: { days }
      });
      
      if (dashboardResponse.data.success) {
        console.log('✅ Successfully fetched dashboard data from server');
        return dashboardResponse.data.data;
      }
      
      throw new Error('Dashboard endpoint failed');
    } catch (error) {
      console.log('⚠️ Dashboard endpoint failed, trying individual endpoints...');
      
      // Fallback to individual endpoints
      try {
        const [kpis, salesChart, categoryDistribution, topProducts, sheetsAnalytics] = await Promise.allSettled([
          this.getKPIs(days),
          this.getSalesChart(days),
          this.getCategoryDistribution(),
          this.getTopProducts(10),
          this.getSheetsAnalytics(days)
        ]);

        const result: DashboardData = {
          kpis: kpis.status === 'fulfilled' ? kpis.value : null,
          salesChart: salesChart.status === 'fulfilled' ? salesChart.value : [],
          categoryDistribution: categoryDistribution.status === 'fulfilled' ? categoryDistribution.value : [],
          topProducts: topProducts.status === 'fulfilled' ? topProducts.value : [],
          sheetsAnalytics: sheetsAnalytics.status === 'fulfilled' ? sheetsAnalytics.value : null
        };

        console.log('✅ Fetched data from individual endpoints');
        return result;
      } catch (individualError) {
        console.error('❌ All real data endpoints failed:', individualError);
        throw new Error('Unable to fetch real analytics data');
      }
    }
  }

  /**
   * Sync data with Google Sheets
   */
  static async syncWithSheets(): Promise<boolean> {
    try {
      const response = await apiClient.post('/sync-sheets');
      return response.data.success;
    } catch (error) {
      console.error('Error syncing with Google Sheets:', error);
      return false;
    }
  }

  /**
   * Health check for analytics service
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.data.success;
    } catch (error) {
      console.error('Analytics service health check failed:', error);
      return false;
    }
  }

  /**
   * Utility function to format currency
   */
  static formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  /**
   * Utility function to format percentage
   */
  static formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  /**
   * Utility function to determine change type
   */
  static getChangeType(value: number): 'increase' | 'decrease' {
    return value >= 0 ? 'increase' : 'decrease';
  }

  /**
   * Utility function to get change color class
   */
  static getChangeColorClass(value: number): string {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  }

  /**
   * Private utility function for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cache management for offline support
   */
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if available and not expired
   */
  static getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set data in cache
   */
  static setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.cache.clear();
  }
}

export default AnalyticsService;