import { 
  User, 
  UserSearchFilters, 
  UserListResponse, 
  UserDetailResponse, 
  UserActivityResponse,
  BulkOperationResponse 
} from '../types/user';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class UserService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('adminAccessToken');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get users with filtering and pagination
  async getUsers(filters: UserSearchFilters = {}, page = 1, limit = 20): Promise<UserListResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            acc[key] = value.join(',');
          } else {
            acc[key] = value.toString();
          }
        }
        return acc;
      }, {} as Record<string, string>)
    });

    return this.makeRequest<UserListResponse>(`/api/users?${queryParams}`);
  }

  // Get single user by ID
  async getUserById(userId: string): Promise<UserDetailResponse> {
    return this.makeRequest<UserDetailResponse>(`/api/users/${userId}`);
  }

  // Update user information
  async updateUser(userId: string, userData: Partial<User>): Promise<UserDetailResponse> {
    return this.makeRequest<UserDetailResponse>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Update user status
  async updateUserStatus(userId: string, status: string, reason?: string): Promise<UserDetailResponse> {
    return this.makeRequest<UserDetailResponse>(`/api/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  // Add flag to user
  async addUserFlag(userId: string, flagData: {
    type: string;
    reason: string;
    severity?: string;
  }): Promise<UserDetailResponse> {
    return this.makeRequest<UserDetailResponse>(`/api/users/${userId}/flags`, {
      method: 'POST',
      body: JSON.stringify(flagData),
    });
  }

  // Resolve user flag
  async resolveUserFlag(userId: string, flagId: string, notes?: string): Promise<UserDetailResponse> {
    return this.makeRequest<UserDetailResponse>(`/api/users/${userId}/flags/${flagId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  // Add note to user
  async addUserNote(userId: string, content: string, isPrivate = false): Promise<UserDetailResponse> {
    return this.makeRequest<UserDetailResponse>(`/api/users/${userId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content, isPrivate }),
    });
  }

  // Get user activity
  async getUserActivity(userId: string, page = 1, limit = 50): Promise<UserActivityResponse> {
    return this.makeRequest<UserActivityResponse>(`/api/users/${userId}/activity?page=${page}&limit=${limit}`);
  }

  // Get user analytics
  async getUserAnalytics(userId: string): Promise<{ success: boolean; data: { analytics: any } }> {
    return this.makeRequest(`/api/users/${userId}/analytics`);
  }

  // Delete user (soft delete)
  async deleteUser(userId: string, reason?: string): Promise<UserDetailResponse> {
    return this.makeRequest<UserDetailResponse>(`/api/users/${userId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  // Search users
  async searchUsers(query: string, filters: UserSearchFilters = {}, page = 1, limit = 20): Promise<UserListResponse> {
    const queryParams = new URLSearchParams({
      q: query,
      filters: JSON.stringify(filters),
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.makeRequest<UserListResponse>(`/api/users/search?${queryParams}`);
  }

  // Bulk operations
  async bulkUpdateUsers(updates: Array<{ userId: string; data: Partial<User> }>): Promise<BulkOperationResponse> {
    return this.makeRequest<BulkOperationResponse>('/api/users/bulk/update', {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  }

  async bulkUpdateUserStatus(userIds: string[], status: string, reason?: string): Promise<BulkOperationResponse> {
    return this.makeRequest<BulkOperationResponse>('/api/users/bulk/status', {
      method: 'POST',
      body: JSON.stringify({ userIds, status, reason }),
    });
  }

  async bulkDeleteUsers(userIds: string[], reason?: string): Promise<BulkOperationResponse> {
    return this.makeRequest<BulkOperationResponse>('/api/users/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ userIds, reason }),
    });
  }

  // CSV Export/Import
  async exportUsersCSV(filters: UserSearchFilters = {}, fields: string[] = []): Promise<Blob> {
    const token = localStorage.getItem('adminAccessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/users/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ filters, fields }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(errorData.message || 'Export failed');
    }

    return response.blob();
  }

  async getImportTemplate(): Promise<Blob> {
    const token = localStorage.getItem('adminAccessToken');
    
    const response = await fetch(`${API_BASE_URL}/api/users/import/template`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download template');
    }

    return response.blob();
  }

  async importUsersCSV(file: File, options: {
    dryRun?: boolean;
    updateExisting?: boolean;
  } = {}): Promise<BulkOperationResponse> {
    const token = localStorage.getItem('adminAccessToken');
    const formData = new FormData();
    formData.append('csvFile', file);
    
    if (options.dryRun) {
      formData.append('dryRun', 'true');
    }
    if (options.updateExisting) {
      formData.append('updateExisting', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/api/users/import/csv`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Import failed' }));
      throw new Error(errorData.message || 'Import failed');
    }

    return response.json();
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusColor(status: string): string {
    const colors = {
      active: 'text-green-600 bg-green-100',
      inactive: 'text-gray-600 bg-gray-100',
      suspended: 'text-yellow-600 bg-yellow-100',
      banned: 'text-red-600 bg-red-100',
      pending_verification: 'text-blue-600 bg-blue-100',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  }

  getFlagSeverityColor(severity: string): string {
    const colors = {
      low: 'text-blue-600 bg-blue-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100',
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  }

  getSegmentationColor(segmentation: string): string {
    const colors = {
      new: 'text-blue-600 bg-blue-100',
      active: 'text-green-600 bg-green-100',
      loyal: 'text-purple-600 bg-purple-100',
      at_risk: 'text-yellow-600 bg-yellow-100',
      churned: 'text-red-600 bg-red-100',
      vip: 'text-gold-600 bg-gold-100',
    };
    return colors[segmentation as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  }
}

export default new UserService();