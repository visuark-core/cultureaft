import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies for refresh tokens
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminAccessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await adminApi.post('/auth/refresh');
        const { accessToken } = refreshResponse.data.data;
        
        localStorage.setItem('adminAccessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return adminApi(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface AdminUser {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
  };
  role: {
    name: string;
    level: number;
    permissions: string[];
  };
  security: {
    lastLogin: Date;
    mfaEnabled: boolean;
  };
  audit: {
    lastActivity: Date;
    sessionCount: number;
  };
  isActive: boolean;
}

export interface LoginResponse {
  admin: AdminUser;
  accessToken: string;
  expiresIn: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any[];
}

class AdminAuthService {
  /**
   * Login admin user
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await adminApi.post<ApiResponse<LoginResponse>>('/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        const { admin, accessToken } = response.data.data;
        
        // Store tokens and user data
        localStorage.setItem('adminAccessToken', accessToken);
        localStorage.setItem('adminUser', JSON.stringify(admin));
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  /**
   * Logout admin user
   */
  async logout(): Promise<void> {
    try {
      await adminApi.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminUser');
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<void> {
    try {
      await adminApi.post('/auth/logout-all');
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminUser');
    }
  }

  /**
   * Get current admin profile
   */
  async getCurrentAdmin(): Promise<AdminUser> {
    try {
      const response = await adminApi.get<ApiResponse<{ admin: AdminUser }>>('/auth/me');
      
      if (response.data.success) {
        const admin = response.data.data.admin;
        localStorage.setItem('adminUser', JSON.stringify(admin));
        return admin;
      } else {
        throw new Error(response.data.message || 'Failed to get admin profile');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.logout();
      }
      throw error;
    }
  }

  /**
   * Verify if current token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await adminApi.get<ApiResponse<any>>('/auth/verify');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Change admin password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await adminApi.post<ApiResponse<any>>('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Password change failed');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Password change failed');
    }
  }

  /**
   * Validate password strength
   */
  async validatePassword(password: string): Promise<any> {
    try {
      const response = await adminApi.post<ApiResponse<any>>('/auth/validate-password', {
        password,
      });

      return response.data.data;
    } catch (error: any) {
      throw new Error('Password validation failed');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await adminApi.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
      
      if (response.data.success) {
        const { accessToken } = response.data.data;
        localStorage.setItem('adminAccessToken', accessToken);
        return accessToken;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminUser');
      throw error;
    }
  }

  /**
   * Get stored admin user
   */
  getStoredAdmin(): AdminUser | null {
    try {
      const adminData = localStorage.getItem('adminUser');
      return adminData ? JSON.parse(adminData) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get stored access token
   */
  getStoredToken(): string | null {
    return localStorage.getItem('adminAccessToken');
  }

  /**
   * Check if admin is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const admin = this.getStoredAdmin();
    return !!(token && admin);
  }

  /**
   * Check if admin has specific permission
   */
  hasPermission(permission: string): boolean {
    const admin = this.getStoredAdmin();
    if (!admin) return false;
    
    // Super admin has all permissions
    if (admin.role.level === 1) return true;
    
    return admin.role.permissions.includes(permission) || admin.role.permissions.includes('all');
  }

  /**
   * Check if admin has minimum role level
   */
  hasMinimumRole(level: number): boolean {
    const admin = this.getStoredAdmin();
    if (!admin) return false;
    
    return admin.role.level <= level; // Lower numbers = higher privileges
  }
}

export const adminAuthService = new AdminAuthService();
export default adminAuthService;