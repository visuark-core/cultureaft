/**
 * Centralized API Client
 * Provides a consistent interface for all API calls with error handling and retry logic
 */

import config from '../config/environment';
import rateLimitService from './rateLimitService';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  data: null;
  statusCode?: number;
  field?: string;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    this.baseURL = config.apiBaseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Set authentication token for requests
   */
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authentication token
   */
  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    // Check rate limiting
    const rateLimitStatus = rateLimitService.checkRateLimit(endpoint);
    if (!rateLimitStatus.isAllowed) {
      throw {
        success: false,
        message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitStatus.retryAfter || 0) / 1000)} seconds.`,
        data: null,
        statusCode: 429
      } as ApiError;
    }

    // Get valid access token if needed
    const tokenService = (await import('./tokenService')).default;
    const validToken = await tokenService.getValidAccessToken();
    if (validToken) {
      this.setAuthToken(validToken);
    }

    const url = `${this.baseURL}${endpoint}`;
    
    // Handle headers properly for FormData
    let headers = { ...this.defaultHeaders };
    
    // If body is FormData, don't set Content-Type (let browser set it with boundary)
    if (options.body instanceof FormData) {
      const { 'Content-Type': _, ...headersWithoutContentType } = headers;
      headers = headersWithoutContentType;
    }
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    };

    // Record the request for rate limiting
    rateLimitService.recordRequest(endpoint);

    try {
      const response = await fetch(url, requestOptions);
      
      // Handle different response types
      let responseData: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        // Handle HTTP errors
        const error: ApiError = {
          success: false,
          message: responseData.message || `HTTP ${response.status}: ${response.statusText}`,
          data: null,
          statusCode: response.status
        };

        // Don't retry client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw error;
        }

        // Retry server errors (5xx) and network errors
        if (attempt < this.retryAttempts) {
          console.warn(`API request failed (attempt ${attempt}/${this.retryAttempts}):`, error.message);
          await this.sleep(this.retryDelay * attempt);
          return this.makeRequest<T>(endpoint, options, attempt + 1);
        }

        throw error;
      }

      // Ensure response has expected structure
      if (typeof responseData === 'object' && responseData !== null) {
        return {
          success: responseData.success !== false,
          message: responseData.message || 'Success',
          data: responseData.data !== undefined ? responseData.data : responseData
        };
      }

      return {
        success: true,
        message: 'Success',
        data: responseData as T
      };

    } catch (error) {
      // Handle network errors and other exceptions
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error - retry if attempts remaining
        if (attempt < this.retryAttempts) {
          console.warn(`Network error (attempt ${attempt}/${this.retryAttempts}):`, error.message);
          await this.sleep(this.retryDelay * attempt);
          return this.makeRequest<T>(endpoint, options, attempt + 1);
        }

        throw {
          success: false,
          message: 'Network error: Unable to connect to server',
          data: null,
          statusCode: 0
        } as ApiError;
      }

      // Re-throw API errors
      if (typeof error === 'object' && error !== null && 'success' in error) {
        throw error;
      }

      // Handle unexpected errors
      throw {
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        data: null
      } as ApiError;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.makeRequest<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'POST'
    };

    if (data) {
      if (data instanceof FormData) {
        options.body = data;
        // Don't set Content-Type for FormData, let browser set it with boundary
      } else {
        options.body = JSON.stringify(data);
      }
    }

    return this.makeRequest<T>(endpoint, options);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'PUT'
    };

    if (data) {
      if (data instanceof FormData) {
        options.body = data;
        // Don't set Content-Type for FormData, let browser set it with boundary
      } else {
        options.body = JSON.stringify(data);
      }
    }

    return this.makeRequest<T>(endpoint, options);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              success: response.success !== false,
              message: response.message || 'Upload successful',
              data: response.data || response
            });
          } else {
            reject({
              success: false,
              message: response.message || `Upload failed: ${xhr.statusText}`,
              data: null,
              statusCode: xhr.status
            });
          }
        } catch (error) {
          reject({
            success: false,
            message: 'Invalid response from server',
            data: null,
            statusCode: xhr.status
          });
        }
      });

      xhr.addEventListener('error', () => {
        reject({
          success: false,
          message: 'Network error during upload',
          data: null,
          statusCode: 0
        });
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      
      // Add auth header if available
      if (this.defaultHeaders['Authorization']) {
        xhr.setRequestHeader('Authorization', this.defaultHeaders['Authorization']);
      }
      
      xhr.send(formData);
    });
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/api/health');
      return response.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;