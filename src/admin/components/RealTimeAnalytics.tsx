import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Users, ShoppingCart, DollarSign, Clock } from 'lucide-react';

interface RealTimeMetrics {
  activeUsers: number;
  ordersToday: number;
  revenueToday: number;
  conversionRate: number;
  lastUpdated: string;
}

interface RealTimeAnalyticsProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const RealTimeAnalytics: React.FC<RealTimeAnalyticsProps> = ({ isEnabled, onToggle }) => {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    activeUsers: 0,
    ordersToday: 0,
    revenueToday: 0,
    conversionRate: 0,
    lastUpdated: new Date().toISOString()
  });

  const [isLoading, setIsLoading] = useState(false);

  // Simulate real-time data updates
  useEffect(() => {
    if (!isEnabled) return;

    const updateMetrics = () => {
      setMetrics(prev => ({
        activeUsers: Math.floor(Math.random() * 50) + 10,
        ordersToday: prev.ordersToday + Math.floor(Math.random() * 3),
        revenueToday: prev.revenueToday + (Math.random() * 5000),
        conversionRate: Math.random() * 5 + 2,
        lastUpdated: new Date().toISOString()
      }));
    };

    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [isEnabled]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isEnabled) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Real-Time Analytics</h3>
        <p className="text-gray-500 mb-4">
          Enable real-time monitoring to see live metrics and user activity
        </p>
        <button
          onClick={() => onToggle(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Enable Real-Time
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-gray-900">Live Metrics</h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            {formatTime(metrics.lastUpdated)}
          </div>
          <button
            onClick={() => onToggle(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Disable
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Users */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-green-600 font-medium">LIVE</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
          <p className="text-sm text-gray-600">Active Users</p>
        </div>

        {/* Orders Today */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.ordersToday}</p>
          <p className="text-sm text-gray-600">Orders Today</p>
        </div>

        {/* Revenue Today */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(metrics.revenueToday)}
          </p>
          <p className="text-sm text-gray-600">Revenue Today</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-orange-600" />
            <span className="text-xs text-blue-600 font-medium">
              {metrics.conversionRate > 3 ? '↗' : '↘'}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.conversionRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">Conversion Rate</p>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
        <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-600">New order from Mumbai</span>
            <span className="text-gray-400">2 min ago</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-600">Payment completed - ₹15,000</span>
            <span className="text-gray-400">5 min ago</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-600">New customer registration</span>
            <span className="text-gray-400">8 min ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeAnalytics;