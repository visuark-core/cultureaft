
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  // Example stats, replace with real data if available
  const stats = [
    { label: 'Total Products', value: 42, color: 'bg-orange-100 text-orange-700', icon: '🛒' },
    { label: 'Total Users', value: 128, color: 'bg-blue-100 text-blue-700', icon: '👤' },
    { label: 'Orders', value: 87, color: 'bg-green-100 text-green-700', icon: '📦' },
    { label: 'Revenue', value: '₹2,15,000', color: 'bg-yellow-100 text-yellow-700', icon: '💰' },
  ];
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gradient-to-br from-gray-100 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-blue-900 mb-8">Admin Dashboard</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, i) => (
              <div key={i} className={`rounded-2xl shadow flex flex-col items-center p-6 ${stat.color}`}>
                <span className="text-3xl mb-2">{stat.icon}</span>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">User Management</h2>
              <p className="text-gray-600 mb-4">View, edit, and manage users registered on the platform.</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Go to Users</button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">Product Listings</h2>
              <p className="text-gray-600 mb-4">Manage all product listings, add new products, or update existing ones.</p>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition" onClick={() => navigate('/admin/listingdashboard')}>Go to Listings</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
