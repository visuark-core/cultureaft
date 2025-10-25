/**
 * Security Monitor Component
 * Monitors and displays security-related information and alerts
 */

import React, { useState, useEffect } from 'react';
import { useConnection } from '../hooks/useConnection';
import rateLimitService from '../services/rateLimitService';
import tokenService from '../services/tokenService';
import apiClient from '../services/apiClient';

interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

interface SecurityMonitorProps {
  className?: string;
  showDetails?: boolean;
}

interface SecurityHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: string;
  alertCounts: {
    critical: number;
    high: number;
    total: number;
  };
}

const SecurityMonitor: React.FC<SecurityMonitorProps> = ({
  className = '',
  showDetails = false
}) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [securityHealth, setSecurityHealth] = useState<SecurityHealth | null>(null);
  const { isOnline, isApiConnected, error } = useConnection();

  useEffect(() => {
    const checkSecurityStatus = async () => {
      const newAlerts: SecurityAlert[] = [];

      // Check connection security - DISABLED to prevent dialog spam
      // if (!isOnline) {
      //   newAlerts.push({
      //     id: 'offline',
      //     type: 'warning',
      //     message: 'You are currently offline. Some features may not work properly.',
      //     timestamp: new Date(),
      //     dismissed: false
      //   });
      // }


      // Check for rate limiting
      const blockedEndpoints = rateLimitService.getBlockedEndpoints();
      if (blockedEndpoints.length > 0) {
        newAlerts.push({
          id: 'rate-limited',
          type: 'warning',
          message: `Some features are temporarily limited due to too many requests. Affected: ${blockedEndpoints.join(', ')}`,
          timestamp: new Date(),
          dismissed: false
        });
      }

      // Check token status
      if (tokenService.hasTokens() && tokenService.isTokenExpired()) {
        newAlerts.push({
          id: 'token-expired',
          type: 'warning',
          message: 'Your session is about to expire. Please save your work.',
          timestamp: new Date(),
          dismissed: false
        });
      }

      // Check for connection errors - DISABLED to prevent dialog spam
      // if (error) {
      //   newAlerts.push({
      //     id: 'connection-error',
      //     type: 'error',
      //     message: `Connection issue: ${error}`,
      //     timestamp: new Date(),
      //     dismissed: false
      //   });
      // }

      // Fetch security health from backend
      try {
        const response = await apiClient.get<SecurityHealth>('/api/security/health');
        if (response.success && response.data) {
          setSecurityHealth(response.data);
          
          // Add backend security alerts
          if (response.data.status === 'CRITICAL') {
            newAlerts.push({
              id: 'backend-critical', 
              type: 'error',
              message: response.data.message,
              timestamp: new Date(),
              dismissed: false
            });
          } else if (response.data.status === 'WARNING') {
            newAlerts.push({
              id: 'backend-warning',
              type: 'warning',
              message: response.data.message,
              timestamp: new Date(),
              dismissed: false
            });
          }
        }
      } catch (err) {
        // Silently handle backend security check failures
        console.warn('Failed to fetch security health:', err);
      }

      // Update alerts, keeping dismissed ones
      setAlerts(prevAlerts => {
        const dismissedAlerts = prevAlerts.filter(alert => alert.dismissed);
        const existingIds = new Set(prevAlerts.map(alert => alert.id));
        const uniqueNewAlerts = newAlerts.filter(alert => !existingIds.has(alert.id));
        
        return [...dismissedAlerts, ...uniqueNewAlerts];
      });
    };

    // Initial check
    checkSecurityStatus();

    // Periodic checks
    const interval = setInterval(checkSecurityStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, isApiConnected, error]);

  const dismissAlert = (alertId: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      )
    );
  };

  const clearAllAlerts = () => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert => ({ ...alert, dismissed: true }))
    );
  };

  const activeAlerts = alerts.filter(alert => !alert.dismissed);

  if (activeAlerts.length === 0 && !showDetails) {
    return null;
  }

  const getAlertIcon = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getAlertBgColor = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-md ${className}`}>
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.slice(0, isExpanded ? undefined : 1).map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-4 shadow-lg ${getAlertBgColor(alert.type)}`}
            >
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Dismiss alert"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {activeAlerts.length > 1 && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                {isExpanded ? 'Show Less' : `Show All (${activeAlerts.length})`}
              </button>
              
              <button
                onClick={clearAllAlerts}
                className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                Dismiss All
              </button>
            </div>
          )}
        </div>
      )}

      {showDetails && (
        <div className="mt-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Security Status</h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className={isApiConnected ? 'text-green-600' : 'text-red-600'}>
                {isApiConnected ? 'Secure' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Authentication:</span>
              <span className={tokenService.hasTokens() ? 'text-green-600' : 'text-gray-600'}>
                {tokenService.hasTokens() ? 'Active' : 'None'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Rate Limits:</span>
              <span className={rateLimitService.getBlockedEndpoints().length === 0 ? 'text-green-600' : 'text-yellow-600'}>
                {rateLimitService.getBlockedEndpoints().length === 0 ? 'Normal' : 'Limited'}
              </span>
            </div>

            {securityHealth && (
              <div className="flex justify-between">
                <span>Backend Security:</span>
                <span className={
                  securityHealth.status === 'HEALTHY' ? 'text-green-600' :
                  securityHealth.status === 'WARNING' ? 'text-yellow-600' : 'text-red-600'
                }>
                  {securityHealth.status}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityMonitor;