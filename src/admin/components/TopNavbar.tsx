import React from 'react';

const TopNavbar = () => (
  <header className="w-full bg-white/80 border-b border-blue-100 px-8 py-4 flex items-center justify-between shadow">
    <div className="flex items-center gap-4">
      <input className="border rounded-lg p-2 w-72 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Search by SKU, ASIN, title, category..." />
    </div>
    <div className="flex items-center gap-6">
      <button className="relative">
        <span className="material-icons text-blue-700">notifications</span>
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">3</span>
      </button>
      <div className="flex items-center gap-2 cursor-pointer">
        <span className="material-icons text-blue-700">account_circle</span>
        <span className="font-medium text-blue-900">Admin</span>
      </div>
    </div>
  </header>
);

export default TopNavbar;
