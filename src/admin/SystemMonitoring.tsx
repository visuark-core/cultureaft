import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Cpu,
  HardDrive,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  issues: string[];
  metrics: any;
  timestamp: string;
}

interface SystemStats {
  database: {
    size: number;
    indexSize: number;
    collections: number;
    objects: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  admins: {
    total: number;
  };
  products: {
    total: number;
    active: number;
    inactive: number;
  };
  orders: {
    total: number;
    recent: number;
  };
  audit: {
    totalLogs: number;
  };
  system: {
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    nodeVersion: string;
    platform: string;
  };
}

interface PerformanceMetrics {
  metrics: any[];
  summary: {
    avgCpuUsage: number;
    maxCpuUsage: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
    avgResponseTime: number;
    maxResponseTime: number;
    totalRequests: number;
    totalErrors: number;
  };
  anomalies: Array<{
    type: string;
    severity: string;
    timestamp: string;
    value: number;
    message: string;
  }>;
}

const SystemMonitoring: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchAllData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange, autoRefresh]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [healthResponse, statsResponse, metricsResponse] = await Promise.all([
        fetch('/api/system/health', { credentials: 'include' }),
        fetch('/api/system/stats', { credentials: 'include' }),
        fetch(`/api/system/metrics?timeRange=${timeRange}`, { credentials: 'include' })
      ]);

      if (!healthResponse.ok || !statsResponse.ok || !metricsResponse.ok) {
        throw new Error('Failed to fetch system data');
      }

      const [healthData, statsData, metricsData] = await Promise.all([
        healthResponse.json(),
        statsResponse.json(),
        metricsResponse.json()
      ]);

      setHealth(healthData.data);
      setStats(statsData.data);
      setMetrics(metricsData.data);
      
    } catch (error) {
      console.error('Error fetching system data:', error);
      setError('Failed to load system monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const recordMetrics = async () => {
    try {
      const response = await fetch('/api/system/metrics/record', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to record metrics');
      }
      
      // Refresh data after recording
      await fetchAllData();
      
    } catch (error) {
      console.error('Error recording metrics:', error);
      setError('Failed to record system metrics');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
            <p className="text-gray-600">Real-time system health and performance metrics</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-700">
              Auto-refresh
            </label>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button
            onClick={recordMetrics}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Record Metrics
          </button>
          <button
            onClick={fetchAllData}
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

      {/* System Health Status */}
      {health && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(health.status)}`}>
              {getStatusIcon(health.status)}
              <span className="font-medium capitalize">{health.status}</span>
            </div>
          </div>
          
          {health.issues.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Issues Detected:</h3>
              <ul className="space-y-1">
                {health.issues.map((issue, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            Last updated: {new Date(health.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* System Uptime */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatUptime(stats.system.uptime)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatBytes(stats.system.memory.heapUsed)}
                </p>
                <p className="text-xs text-gray-500">
                  of {formatBytes(stats.system.memory.heapTotal)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Cpu className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Database Size */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Database Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatBytes(stats.database.size)}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.database.collections} collections
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.users.active.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  of {stats.users.total.toLocaleString()} total
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Charts */}
      {metrics && metrics.metrics.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Usage Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CPU Usage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'CPU Usage']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgCpuUsage" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Memory Usage Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Memory Usage']}
                />
                <Area 
                  type="monotone" 
                  dataKey="avgMemoryUsage" 
                  stroke="#10B981" 
                  fill="#10B981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Performance Summary */}
      {metrics && metrics.summary && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {metrics.summary.avgCpuUsage?.toFixed(1) || 0}%
              </p>
              <p className="text-sm text-gray-600">Avg CPU Usage</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {metrics.summary.avgMemoryUsage?.toFixed(1) || 0}%
              </p>
              <p className="text-sm text-gray-600">Avg Memory Usage</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {metrics.summary.avgResponseTime?.toFixed(0) || 0}ms
              </p>
              <p className="text-sm text-gray-600">Avg Response Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {metrics.summary.totalErrors || 0}
              </p>
              <p className="text-sm text-gray-600">Total Errors</p>
            </div>
          </div>
        </div>
      )}

      {/* Anomalies */}
      {metrics && metrics.anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Anomalies</h3>
          <div className="space-y-3">
            {metrics.anomalies.slice(0, 5).map((anomaly, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  anomaly.severity === 'critical' ? 'bg-red-100 text-red-600' :
                  anomaly.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{anomaly.message}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(anomaly.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  anomaly.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  anomaly.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {anomaly.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Information */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Platform</h4>
              <p className="text-gray-600">{stats.system.platform}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Node.js Version</h4>
              <p className="text-gray-600">{stats.system.nodeVersion}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Database Objects</h4>
              <p className="text-gray-600">{stats.database.objects.toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Total Products</h4>
              <p className="text-gray-600">{stats.products.total.toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Total Orders</h4>
              <p className="text-gray-600">{stats.orders.total.toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Audit Logs</h4>
              <p className="text-gray-600">{stats.audit.totalLogs.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMonitoring;