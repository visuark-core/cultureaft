/**
 * Security Dashboard Component
 * Comprehensive security monitoring and management interface for administrators
 */

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  suspiciousActivities: number;
  failedLogins: number;
  rateLimitExceeded: number;
  uptime: number;
  rates: {
    suspiciousActivityRate: string;
    blockedRequestRate: string;
    failedLoginRate: string;
  };
  alertCounts: {
    total: number;
    active: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface SecurityAlert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  timestamp: number;
  data: any;
  acknowledged: boolean;
}

interface BlockedIP {
  ip: string;
  count: number;
  reasons: Array<{ reason: string; timestamp: number }>;
  firstSeen: string;
  lastSeen: string;
}

const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<string[]>([]);
  const [suspiciousIPs, setSuspiciousIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'ips' | 'settings'>('overview');

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch metrics
      const metricsResponse = await apiClient.get<SecurityMetrics>('/api/security/metrics');
      if (metricsResponse.success) {
        setMetrics(metricsResponse.data);
      }

      // Fetch alerts
      const alertsResponse = await apiClient.get<{ alerts: SecurityAlert[] }>('/api/security/alerts');
      if (alertsResponse.success) {
        setAlerts(alertsResponse.data.alerts);
      }

      // Fetch blocked IPs
      const ipsResponse = await apiClient.get<{ blockedIPs: string[]; suspiciousIPs: BlockedIP[] }>('/api/security/blocked-ips');
      if (ipsResponse.success) {
        setBlockedIPs(ipsResponse.data.blockedIPs);
        setSuspiciousIPs(ipsResponse.data.suspiciousIPs);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch security data');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await apiClient.post(`/api/security/alerts/${alertId}/acknowledge`);
      if (response.success) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ));
      }
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const unblockIP = async (ip: string) => {
    try {
      const response = await apiClient.delete(`/api/security/blocked-ips/${ip}`);
      if (response.success) {
        setBlockedIPs(prev => prev.filter(blockedIP => blockedIP !== ip));
        setSuspiciousIPs(prev => prev.filter(suspiciousIP => suspiciousIP.ip !== ip));
      }
    } catch (err: any) {
      console.error('Failed to unblock IP:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading security dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading security dashboard</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchSecurityData}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
        <p className="text-gray-600">Monitor and manage system security</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'alerts', label: 'Alerts', count: alerts.filter(a => !a.acknowledged).length },
            { id: 'ips', label: 'Blocked IPs', count: blockedIPs.length },
            { id: 'settings', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Requests</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics.totalRequests.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Blocked Requests</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics.blockedRequests.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{metrics.rates.blockedRequestRate}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Suspicious Activities</p>
                  <p className="text-2xl font-semibold text-gray-900">{metrics.suspiciousActivities.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{metrics.rates.suspiciousActivityRate}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">System Uptime</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatUptime(metrics.uptime)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Summary */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Alert Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{metrics.alertCounts.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-red-600">{metrics.alertCounts.critical}</p>
                <p className="text-sm text-gray-500">Critical</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-orange-600">{metrics.alertCounts.high}</p>
                <p className="text-sm text-gray-500">High</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-yellow-600">{metrics.alertCounts.medium}</p>
                <p className="text-sm text-gray-500">Medium</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-blue-600">{metrics.alertCounts.low}</p>
                <p className="text-sm text-gray-500">Low</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No security alerts at this time.
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={`p-6 ${alert.acknowledged ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{alert.type}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {alert.data && (
                        <div className="mt-2 text-sm text-gray-600">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(alert.data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Blocked IPs Tab */}
      {selectedTab === 'ips' && (
        <div className="space-y-6">
          {/* Blocked IPs */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Blocked IP Addresses</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {blockedIPs.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No IP addresses are currently blocked.
                </div>
              ) : (
                blockedIPs.map(ip => (
                  <div key={ip} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{ip}</p>
                      <p className="text-sm text-gray-500">Blocked due to suspicious activity</p>
                    </div>
                    <button
                      onClick={() => unblockIP(ip)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Suspicious IPs */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Suspicious IP Addresses</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {suspiciousIPs.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No suspicious IP addresses detected.
                </div>
              ) : (
                suspiciousIPs.map(ipData => (
                  <div key={ipData.ip} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{ipData.ip}</p>
                        <p className="text-sm text-gray-500">
                          {ipData.count} suspicious activities since {new Date(ipData.firstSeen).toLocaleString()}
                        </p>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Recent activities:</p>
                          <div className="mt-1 space-y-1">
                            {ipData.reasons.slice(-3).map((reason, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                {reason.reason} - {new Date(reason.timestamp).toLocaleString()}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => unblockIP(ipData.ip)}
                        className="ml-4 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
          <p className="text-gray-600">Security settings and thresholds can be configured here.</p>
          <div className="mt-4 text-sm text-gray-500">
            This section would contain forms to update security thresholds, notification settings, and other security configurations.
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;