import React, { useState, useEffect, useCallback } from 'react';
import { User, UserSearchFilters, UserListResponse } from '../../../types/user';
import userService from '../../../services/userService';
import UserFilters from './UserFilters';
import UserList from './UserList';
import UserDetailModal from './UserDetailModal';
import BulkOperations from './BulkOperations';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserSearchFilters>({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    bannedUsers: 0,
    flaggedUsers: 0
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  const fetchUsers = useCallback(async (page = 1, newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: UserListResponse = await userService.getUsers(newFilters, page, 20);
      
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
        setStats({
          totalUsers: response.data.stats.totalUsers,
          activeUsers: response.data.stats.activeUsers,
          suspendedUsers: response.data.stats.suspendedUsers,
          bannedUsers: response.data.stats.bannedUsers,
          flaggedUsers: (response.data.stats as any).flaggedUsers || 0
        });
      } else {
        setError(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers(1, filters);
  }, [filters]);

  const handleFiltersChange = (newFilters: UserSearchFilters) => {
    setFilters(newFilters);
    setSelectedUsers([]);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSelectedUsers([]);
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page, filters);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(users.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUsers(prev => prev.map(user => 
      user._id === updatedUser._id ? updatedUser : user
    ));
    setSelectedUser(updatedUser);
  };

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      let response;
      
      switch (action) {
        case 'updateStatus':
          response = await userService.updateUserStatus(userId, data.status, data.reason);
          break;
        case 'addFlag':
          response = await userService.addUserFlag(userId, data);
          break;
        case 'resolveFlag':
          response = await userService.resolveUserFlag(userId, data.flagId, data.notes);
          break;
        case 'addNote':
          response = await userService.addUserNote(userId, data.content, data.isPrivate);
          break;
        default:
          throw new Error('Unknown action');
      }

      if (response.success) {
        // Update the user in the list
        setUsers(prev => prev.map(user => 
          user._id === userId ? response.data.user : user
        ));
        
        // Update selected user if it's the same
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser(response.data.user);
        }
      }
    } catch (error) {
      console.error('User action failed:', error);
      throw error;
    }
  };

  const handleOperationComplete = () => {
    // Refresh the user list after bulk operations
    fetchUsers(pagination.currentPage, filters);
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => fetchUsers(pagination.currentPage, filters)}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage and monitor all platform users with advanced filtering and bulk operations.
          </p>
        </div>

        {/* Filters */}
        <UserFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          stats={stats}
        />

        {/* Bulk Operations */}
        <BulkOperations
          selectedUsers={selectedUsers}
          onClearSelection={handleClearSelection}
          onOperationComplete={handleOperationComplete}
        />

        {/* User List */}
        <div className="mt-6">
          <UserList
            users={users}
            loading={loading}
            pagination={pagination}
            selectedUsers={selectedUsers}
            onUserSelect={handleUserSelect}
            onSelectAll={handleSelectAll}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onPageChange={handlePageChange}
            onUserAction={handleUserAction}
          />
        </div>

        {/* User Detail Modal */}
        <UserDetailModal
          user={selectedUser}
          isOpen={showUserDetail}
          onClose={() => {
            setShowUserDetail(false);
            setSelectedUser(null);
          }}
          onUserUpdate={handleUserUpdate}
        />
      </div>
    </div>
  );
};

export default UserManagement;