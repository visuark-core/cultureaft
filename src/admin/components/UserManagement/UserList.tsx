import React, { useState } from 'react';
import { 
  Eye, 
  Edit, 
  Ban, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Mail, 
  Phone, 
  Calendar,
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users
} from 'lucide-react';
import { User } from '../../../types/user';
import userService from '../../../services/userService';

interface UserListProps {
  users: User[];
  loading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  selectedUsers: string[];
  onUserSelect: (userId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onPageChange: (page: number) => void;
  onUserAction: (userId: string, action: string, data?: any) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  loading,
  pagination,
  selectedUsers,
  onUserSelect,
  onSelectAll,
  onViewUser,
  onEditUser,
  onPageChange,
  onUserAction
}) => {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await onUserAction(userId, 'updateStatus', { status: newStatus });
      setActionMenuOpen(null);
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleAddFlag = async (userId: string) => {
    try {
      await onUserAction(userId, 'addFlag', {
        type: 'manual_review',
        reason: 'Flagged for manual review',
        severity: 'medium'
      });
      setActionMenuOpen(null);
    } catch (error) {
      console.error('Failed to add flag:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      suspended: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      banned: { color: 'bg-red-100 text-red-800', icon: Ban },
      pending_verification: { color: 'bg-blue-100 text-blue-800', icon: Clock }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getSegmentBadge = (segment: string) => {
    const segmentConfig = {
      new: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      loyal: 'bg-purple-100 text-purple-800',
      at_risk: 'bg-yellow-100 text-yellow-800',
      churned: 'bg-red-100 text-red-800',
      vip: 'bg-gold-100 text-gold-800'
    };

    const color = segmentConfig[segment as keyof typeof segmentConfig] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {segment.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Users className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Select All ({selectedUsers.length} selected)
              </span>
            </label>
          </div>
          <div className="text-sm text-gray-600">
            Showing {users.length} of {pagination.totalUsers.toLocaleString()} users
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Segment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Spent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => onUserSelect(user._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4"
                    />
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.firstName ? user.firstName.charAt(0) : ''}{user.lastName ? user.lastName.charAt(0) : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <span>{user.email}</span>
                          {user.emailVerified && (
                            <Mail className="h-3 w-3 text-green-500" />
                          )}
                          {user.phone && (
                            <>
                              <span>•</span>
                              <span>{user.phone}</span>
                              {user.phoneVerified && (
                                <Phone className="h-3 w-3 text-green-500" />
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {user.customerId}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getSegmentBadge(user.analytics?.segmentation || 'new')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <ShoppingBag className="h-4 w-4 mr-1 text-gray-400" />
                    {user.analytics?.totalOrders || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <IndianRupee className="h-4 w-4 mr-1 text-gray-400" />
                    {userService.formatCurrency(user.analytics?.totalSpent || 0)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.flags && user.flags.length > 0 ? (
                    <div className="flex items-center">
                      <Flag className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-600 font-medium">
                        {user.flags.length}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">None</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {userService.formatDate(user.registrationDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewUser(user)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                      title="Edit User"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === user._id ? null : user._id)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                        title="More Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {actionMenuOpen === user._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            {user.status === 'active' ? (
                              <button
                                onClick={() => handleStatusChange(user._id, 'suspended')}
                                className="block w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                              >
                                Suspend User
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(user._id, 'active')}
                                className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                              >
                                Activate User
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusChange(user._id, 'banned')}
                              className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              Ban User
                            </button>
                            <button
                              onClick={() => handleAddFlag(user._id)}
                              className="block w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
                            >
                              Add Flag
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                if (pageNum > pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pageNum === pagination.currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;