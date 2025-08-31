
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const stats = [
    { label: 'Total Products', value: 42, color: 'bg-orange-100 text-orange-700', icon: '🛒', path: '/admin/products' },
    { label: 'Total Users', value: 128, color: 'bg-blue-100 text-blue-700', icon: '👤', path: '/admin/customers' },
    { label: 'Orders', value: 87, color: 'bg-green-100 text-green-700', icon: '📦', path: '/admin/orders' },
    { label: 'Revenue', value: '₹2,15,000', color: 'bg-yellow-100 text-yellow-700', icon: '💰', path: '/admin/analytics' },
  ];

  const quickActions = [
    { title: 'Add New Product', color: 'bg-blue-500', icon: '➕', path: '/admin/products' },
    { title: 'Process Orders', color: 'bg-green-500', icon: '📋', path: '/admin/orders' },
    { title: 'Manage Inventory', color: 'bg-purple-500', icon: '📦', path: '/admin/inventory' },
    { title: 'View Reports', color: 'bg-yellow-500', icon: '📊', path: '/admin/reports' },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-900 mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div 
              key={i} 
              className={`rounded-2xl shadow flex flex-col items-center p-6 ${stat.color} cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => navigate(stat.path)}
            >
              <span className="text-3xl mb-2">{stat.icon}</span>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-blue-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className={`${action.color} text-white p-4 rounded-xl hover:opacity-90 transition flex flex-col items-center justify-center gap-2`}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="font-medium">{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity and Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-600 text-xl">📦</span>
                <div>
                  <p className="font-medium text-blue-900">New order received</p>
                  <p className="text-sm text-blue-600">Order #1234 - ₹4,500</p>
                </div>
                <span className="ml-auto text-sm text-blue-500">2m ago</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600 text-xl">✅</span>
                <div>
                  <p className="font-medium text-green-900">Order completed</p>
                  <p className="text-sm text-green-600">Order #1230 delivered</p>
                </div>
                <span className="ml-auto text-sm text-green-500">1h ago</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-600 text-xl">⭐</span>
                <div>
                  <p className="font-medium text-orange-900">New review</p>
                  <p className="text-sm text-orange-600">5★ rating on Hand Carved Chair</p>
                </div>
                <span className="ml-auto text-sm text-orange-500">3h ago</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/admin/orders')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Activity →
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Quick Analytics</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-600">Monthly Revenue</span>
                  <span className="text-green-600">↑ 12%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-green-500 w-3/4"></div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-600">Customer Satisfaction</span>
                  <span className="text-blue-600">↑ 8%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-blue-500 w-4/5"></div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-600">Inventory Status</span>
                  <span className="text-yellow-600">→ 85%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-yellow-500 w-[85%]"></div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/admin/analytics')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              View Detailed Analytics →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
