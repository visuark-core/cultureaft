/**
 * Client-side Rate Limiting Service
 * Prevents excessive API calls and implements client-side throttling
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

export interface RateLimitStatus {
  isAllowed: boolean;
  remainingRequests: number;
  resetTime: number;
  retryAfter?: number;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

class RateLimitService {
  private requestHistory: Map<string, RequestRecord[]> = new Map();
  private blockedEndpoints: Map<string, number> = new Map();
  
  private readonly defaultConfig: RateLimitConfig = {
    maxRequests: 60,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000 // 5 minutes
  };

  private readonly endpointConfigs: Map<string, RateLimitConfig> = new Map([
    // Authentication endpoints - stricter limits
    ['/api/auth/login', { maxRequests: 5, windowMs: 900000, blockDurationMs: 1800000 }], // 5 requests per 15 min, block for 30 min
    ['/api/auth/signup', { maxRequests: 3, windowMs: 3600000, blockDurationMs: 3600000 }], // 3 requests per hour, block for 1 hour
    ['/api/auth/forgot-password', { maxRequests: 3, windowMs: 3600000, blockDurationMs: 1800000 }], // 3 requests per hour, block for 30 min
    ['/api/auth/reset-password', { maxRequests: 5, windowMs: 3600000, blockDurationMs: 1800000 }], // 5 requests per hour, block for 30 min
    
    // Payment endpoints - moderate limits
    ['/api/payments', { maxRequests: 10, windowMs: 300000, blockDurationMs: 600000 }], // 10 requests per 5 min, block for 10 min
    
    // Search endpoints - higher limits but still controlled
    ['/api/search', { maxRequests: 30, windowMs: 60000, blockDurationMs: 120000 }], // 30 requests per minute, block for 2 min
    
    // File upload endpoints - lower limits
    ['/api/upload', { maxRequests: 5, windowMs: 300000, blockDurationMs: 600000 }], // 5 requests per 5 min, block for 10 min
  ]);

  /**
   * Check if request is allowed for a specific endpoint
   */
  checkRateLimit(endpoint: string): RateLimitStatus {
    const now = Date.now();
    
    // Check if endpoint is currently blocked
    const blockUntil = this.blockedEndpoints.get(endpoint);
    if (blockUntil && now < blockUntil) {
      return {
        isAllowed: false,
        remainingRequests: 0,
        resetTime: blockUntil,
        retryAfter: blockUntil - now
      };
    }

    // Remove expired blocks
    if (blockUntil && now >= blockUntil) {
      this.blockedEndpoints.delete(endpoint);
    }

    const config = this.getConfigForEndpoint(endpoint);
    const history = this.getRequestHistory(endpoint);
    
    // Clean old requests outside the window
    const windowStart = now - config.windowMs;
    const validRequests = history.filter(record => record.timestamp > windowStart);
    
    // Update history with cleaned requests
    this.requestHistory.set(endpoint, validRequests);
    
    // Count total requests in the current window
    const totalRequests = validRequests.reduce((sum, record) => sum + record.count, 0);
    const remainingRequests = Math.max(0, config.maxRequests - totalRequests);
    
    if (totalRequests >= config.maxRequests) {
      // Block the endpoint
      if (config.blockDurationMs) {
        this.blockedEndpoints.set(endpoint, now + config.blockDurationMs);
      }
      
      return {
        isAllowed: false,
        remainingRequests: 0,
        resetTime: windowStart + config.windowMs,
        retryAfter: config.blockDurationMs
      };
    }

    return {
      isAllowed: true,
      remainingRequests,
      resetTime: windowStart + config.windowMs
    };
  }

  /**
   * Record a request for rate limiting
   */
  recordRequest(endpoint: string, count: number = 1): void {
    const now = Date.now();
    const history = this.getRequestHistory(endpoint);
    
    // Add new request record
    history.push({
      timestamp: now,
      count
    });
    
    this.requestHistory.set(endpoint, history);
  }

  /**
   * Get configuration for a specific endpoint
   */
  private getConfigForEndpoint(endpoint: string): RateLimitConfig {
    // Check for exact match first
    if (this.endpointConfigs.has(endpoint)) {
      return this.endpointConfigs.get(endpoint)!;
    }
    
    // Check for pattern matches
    for (const [pattern, config] of this.endpointConfigs.entries()) {
      if (endpoint.startsWith(pattern)) {
        return config;
      }
    }
    
    return this.defaultConfig;
  }

  /**
   * Get request history for an endpoint
   */
  private getRequestHistory(endpoint: string): RequestRecord[] {
    return this.requestHistory.get(endpoint) || [];
  }

  /**
   * Clear rate limit history for an endpoint
   */
  clearHistory(endpoint: string): void {
    this.requestHistory.delete(endpoint);
    this.blockedEndpoints.delete(endpoint);
  }

  /**
   * Clear all rate limit history
   */
  clearAllHistory(): void {
    this.requestHistory.clear();
    this.blockedEndpoints.clear();
  }

  /**
   * Get current status for an endpoint
   */
  getStatus(endpoint: string): RateLimitStatus {
    return this.checkRateLimit(endpoint);
  }

  /**
   * Check if an endpoint is currently blocked
   */
  isBlocked(endpoint: string): boolean {
    const blockUntil = this.blockedEndpoints.get(endpoint);
    return blockUntil ? Date.now() < blockUntil : false;
  }

  /**
   * Get time until endpoint is unblocked
   */
  getTimeUntilUnblocked(endpoint: string): number {
    const blockUntil = this.blockedEndpoints.get(endpoint);
    if (!blockUntil) return 0;
    
    return Math.max(0, blockUntil - Date.now());
  }

  /**
   * Add custom rate limit configuration for an endpoint
   */
  setEndpointConfig(endpoint: string, config: RateLimitConfig): void {
    this.endpointConfigs.set(endpoint, config);
  }

  /**
   * Remove rate limit configuration for an endpoint
   */
  removeEndpointConfig(endpoint: string): void {
    this.endpointConfigs.delete(endpoint);
  }

  /**
   * Get all blocked endpoints
   */
  getBlockedEndpoints(): string[] {
    const now = Date.now();
    const blocked: string[] = [];
    
    for (const [endpoint, blockUntil] of this.blockedEndpoints.entries()) {
      if (now < blockUntil) {
        blocked.push(endpoint);
      }
    }
    
    return blocked;
  }

  /**
   * Clean up expired data periodically
   */
  cleanup(): void {
    const now = Date.now();
    
    // Clean up old request history
    for (const [endpoint, history] of this.requestHistory.entries()) {
      const config = this.getConfigForEndpoint(endpoint);
      const windowStart = now - config.windowMs;
      const validRequests = history.filter(record => record.timestamp > windowStart);
      
      if (validRequests.length === 0) {
        this.requestHistory.delete(endpoint);
      } else {
        this.requestHistory.set(endpoint, validRequests);
      }
    }
    
    // Clean up expired blocks
    for (const [endpoint, blockUntil] of this.blockedEndpoints.entries()) {
      if (now >= blockUntil) {
        this.blockedEndpoints.delete(endpoint);
      }
    }
  }
}

// Create singleton instance
const rateLimitService = new RateLimitService();

// Set up periodic cleanup
setInterval(() => {
  rateLimitService.cleanup();
}, 60000); // Clean up every minute

export default rateLimitService;