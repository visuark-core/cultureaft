import React, { useState } from 'react';
import { Search, Filter, X, Calendar, Mail, Phone } from 'lucide-react';
import { UserSearchFilters } from '../../../types/user';

interface UserFiltersProps {
  filters: UserSearchFilters;
  onFiltersChange: (filters: UserSearchFilters) => void;
  onClearFilters: () => void;
  stats?: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    bannedUsers: number;
    flaggedUsers: number;
  };
}

const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  stats
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof UserSearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.suspendedUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Suspended</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.bannedUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Banned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.flaggedUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Flagged</div>
          </div>
        </div>
      )}

      {/* Search and Basic Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search users by name, email, phone, or customer ID..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Quick Filters Row */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="pending_verification">Pending Verification</option>
          </select>

          <select
            value={filters.segmentation || ''}
            onChange={(e) => handleFilterChange('segmentation', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Segments</option>
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="loyal">Loyal</option>
            <option value="at_risk">At Risk</option>
            <option value="churned">Churned</option>
            <option value="vip">VIP</option>
          </select>

          <select
            value={filters.hasFlags?.toString() || ''}
            onChange={(e) => handleFilterChange('hasFlags', e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Users</option>
            <option value="true">Flagged Users</option>
            <option value="false">Non-Flagged Users</option>
          </select>

          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <select
              value={filters.emailVerified?.toString() || ''}
              onChange={(e) => handleFilterChange('emailVerified', e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Email Status</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <select
              value={filters.phoneVerified?.toString() || ''}
              onChange={(e) => handleFilterChange('phoneVerified', e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Phone Status</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Advanced</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration From
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="date"
                    value={filters.registrationDateFrom || ''}
                    onChange={(e) => handleFilterChange('registrationDateFrom', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration To
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="date"
                    value={filters.registrationDateTo || ''}
                    onChange={(e) => handleFilterChange('registrationDateTo', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Order Count Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Orders
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.minOrders || ''}
                  onChange={(e) => handleFilterChange('minOrders', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Orders
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxOrders || ''}
                  onChange={(e) => handleFilterChange('maxOrders', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="∞"
                />
              </div>

              {/* Spending Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Spent (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={filters.minSpent || ''}
                  onChange={(e) => handleFilterChange('minSpent', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Spent (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={filters.maxSpent || ''}
                  onChange={(e) => handleFilterChange('maxSpent', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="∞"
                />
              </div>

              {/* Flag Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flag Type
                </label>
                <select
                  value={filters.flagType || ''}
                  onChange={(e) => handleFilterChange('flagType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Flag Types</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                  <option value="multiple_failed_logins">Failed Logins</option>
                  <option value="unusual_spending">Unusual Spending</option>
                  <option value="policy_violation">Policy Violation</option>
                  <option value="fraud_suspected">Fraud Suspected</option>
                  <option value="account_compromise">Account Compromise</option>
                  <option value="spam_behavior">Spam Behavior</option>
                  <option value="manual_review">Manual Review</option>
                  <option value="payment_issues">Payment Issues</option>
                  <option value="security_concern">Security Concern</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFilters;