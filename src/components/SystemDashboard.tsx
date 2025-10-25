import React, { useState, useEffect } from 'react';
import { performanceMonitoringService, PerformanceReport } from '../services/performanceMonitoringService';
import { maintenanceService, MaintenanceReport, MaintenanceTask } from '../services/maintenanceService';
import { errorHandlingService } from '../services/errorHandlingService';

interface SystemDashboardProps {
  showDetails?: boolean;
}

const SystemDashboard: React.FC<SystemDashboardProps> = ({ showDetails = false }) => {
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [maintenanceReport, setMaintenanceReport] = useState<MaintenanceReport | null>(null);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [errorStats, setErrorStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'maintenance' | 'errors'>('overview');

  useEffect(() => {
    loadDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      // Load performance data
      const perfReport = performanceMonitoringService.generateReport();
      setPerformanceReport(perfReport);

      // Load maintenance data
      const maintReport = maintenanceService.generateMaintenanceReport();
      setMaintenanceReport(maintReport);

      const tasks = maintenanceService.getTasks();
      setMaintenanceTasks(tasks);

      // Load error statistics
      const errStats = errorHandlingService.getErrorStats();
      setErrorStats(errStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMaintenanceTask = async (taskId: string) => {
    try {
      const result = await maintenanceService.runTask(taskId);
      if (result.success) {
        loadDashboardData(); // Refresh data
      }
      alert(result.message);
    } catch (error: any) {
      alert(`Failed to run task: ${error.message}`);
    }
  };

  const runAllMaintenance = async () => {
    try {
      setLoading(true);
      await maintenanceService.runAllPendingTasks();
      loadDashboardData();
      alert('All maintenance tasks completed');
    } catch (error: any) {
      alert(`Maintenance failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading && !performanceReport) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading system dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'performance', label: 'Performance' },
              { id: 'maintenance', label: 'Maintenance' },
              { id: 'errors', label: 'Errors' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {performanceReport && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-600">Performance Score</h3>
                    <p className="text-2xl font-bold text-blue-900">
                      {performanceMonitoringService.getPerformanceScore()}/100
                    </p>
                  </div>
                )}

                {maintenanceReport && (
                  <div className={`p-4 rounded-lg ${maintenanceReport.systemHealth === 'good' ? 'bg-green-50' :
                      maintenanceReport.systemHealth === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
                    }`}>
                    <h3 className={`text-sm font-medium ${maintenanceReport.systemHealth === 'good' ? 'text-green-600' :
                        maintenanceReport.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                      System Health
                    </h3>
                    <p className={`text-2xl font-bold ${maintenanceReport.systemHealth === 'good' ? 'text-green-900' :
                        maintenanceReport.systemHealth === 'warning' ? 'text-yellow-900' : 'text-red-900'
                      }`}>
                      {maintenanceReport.systemHealth.toUpperCase()}
                    </p>
                  </div>
                )}

                {errorStats && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600">Total Errors</h3>
                    <p className="text-2xl font-bold text-purple-900">{errorStats.total}</p>
                  </div>
                )}

                {performanceReport?.memoryUsage && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-orange-600">Memory Usage</h3>
                    <p className="text-2xl font-bold text-orange-900">
                      {formatBytes(performanceReport.memoryUsage.usedJSHeapSize)}
                    </p>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {maintenanceReport?.recommendations && maintenanceReport.recommendations.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Recommendations</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {maintenanceReport.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && performanceReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">Page Load Time</h4>
                  <p className="text-lg font-bold text-gray-700">
                    {formatDuration(performanceReport.pageLoadTime)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">First Contentful Paint</h4>
                  <p className="text-lg font-bold text-gray-700">
                    {formatDuration(performanceReport.firstContentfulPaint)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">Largest Contentful Paint</h4>
                  <p className="text-lg font-bold text-gray-700">
                    {formatDuration(performanceReport.largestContentfulPaint)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">First Input Delay</h4>
                  <p className="text-lg font-bold text-gray-700">
                    {formatDuration(performanceReport.firstInputDelay)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">Cumulative Layout Shift</h4>
                  <p className="text-lg font-bold text-gray-700">
                    {performanceReport.cumulativeLayoutShift.toFixed(3)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">Time to Interactive</h4>
                  <p className="text-lg font-bold text-gray-700">
                    {formatDuration(performanceReport.timeToInteractive)}
                  </p>
                </div>
              </div>

              {performanceReport.memoryUsage && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Memory Usage</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Used</span>
                      <p className="font-bold">{formatBytes(performanceReport.memoryUsage.usedJSHeapSize)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total</span>
                      <p className="font-bold">{formatBytes(performanceReport.memoryUsage.totalJSHeapSize)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Limit</span>
                      <p className="font-bold">{formatBytes(performanceReport.memoryUsage.jsHeapSizeLimit)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Maintenance Tasks</h3>
                <button
                  onClick={runAllMaintenance}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Running...' : 'Run All Pending'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {maintenanceTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{task.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div>
                        <span>Frequency: {task.frequency}</span>
                        {task.lastRun && (
                          <span className="ml-4">
                            Last run: {new Date(task.lastRun).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {task.status !== 'running' && (
                        <button
                          onClick={() => runMaintenanceTask(task.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Run Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors Tab */}
          {activeTab === 'errors' && errorStats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Errors by Category</h4>
                  <div className="space-y-2">
                    {Object.entries(errorStats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">{category}</span>
                        <span className="font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Errors by Severity</h4>
                  <div className="space-y-2">
                    {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
                      <div key={severity} className="flex justify-between items-center">
                        <span className={`text-sm capitalize ${getStatusColor(severity).split(' ')[0]}`}>
                          {severity}
                        </span>
                        <span className="font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {errorStats.recentErrors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recent Errors</h4>
                  <div className="space-y-2">
                    {errorStats.recentErrors.slice(0, 5).map((error: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{error.code}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(error.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{error.userMessage}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default SystemDashboard;