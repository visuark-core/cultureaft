/**
 * Connection Monitor Service
 * Monitors API connectivity and provides connection status feedback
 */

import apiClient from './apiClient';

export interface ConnectionStatus {
  isOnline: boolean;
  isApiConnected: boolean;
  lastChecked: Date;
  latency: number | null;
  error: string | null;
}

export interface ConnectionListener {
  (status: ConnectionStatus): void;
}

class ConnectionMonitor {
  private status: ConnectionStatus = {
    isOnline: navigator.onLine,
    isApiConnected: false,
    lastChecked: new Date(),
    latency: null,
    error: null
  };

  private listeners: ConnectionListener[] = [];
  private checkInterval: number | null = null;
  private readonly CHECK_INTERVAL_MS = 30000; // 30 seconds
  private readonly HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

  constructor() {
    this.setupNetworkListeners();
    this.startMonitoring();
  }

  /**
   * Setup browser network event listeners
   */
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true });
      this.checkApiConnection();
    });

    window.addEventListener('offline', () => {
      this.updateStatus({ 
        isOnline: false, 
        isApiConnected: false,
        error: 'No internet connection'
      });
    });
  }

  /**
   * Start periodic connection monitoring
   */
  startMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Initial check
    this.checkApiConnection();

    // Periodic checks
    this.checkInterval = window.setInterval(() => {
      this.checkApiConnection();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop connection monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check API connection health
   */
  async checkApiConnection(): Promise<void> {
    if (!navigator.onLine) {
      this.updateStatus({
        isOnline: false,
        isApiConnected: false,
        error: 'No internet connection'
      });
      return;
    }

    const startTime = Date.now();

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), this.HEALTH_CHECK_TIMEOUT);
      });

      // Race between health check and timeout
      const healthCheckPromise = apiClient.healthCheck();
      const isHealthy = await Promise.race([healthCheckPromise, timeoutPromise]);

      const latency = Date.now() - startTime;

      this.updateStatus({
        isOnline: true,
        isApiConnected: isHealthy,
        latency,
        error: isHealthy ? null : 'API health check failed'
      });

    } catch (error) {
      const latency = Date.now() - startTime;
      
      this.updateStatus({
        isOnline: navigator.onLine,
        isApiConnected: false,
        latency,
        error: error instanceof Error ? error.message : 'API connection failed'
      });
    }
  }

  /**
   * Update connection status and notify listeners
   */
  private updateStatus(updates: Partial<ConnectionStatus>) {
    this.status = {
      ...this.status,
      ...updates,
      lastChecked: new Date()
    };

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Add connection status listener
   */
  addListener(listener: ConnectionListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Remove connection status listener
   */
  removeListener(listener: ConnectionListener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Force immediate connection check
   */
  async forceCheck(): Promise<ConnectionStatus> {
    await this.checkApiConnection();
    return this.getStatus();
  }

  /**
   * Get connection quality description
   */
  getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!this.status.isOnline || !this.status.isApiConnected) {
      return 'offline';
    }

    if (this.status.latency === null) {
      return 'good';
    }

    if (this.status.latency < 100) {
      return 'excellent';
    } else if (this.status.latency < 500) {
      return 'good';
    } else {
      return 'poor';
    }
  }

  /**
   * Check if connection is stable (no errors in recent checks)
   */
  isConnectionStable(): boolean {
    return this.status.isOnline && this.status.isApiConnected && !this.status.error;
  }
}

// Create singleton instance
const connectionMonitor = new ConnectionMonitor();

export default connectionMonitor;