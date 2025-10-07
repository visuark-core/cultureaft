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
      throw error;
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