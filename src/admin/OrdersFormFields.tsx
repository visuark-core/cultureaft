import React from 'react';
import { Search } from 'lucide-react';

const OrdersFormFields = () => (
  <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
    <div className="relative">
      <input
        type="text"
        placeholder="Search by Order ID, Customer Name, Product, or Status..."
        className="w-full pl-12 pr-4 py-4 border border-purple-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
      />
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
    </div>
    {/* The rest of the order management UI (e.g., a table of orders) would be displayed below based on the search results. */}
    <div className="mt-8 text-center text-gray-500">
      <p>Search for an order to see details.</p>
    </div>
  </div>
);

export default OrdersFormFields;