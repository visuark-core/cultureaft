import axios from 'axios';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: string;
  details?: any;
  error?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthCheckResult[];
  timestamp: string;
}

class HealthCheckService {
  private readonly API_BASE_URL = '/api';
  private readonly TIMEOUT = 5000; // 5 seconds
  private healthCache: SystemHealth | null = null;
  private lastCheck: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Perform comprehensive health check of all system components
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const now = Date.now();
    
    // Return cached result if still valid
    if (this.healthCache && (now - this.lastCheck) < this.CACHE_DURATION) {
      return this.healthCache;
    }

    const services: HealthCheckResult[] = [];
    const timestamp = new Date().toISOString();

    // Check backend API health
    services.push(await this.checkBackendHealth());
    
    // Check database connectivity
    services.push(await this.checkDatabaseHealth());
    
    // Check external services
    services.push(await this.checkGoogleSheetsHealth());
    // Payment service removed - using COD only
    
    // Check frontend services
    services.push(await this.checkLocalStorageHealth());
    services.push(await this.checkSessionStorageHealth());

    // Determine overall health
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    
    let overall: 'healthy' | 'unhealthy' | 'degraded';
    if (unhealthyCount === 0) {
      overall = 'healthy';
    } else if (healthyCount > unhealthyCount) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    const result: SystemHealth = {
      overall,
      services,
      timestamp
    };

    // Cache the result
    this.healthCache = result;
    this.lastCheck = now;

    return result;
  }

  /**
   * Check backend API health
   */
  private async checkBackendHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.API_BASE_URL}/health`, {
        timeout: this.TIMEOUT
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'Backend API',
        status: response.status === 200 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date().toISOString(),
        details: response.data
      };
    } catch (error: any) {
      return {
        service: 'Backend API',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Check database connectivity through API
   */
  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.API_BASE_URL}/health/database`, {
        timeout: this.TIMEOUT
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'Database',
        status: response.status === 200 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date().toISOString(),
        details: response.data
      };
    } catch (error: any) {
      return {
        service: 'Database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Check Google Sheets integration health
   */
  private async checkGoogleSheetsHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.API_BASE_URL}/google-sheets/health`, {
        timeout: this.TIMEOUT
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'Google Sheets',
        status: response.status === 200 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date().toISOString(),
        details: response.data
      };
    } catch (error: any) {
      return {
        service: 'Google Sheets',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }



  /**
   * Check localStorage functionality
   */
  private async checkLocalStorageHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const testKey = 'health_check_test';
      const testValue = 'test_value';
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'Local Storage',
        status: retrieved === testValue ? 'healthy' : 'unhealthy',
        responseTime,
        timestamp: new Date().toISOString(),
        details: { available: true }
      };
    } catch (error: any) {
      return {
        service: 'Local Storage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Check sessionStorage functionality
   */
  private async checkSessionStorageHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const testKey = 'health_check_test';
      const testValue = 'test_value';
      
      sessionStorage.setItem(testKey, testValue);
      const retrieved = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'Session Storage',
        status: retrieved === testValue ? 'healthy' : 'unhealthy',
        responseTime,
        timestamp: new Date().toISOString(),
        details: { available: true }
      };
    } catch (error: any) {
      return {
        service: 'Session Storage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get cached health status without performing new checks
   */
  getCachedHealth(): SystemHealth | null {
    return this.healthCache;
  }

  /**
   * Clear health cache to force fresh check
   */
  clearCache(): void {
    this.healthCache = null;
    this.lastCheck = 0;
  }
}

export const healthCheckService = new HealthCheckService();