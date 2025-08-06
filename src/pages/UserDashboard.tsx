import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userActions = [
    { title: 'My Orders', icon: '📦', path: '/user/orders', color: 'bg-blue-500' },
    { title: 'Wishlist', icon: '❤️', path: '/user/wishlist', color: 'bg-pink-500' },
    { title: 'Profile', icon: '👤', path: '/user/profile', color: 'bg-purple-500' },
    { title: 'Settings', icon: '⚙️', path: '/user/settings', color: 'bg-gray-500' },
  ];

  const recentOrders = [
    { id: '1234', product: 'Hand Carved Chair', status: 'Delivered', date: '2025-08-01' },
    { id: '1235', product: 'Block Print Scarf', status: 'In Transit', date: '2025-08-04' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* User Header */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                {user?.name?.[0]?.toUpperCase() || '👤'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Welcome, {user?.name}</h1>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {userActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className={`${action.color} text-white p-6 rounded-2xl shadow hover:opacity-90 transition flex flex-col items-center justify-center gap-2`}
            >
              <span className="text-3xl">{action.icon}</span>
              <span className="font-medium">{action.title}</span>
            </button>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Recent Orders</h2>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition"
              >
                <div>
                  <h3 className="font-medium text-blue-900">Order #{order.id}</h3>
                  <p className="text-gray-600">{order.product}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {order.status}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">{order.date}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/user/orders')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Orders →
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
