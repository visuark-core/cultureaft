import { RetryService, RetryOptions } from './retryService';
import OfflineStorageService from './offlineStorageService';
import apiClient from './apiClient';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  signupDate: string;
  lastLoginDate?: string;
  isActive: boolean;
  preferences?: Record<string, any>;
}

class GoogleSheetsService {
  private offlineStorage: OfflineStorageService;
  private retryOptions: RetryOptions;

  constructor(customRetryOptions?: RetryOptions) {
    this.offlineStorage = new OfflineStorageService();
    this.retryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      exponentialBase: 2,
      jitter: true,
      retryCondition: RetryService.retryConditions.googleApiErrors,
      ...customRetryOptions,
    };
  }

  /**
   * Validates the configuration and authentication
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ isConnected: boolean }>('/google-sheets/status');
      return response.data.isConnected;
    } catch (error) {
      console.error('Google Sheets configuration validation failed:', error);
      return false;
    }
  }



  /**
   * Adds a new user to the Google Sheet with retry mechanism
   */
  async addUser(userData: UserData, sheetName: string = 'Users'): Promise<boolean> {
    const operation = async () => {
      const response = await apiClient.post<{ success: boolean; message?: string }>('/google-sheets/users', userData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to add user to Google Sheets');
      }

      return true;
    };

    const result = await RetryService.executeWithRetry(operation, this.retryOptions);

    if (result.success) {
      console.log(`Successfully added user ${userData.email} to Google Sheets after ${result.attempts} attempts`);
      return true;
    } else {
      console.error(`Failed to add user ${userData.email} to Google Sheets after ${result.attempts} attempts:`, result.error);
      
      // Store for offline retry
      this.offlineStorage.storeFailedOperation('CREATE', userData, result.error?.message, 1);
      
      // Don't throw error to avoid breaking the signup process
      return false;
    }
  }

  /**
   * Updates an existing user in the Google Sheet with retry mechanism
   */
  async updateUser(userData: UserData, sheetName: string = 'Users'): Promise<boolean> {
    const operation = async () => {
      const response = await apiClient.put<{ success: boolean; message?: string }>('/google-sheets/users', userData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update user in Google Sheets');
      }

      return true;
    };

    const result = await RetryService.executeWithRetry(operation, this.retryOptions);

    if (result.success) {
      console.log(`Successfully updated user ${userData.email} in Google Sheets after ${result.attempts} attempts`);
      return true;
    } else {
      console.error(`Failed to update user ${userData.email} in Google Sheets after ${result.attempts} attempts:`, result.error);
      
      // Store for offline retry
      this.offlineStorage.storeFailedOperation('UPDATE', userData, result.error?.message, 1);
      
      // Don't throw error to avoid breaking the update process
      return false;
    }
  }



  /**
   * Gets all users from the Google Sheet
   */
  async getAllUsers(sheetName: string = 'Users'): Promise<UserData[]> {
    try {
      const response = await apiClient.get<UserData[]>('/google-sheets/users');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get users from Google Sheets');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get users from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Deletes a user from the Google Sheet
   */
  async deleteUser(email: string, sheetName: string = 'Users'): Promise<boolean> {
    try {
      const response = await apiClient.delete<{ success: boolean; message?: string }>(`/google-sheets/users/${encodeURIComponent(email)}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete user from Google Sheets');
      }

      return true;
    } catch (error) {
      console.error('Failed to delete user from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Batch operation to add multiple users
   */
  async addMultipleUsers(users: UserData[], sheetName: string = 'Users'): Promise<boolean> {
    try {
      // For now, add users one by one. Could be optimized with a batch endpoint later
      const results = await Promise.allSettled(
        users.map(user => this.addUser(user, sheetName))
      );
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      return successful === users.length;
    } catch (error) {
      console.error('Failed to add multiple users to Google Sheets:', error);
      throw error;
    }
  }
  /**
   * Processes offline operations that failed previously
   */
  async processOfflineOperations(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const pendingOperations = this.offlineStorage.getPendingOperations();
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    console.log(`Processing ${pendingOperations.length} offline operations`);

    for (const operation of pendingOperations) {
      results.processed++;
      
      try {
        let success = false;
        
        switch (operation.type) {
          case 'CREATE':
            success = await this.addUser(operation.userData);
            break;
          case 'UPDATE':
            success = await this.updateUser(operation.userData);
            break;
          case 'DELETE':
            success = await this.deleteUser(operation.userData.email);
            break;
        }

        if (success) {
          this.offlineStorage.removeOperation(operation.id);
          results.successful++;
          console.log(`Successfully processed offline operation ${operation.id}`);
        } else {
          this.offlineStorage.updateOperationRetry(operation.id, 'Operation failed during processing');
          results.failed++;
          results.errors.push(`Operation ${operation.id} failed`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.offlineStorage.updateOperationRetry(operation.id, errorMessage);
        results.failed++;
        results.errors.push(`Operation ${operation.id}: ${errorMessage}`);
        console.error(`Failed to process offline operation ${operation.id}:`, error);
      }
    }

    console.log(`Offline operations processing complete: ${results.successful} successful, ${results.failed} failed`);
    return results;
  }

  /**
   * Gets offline storage statistics
   */
  getOfflineStorageStats() {
    return this.offlineStorage.getStorageStats();
  }

  /**
   * Checks if there are pending offline operations
   */
  hasPendingOfflineOperations(): boolean {
    return this.offlineStorage.hasPendingOperations();
  }

  /**
   * Clears all offline operations (use with caution)
   */
  clearOfflineOperations(): void {
    this.offlineStorage.clearAllOperations();
  }

  /**
   * Exports offline operations for debugging
   */
  exportOfflineOperations(): string {
    return this.offlineStorage.exportOperations();
  }

  /**
   * Gets connection status and sync information
   */
  async getConnectionStatus(): Promise<{
    isConnected: boolean;
    lastSyncTime?: string;
    pendingOperations: number;
    failedOperations: number;
    error?: string;
  }> {
    try {
      const response = await apiClient.get<{ isConnected: boolean; error?: string }>('/google-sheets/status');
      const isConnected = response.data.isConnected;
      const stats = this.offlineStorage.getStorageStats();
      
      return {
        isConnected,
        lastSyncTime: localStorage.getItem('lastGoogleSheetsSync') || undefined,
        pendingOperations: stats.pendingOperations,
        failedOperations: stats.failedOperations,
        error: response.data.error,
      };
    } catch (error) {
      return {
        isConnected: false,
        pendingOperations: this.offlineStorage.getStorageStats().pendingOperations,
        failedOperations: this.offlineStorage.getStorageStats().failedOperations,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Manually triggers sync of offline operations
   */
  async syncOfflineOperations(): Promise<boolean> {
    try {
      const result = await this.processOfflineOperations();
      
      if (result.successful > 0) {
        localStorage.setItem('lastGoogleSheetsSync', new Date().toISOString());
      }
      
      return result.failed === 0;
    } catch (error) {
      console.error('Failed to sync offline operations:', error);
      return false;
    }
  }

  /**
   * Sets up automatic sync of offline operations
   */
  startAutoSync(intervalMinutes: number = 5): void {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    setInterval(async () => {
      if (this.hasPendingOfflineOperations()) {
        console.log('Auto-syncing offline operations...');
        await this.syncOfflineOperations();
      }
    }, intervalMs);
    
    console.log(`Auto-sync started with ${intervalMinutes} minute interval`);
  }
}

export default GoogleSheetsService;