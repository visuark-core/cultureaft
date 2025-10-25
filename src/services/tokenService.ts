/**
 * Token Security Service
 * Handles secure token storage, validation, and refresh mechanisms
 */

import apiClient from './apiClient';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'cultureaft_access_token';
  private readonly REFRESH_TOKEN_KEY = 'cultureaft_refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'cultureaft_token_expiry';
  private readonly TOKEN_TYPE_KEY = 'cultureaft_token_type';

  private refreshPromise: Promise<string> | null = null;
  private refreshTimer: number | null = null;

  /**
   * Store tokens securely
   */
  setTokens(tokenData: TokenData): void {
    try {
      // Store in localStorage with encryption-like obfuscation
      const obfuscatedAccessToken = this.obfuscateToken(tokenData.accessToken);
      const obfuscatedRefreshToken = this.obfuscateToken(tokenData.refreshToken);

      localStorage.setItem(this.ACCESS_TOKEN_KEY, obfuscatedAccessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, obfuscatedRefreshToken);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, tokenData.expiresAt.toString());
      localStorage.setItem(this.TOKEN_TYPE_KEY, tokenData.tokenType);

      // Set up automatic refresh
      this.scheduleTokenRefresh(tokenData.expiresAt);

      // Update API client with new token
      apiClient.setAuthToken(tokenData.accessToken);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Token storage failed');
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    try {
      const obfuscatedToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      if (!obfuscatedToken) return null;

      return this.deobfuscateToken(obfuscatedToken);
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    try {
      const obfuscatedToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (!obfuscatedToken) return null;

      return this.deobfuscateToken(obfuscatedToken);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    try {
      const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryStr) return true;

      const expiryTime = parseInt(expiryStr, 10);
      const currentTime = Date.now();

      // Consider token expired if it expires within the next 5 minutes
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      return currentTime >= (expiryTime - bufferTime);
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  /**
   * Check if tokens exist
   */
  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      localStorage.removeItem(this.TOKEN_TYPE_KEY);

      // Clear refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }

      // Clear API client token
      apiClient.clearAuthToken();
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<string> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post<RefreshTokenResponse>('/api/admin/auth/refresh', {
        refreshToken
      });

      if (!response.success || !response.data) {
        throw new Error('Token refresh failed');
      }

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
      const expiresAt = Date.now() + (expiresIn * 1000);

      // Update stored tokens
      const tokenData: TokenData = {
        accessToken,
        refreshToken: newRefreshToken || refreshToken,
        expiresAt,
        tokenType: 'Bearer'
      };

      this.setTokens(tokenData);

      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid tokens
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(): Promise<string | null> {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      return null;
    }

    if (this.isTokenExpired()) {
      try {
        return await this.refreshAccessToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
    }

    return accessToken;
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const currentTime = Date.now();
    const timeUntilExpiry = expiresAt - currentTime;

    // Refresh 10 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - (10 * 60 * 1000), 60000); // At least 1 minute

    this.refreshTimer = window.setTimeout(async () => {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
      }
    }, refreshTime);
  }

  /**
   * Simple token obfuscation (not encryption, just basic obfuscation)
   */
  private obfuscateToken(token: string): string {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided for obfuscation');
    }
    return btoa(token.split('').reverse().join(''));
  }

  /**
   * Deobfuscate token
   */
  private deobfuscateToken(obfuscatedToken: string): string {
    return atob(obfuscatedToken).split('').reverse().join('');
  }

  /**
   * Validate token format
   */
  validateTokenFormat(token: string): boolean {
    // Basic JWT format validation
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    return jwtRegex.test(token);
  }

  /**
   * Initialize token service
   */
  initialize(): void {
    const accessToken = this.getAccessToken();

    if (accessToken && !this.isTokenExpired()) {
      // Set token in API client
      apiClient.setAuthToken(accessToken);

      // Schedule refresh
      const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (expiryStr) {
        const expiresAt = parseInt(expiryStr, 10);
        this.scheduleTokenRefresh(expiresAt);
      }
    } else if (this.hasTokens()) {
      // Try to refresh expired token
      this.refreshAccessToken().catch(() => {
        // If refresh fails, clear tokens
        this.clearTokens();
      });
    }
  }
}

// Create singleton instance
const tokenService = new TokenService();

// Initialize on module load
tokenService.initialize();

export default tokenService;