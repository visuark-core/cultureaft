import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Star,
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface DeliveryAnalytics {
  overall: {
    totalOrders: number;
    deliveredOrders: number;
    failedOrders: number;
    deliverySuccessRate: number;
  };
  agentPerformance: {
    totalAgents: number;
    averageRating: number;
    averageDeliveries: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    deliverySuccessRate: number;
  };
  orderDeliveryStats: {
    totalDeliveredOrders: number;
    averageDeliveryTime: number;
  };
  trends: {
    date: string;
    delivered: number;
    failed: number;
    pending: number;
    successRate: number;
  }[];
  agentStats: {
    _id: string;
    name: string;
    totalDeliveries: number;
    successRate: number;
    averageRating: number;
    onTimeRate: number;
  }[];
  timeSlotAnalysis: {
    slot: string;
    deliveries: number;
    successRate: number;
  }[];
  zoneAnalysis: {
    zone: string;
    deliveries: number;
    successRate: number;
    averageTime: number;
  }[];
}

const DeliveryAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<DeliveryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedMetric, setSelectedMetric] = useState<'deliveries' | 'success_rate' | 'avg_time'>('deliveries');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`/api/admin/delivery-agents/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Mock additional data for comprehensive analytics
        const mockAnalytics: DeliveryAnalytics = {
          ...data.data,
          trends: generateMockTrends(),
          agentStats: generateMockAgentStats(),
          timeSlotAnalysis: generateMockTimeSlotAnalysis(),
          zoneAnalysis: generateMockZoneAnalysis()
        };
        setAnalytics(mockAnalytics);
      }
    } catch (error) {
      console.error('Error fetching delivery analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data generators for demonstration
  const generateMockTrends = () => {
    const trends = [];
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      trends.push({
        date: d.toISOString().split('T')[0],
        delivered: Math.floor(Math.random() * 50) + 20,
        failed: Math.floor(Math.random() * 10) + 2,
        pending: Math.floor(Math.random() * 15) + 5,
        successRate: Math.floor(Math.random() * 20) + 80
      });
    }
    return trends;
  };

  const generateMockAgentStats = () => {
    return [
      { _id: '1', name: 'Rajesh Kumar', totalDeliveries: 145, successRate: 96.5, averageRating: 4.8, onTimeRate: 94.2 },
      { _id: '2', name: 'Priya Sharma', totalDeliveries: 132, successRate: 94.7, averageRating: 4.6, onTimeRate: 91.8 },
      { _id: '3', name: 'Amit Singh', totalDeliveries: 128, successRate: 93.2, averageRating: 4.5, onTimeRate: 89.5 },
      { _id: '4', name: 'Sneha Patel', totalDeliveries: 119, successRate: 95.8, averageRating: 4.7, onTimeRate: 92.3 },
      { _id: '5', name: 'Vikram Rao', totalDeliveries: 115, successRate: 92.1, averageRating: 4.4, onTimeRate: 87.9 }
    ];
  };

  const generateMockTimeSlotAnalysis = () => {
    return [
      { slot: '9-12 AM', deliveries: 85, successRate: 94.1 },
      { slot: '12-3 PM', deliveries: 120, successRate: 91.7 },
      { slot: '3-6 PM', deliveries: 145, successRate: 89.3 },
      { slot: '6-9 PM', deliveries: 98, successRate: 95.9 }
    ];
  };

  const generateMockZoneAnalysis = () => {
    return [
      { zone: 'Central Delhi', deliveries: 156, successRate: 93.6, averageTime: 45 },
      { zone: 'South Delhi', deliveries: 142, successRate: 95.1, averageTime: 38 },
      { zone: 'North Delhi', deliveries: 128, successRate: 91.4, averageTime: 52 },
      { zone: 'East Delhi', deliveries: 134, successRate: 92.5, averageTime: 48 },
      { zone: 'West Delhi', deliveries: 118, successRate: 94.2, averageTime: 41 }
    ];
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Analytics</h1>
          <p className="text-gray-600">Track delivery performance and agent metrics</p>
        </div>
        <div className="flex gap-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overall.totalOrders}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+12.5%</span>
              </div>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {analytics.overall.deliverySuccessRate.toFixed(1)}%
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+2.3%</span>
              </div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(analytics.orderDeliveryStats.averageDeliveryTime / (1000 * 60))} min
              </p>
              <div className="flex items-center mt-1">
                <TrendingDown className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">-5.2%</span>
              </div>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.agentPerformance.totalAgents}</p>
              <div className="flex items-center mt-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-600 ml-1">
                  {analytics.agentPerformance.averageRating.toFixed(1)} avg rating
                </span>
              </div>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Delivery Trends Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Delivery Trends</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMetric('deliveries')}
              className={`px-3 py-1 text-sm rounded ${
                selectedMetric === 'deliveries' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Deliveries
            </button>
            <button
              onClick={() => setSelectedMetric('success_rate')}
              className={`px-3 py-1 text-sm rounded ${
                selectedMetric === 'success_rate' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Success Rate
            </button>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {selectedMetric === 'deliveries' ? (
              <AreaChart data={analytics.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="delivered" stackId="1" stroke="#10B981" fill="#10B981" />
                <Area type="monotone" dataKey="failed" stackId="1" stroke="#EF4444" fill="#EF4444" />
                <Area type="monotone" dataKey="pending" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
              </AreaChart>
            ) : (
              <LineChart data={analytics.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="successRate" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Performance and Time Slot Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Agents */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Agents</h3>
          <div className="space-y-4">
            {analytics.agentStats.slice(0, 5).map((agent, index) => (
              <div key={agent._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{agent.name}</div>
                    <div className="text-sm text-gray-500">{agent.totalDeliveries} deliveries</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium">{agent.averageRating}</span>
                  </div>
                  <div className="text-sm text-gray-500">{agent.successRate}% success</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Slot Analysis */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery by Time Slot</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.timeSlotAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="slot" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="deliveries" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Zone Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone-wise Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Deliveries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time (min)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.zoneAnalysis.map((zone, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{zone.zone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {zone.deliveries}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      zone.successRate >= 95 ? 'bg-green-100 text-green-800' :
                      zone.successRate >= 90 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {zone.successRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {zone.averageTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            zone.successRate >= 95 ? 'bg-green-500' :
                            zone.successRate >= 90 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${zone.successRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{zone.successRate.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Peak Hours</span>
            </div>
            <p className="text-sm text-blue-700">
              Most deliveries happen between 3-6 PM with 145 deliveries but lower success rate (89.3%)
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Best Performance</span>
            </div>
            <p className="text-sm text-green-700">
              South Delhi zone shows highest success rate (95.1%) with fastest delivery time (38 min)
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-900">Improvement Area</span>
            </div>
            <p className="text-sm text-orange-700">
              North Delhi zone needs attention with 52 min avg delivery time and 91.4% success rate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAnalytics;