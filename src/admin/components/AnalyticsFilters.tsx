import React, { useState } from 'react';
import { Filter, Calendar, MapPin, CreditCard, Package, X } from 'lucide-react';

interface FilterOptions {
  dateRange: string;
  paymentMethod: string;
  orderStatus: string;
  location: string;
  category: string;
}

interface AnalyticsFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const filterOptions = {
    dateRange: [
      { value: '', label: 'All Time' },
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: 'last7days', label: 'Last 7 Days' },
      { value: 'last30days', label: 'Last 30 Days' },
      { value: 'last90days', label: 'Last 90 Days' },
      { value: 'thismonth', label: 'This Month' },
      { value: 'lastmonth', label: 'Last Month' }
    ],
    paymentMethod: [
      { value: '', label: 'All Methods' },
      { value: 'cod', label: 'Cash on Delivery' },
      { value: 'online', label: 'Online Payment' },
      { value: 'upi', label: 'UPI' },
      { value: 'card', label: 'Credit/Debit Card' }
    ],
    orderStatus: [
      { value: '', label: 'All Statuses' },
      { value: 'pending', label: 'Pending' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'processing', label: 'Processing' },
      { value: 'shipped', label: 'Shipped' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' }
    ],
    location: [
      { value: '', label: 'All Locations' },
      { value: 'mumbai', label: 'Mumbai' },
      { value: 'delhi', label: 'Delhi' },
      { value: 'bangalore', label: 'Bangalore' },
      { value: 'chennai', label: 'Chennai' },
      { value: 'kolkata', label: 'Kolkata' },
      { value: 'hyderabad', label: 'Hyderabad' }
    ],
    category: [
      { value: '', label: 'All Categories' },
      { value: 'furniture', label: 'Furniture' },
      { value: 'home-decor', label: 'Home Decor' },
      { value: 'handicrafts', label: 'Handicrafts' },
      { value: 'textiles', label: 'Textiles' },
      { value: 'jewelry', label: 'Jewelry' }
    ]
  };

  if (!isOpen) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
            hasActiveFilters
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {Object.values(filters).filter(v => v !== '').length}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Analytics Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Date Range Filter */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filterOptions.dateRange.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filterOptions.paymentMethod.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Status Filter */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Package className="w-4 h-4 mr-2" />
                  Order Status
                </label>
                <select
                  value={filters.orderStatus}
                  onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filterOptions.orderStatus.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <MapPin className="w-4 h-4 mr-2" />
                  Location
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filterOptions.location.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Package className="w-4 h-4 mr-2" />
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filterOptions.category.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Active Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value) return null;
                    const option = filterOptions[key as keyof typeof filterOptions]?.find(opt => opt.value === value);
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {option?.label}
                        <button
                          onClick={() => handleFilterChange(key as keyof FilterOptions, '')}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-6">
              <button
                onClick={onClearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={!hasActiveFilters}
              >
                Clear All Filters
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsFilters;