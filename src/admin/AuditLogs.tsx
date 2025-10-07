import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Activity,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface AuditLog {
  _id: string;
  adminId: {
    _id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    role: {
      name: string;
      level: number;
    };
  };
  action: string;
  resource: string;
  resourceId: string;
  changes?: any;
  metadata?: {
    oldValues?: any;
    newValues?: any;
    affectedCount?: number;
    bulkOperation?: boolean;
    reason?: string;
    notes?: string;
  };
  request: {
    ipAddress: string;
    userAgent: string;
    method: string;
    endpoint: string;
    requestId: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failed' | 'partial';
  errorMessage?: string;
  createdAt: string;
}

interface SecurityReport {
  period: string;
  summary: {
    totalLogs: number;
    securityEvents: number;
    permissionViolations: number;
    suspiciousIPCount: number;
  };
  details: {
    suspiciousIPs: Array<{
      _id: string;
      count: number;
      lastActivity: string;
    }>;
    topAdmins: Array<{
      _id: string;
      actionCount: number;
      lastActivity: string;
      actions: string[];
      admin: Array<{
        email: string;
        profile: {
          firstName: string;
          lastName: string;
        };
      }>;
    }>;
  };
  generatedAt: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [securityReport, setSecurityReport] = useState<SecurityReport | null>(null);
  const [showSecurityReport, setShowSecurityReport] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    adminId: '',
    action: '',
    resource: '',
    severity: '',
    startDate: '',
    endDate: '',
    ipAddress: '',
    search: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await fetch(`/api/system/audit?${queryParams}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.data.logs);
      setPagination(data.data.pagination);
      
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityReport = async () => {
    try {
      const response = await fetch('/api/system/security/report?days=7', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch security report');
      }

      const data = await response.json();
      setSecurityReport(data.data.report);
      
    } catch (error) {
      console.error('Error fetching security report:', error);
      setError('Failed to load security report');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const exportLogs = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'page' && key !== 'limit') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/system/audit/export?${queryParams}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting logs:', error);
      setError('Failed to export audit logs');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600">Monitor and review all administrative actions</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowSecurityReport(!showSecurityReport);
              if (!showSecurityReport && !securityReport) {
                fetchSecurityReport();
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Security Report
          </button>
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={fetchAuditLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Security Report */}
      {showSecurityReport && securityReport && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Report ({securityReport.period})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{securityReport.summary.totalLogs}</p>
              <p className="text-sm text-gray-600">Total Logs</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{securityReport.summary.securityEvents}</p>
              <p className="text-sm text-gray-600">Security Events</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{securityReport.summary.permissionViolations}</p>
              <p className="text-sm text-gray-600">Permission Violations</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{securityReport.summary.suspiciousIPCount}</p>
              <p className="text-sm text-gray-600">Suspicious IPs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Suspicious IPs */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Suspicious IP Addresses</h3>
              <div className="space-y-2">
                {securityReport.details.suspiciousIPs.slice(0, 5).map((ip, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{ip._id}</span>
                    <span className="text-sm text-red-600">{ip.count} events</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Active Admins */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Most Active Admins</h3>
              <div className="space-y-2">
                {securityReport.details.topAdmins.slice(0, 5).map((admin, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      {admin.admin[0]?.profile.firstName} {admin.admin[0]?.profile.lastName}
                    </span>
                    <span className="text-sm text-blue-600">{admin.actionCount} actions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search actions, resources..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
            <select
              value={filters.resource}
              onChange={(e) => handleFilterChange('resource', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Resources</option>
              <option value="user">Users</option>
              <option value="product">Products</option>
              <option value="order">Orders</option>
              <option value="system">System</option>
              <option value="admin">Admins</option>
              <option value="auth">Authentication</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Audit Logs ({pagination.total.toLocaleString()})
            </h2>
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Logs Found</h3>
            <p className="text-gray-600">No logs match your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logs.map((log) => (
              <div key={log._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(log.status)}
                      <span className="font-medium text-gray-900">{log.action}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                      <span className="text-sm text-gray-500">on {log.resource}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>
                          {log.adminId.profile.firstName} {log.adminId.profile.lastName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <span className="font-mono">{log.request.ipAddress}</span>
                    </div>

                    {log.errorMessage && (
                      <div className="text-sm text-red-600 mb-2">
                        Error: {log.errorMessage}
                      </div>
                    )}

                    {expandedLogs.has(log._id) && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Request Details</h4>
                            <div className="space-y-1 text-gray-600">
                              <p><span className="font-medium">Method:</span> {log.request.method}</p>
                              <p><span className="font-medium">Endpoint:</span> {log.request.endpoint}</p>
                              <p><span className="font-medium">User Agent:</span> {log.request.userAgent}</p>
                              <p><span className="font-medium">Request ID:</span> {log.request.requestId}</p>
                            </div>
                          </div>
                          
                          {(log.changes || log.metadata) && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Changes & Metadata</h4>
                              <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                {JSON.stringify({ changes: log.changes, metadata: log.metadata }, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => toggleLogExpansion(log._id)}
                    className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedLogs.has(log._id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + Math.max(1, pagination.page - 2);
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border rounded text-sm ${
                      page === pagination.page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;