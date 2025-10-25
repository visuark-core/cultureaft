import GoogleSheetsService, { UserData } from './googleSheetsService';
import { validateGoogleSheetsConfig } from '../config/googleSheets';
import { notificationService } from './notificationService';

export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  preferences?: Record<string, any>;
}

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  preferences?: Record<string, any>;
}

class UserDataService {
  private googleSheetsService: GoogleSheetsService | null = null;
  private isGoogleSheetsEnabled: boolean = false;

  constructor() {
    this.initializeGoogleSheets();
  }

  private initializeGoogleSheets(): void {
    try {
      // Skip Google Sheets in development mode
      if (import.meta.env.MODE === 'development') {
        this.isGoogleSheetsEnabled = false;
        return;
      }
      
      if (validateGoogleSheetsConfig()) {
        this.googleSheetsService = new GoogleSheetsService();
        this.isGoogleSheetsEnabled = true;
        console.log('Google Sheets integration initialized successfully');
      } else {
        console.warn('Google Sheets configuration is invalid. Data will not be synced to sheets.');
        this.isGoogleSheetsEnabled = false;
      }
    } catch (error) {
      console.error('Failed to initialize Google Sheets service:', error);
      this.isGoogleSheetsEnabled = false;
    }
  }

  /**
   * Transforms signup form data to UserData format
   */
  private transformSignupDataToUserData(signupData: SignupFormData, userId: string): UserData {
    return {
      id: userId,
      email: signupData.email,
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      phone: signupData.phone,
      dateOfBirth: signupData.dateOfBirth,
      address: signupData.address,
      city: signupData.city,
      state: signupData.state,
      zipCode: signupData.zipCode,
      country: signupData.country,
      signupDate: new Date().toISOString(),
      lastLoginDate: new Date().toISOString(),
      isActive: true,
      preferences: signupData.preferences || {},
    };
  }

  /**
   * Collects and processes user data during signup
   */
  async collectUserDataOnSignup(signupData: SignupFormData): Promise<{
    success: boolean;
    userId: string;
    error?: string;
  }> {
    try {
      // Generate unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Transform signup data to user data format
      const userData = this.transformSignupDataToUserData(signupData, userId);
      
      // Store user data locally (you might want to use a proper database)
      this.storeUserDataLocally(userData);
      
      // Sync to Google Sheets if enabled
      if (this.isGoogleSheetsEnabled && this.googleSheetsService) {
        try {
          const syncSuccess = await this.googleSheetsService.addUser(userData);
          if (syncSuccess) {
            console.log('User data successfully synced to Google Sheets');
            notificationService.showSyncSuccess('user registration', userData.email);
          } else {
            console.warn('User data sync to Google Sheets failed, stored for retry');
            notificationService.showSyncFailure(
              'user registration',
              'Data will be synced when connection is restored',
              () => this.retrySyncForUser(userData.email)
            );
          }
        } catch (sheetsError) {
          console.error('Failed to sync user data to Google Sheets:', sheetsError);
          const errorMessage = sheetsError instanceof Error ? sheetsError.message : 'Unknown error';
          notificationService.showSyncFailure(
            'user registration',
            errorMessage,
            () => this.retrySyncForUser(userData.email)
          );
        }
      }
      
      return {
        success: true,
        userId,
      };
    } catch (error) {
      console.error('Failed to collect user data on signup:', error);
      return {
        success: false,
        userId: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Updates user profile data
   */
  async updateUserProfile(
    userId: string, 
    updates: UserProfileUpdate
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get existing user data
      const existingUserData = this.getUserDataLocally(userId);
      if (!existingUserData) {
        throw new Error('User not found');
      }

      // Merge updates with existing data
      const updatedUserData: UserData = {
        ...existingUserData,
        ...updates,
        lastLoginDate: new Date().toISOString(),
      };

      // Update local storage
      this.storeUserDataLocally(updatedUserData);

      // Sync to Google Sheets if enabled
      if (this.isGoogleSheetsEnabled && this.googleSheetsService) {
        try {
          const syncSuccess = await this.googleSheetsService.updateUser(updatedUserData);
          if (syncSuccess) {
            console.log('User profile successfully updated in Google Sheets');
            notificationService.showSyncSuccess('profile update', updatedUserData.email);
          } else {
            console.warn('User profile sync to Google Sheets failed, stored for retry');
            notificationService.showSyncFailure(
              'profile update',
              'Changes will be synced when connection is restored',
              () => this.retrySyncForUser(updatedUserData.email)
            );
          }
        } catch (sheetsError) {
          console.error('Failed to update user profile in Google Sheets:', sheetsError);
          const errorMessage = sheetsError instanceof Error ? sheetsError.message : 'Unknown error';
          notificationService.showSyncFailure(
            'profile update',
            errorMessage,
            () => this.retrySyncForUser(updatedUserData.email)
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Updates last login date for a user
   */
  async updateLastLogin(email: string): Promise<void> {
    try {
      const userData = this.findUserByEmail(email);
      if (userData) {
        userData.lastLoginDate = new Date().toISOString();
        this.storeUserDataLocally(userData);

        // Sync to Google Sheets if enabled
        if (this.isGoogleSheetsEnabled && this.googleSheetsService) {
          try {
            await this.googleSheetsService.updateUser(userData);
          } catch (sheetsError) {
            console.error('Failed to update last login in Google Sheets:', sheetsError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  /**
   * Stores user data locally (localStorage for now, could be IndexedDB or other storage)
   */
  private storeUserDataLocally(userData: UserData): void {
    try {
      const existingUsers = this.getAllUsersLocally();
      const userIndex = existingUsers.findIndex(user => user.id === userData.id);
      
      if (userIndex >= 0) {
        existingUsers[userIndex] = userData;
      } else {
        existingUsers.push(userData);
      }
      
      localStorage.setItem('userData', JSON.stringify(existingUsers));
    } catch (error) {
      console.error('Failed to store user data locally:', error);
    }
  }

  /**
   * Retrieves user data from local storage
   */
  private getUserDataLocally(userId: string): UserData | null {
    try {
      const users = this.getAllUsersLocally();
      return users.find(user => user.id === userId) || null;
    } catch (error) {
      console.error('Failed to get user data locally:', error);
      return null;
    }
  }

  /**
   * Finds user by email
   */
  private findUserByEmail(email: string): UserData | null {
    try {
      const users = this.getAllUsersLocally();
      return users.find(user => user.email === email) || null;
    } catch (error) {
      console.error('Failed to find user by email:', error);
      return null;
    }
  }

  /**
   * Gets all users from local storage
   */
  private getAllUsersLocally(): UserData[] {
    try {
      const storedData = localStorage.getItem('userData');
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Failed to get all users locally:', error);
      return [];
    }
  }

  /**
   * Validates user data before processing
   */
  validateUserData(userData: Partial<UserData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Valid email is required');
    }

    if (!userData.firstName || userData.firstName.trim().length < 1) {
      errors.push('First name is required');
    }

    if (!userData.lastName || userData.lastName.trim().length < 1) {
      errors.push('Last name is required');
    }

    if (userData.phone && !/^\+?[\d\s\-\(\)]+$/.test(userData.phone)) {
      errors.push('Invalid phone number format');
    }

    if (userData.dateOfBirth) {
      const birthDate = new Date(userData.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        errors.push('Date of birth cannot be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets sync status with Google Sheets
   */
  async getSyncStatus(): Promise<{
    isEnabled: boolean;
    isConnected: boolean;
    lastSyncTime?: string;
    error?: string;
  }> {
    if (!this.isGoogleSheetsEnabled || !this.googleSheetsService) {
      return {
        isEnabled: false,
        isConnected: false,
        error: 'Google Sheets integration is not enabled',
      };
    }

    try {
      const isConnected = await this.googleSheetsService.validateConfiguration();
      return {
        isEnabled: true,
        isConnected,
        lastSyncTime: localStorage.getItem('lastGoogleSheetsSync') || undefined,
      };
    } catch (error) {
      return {
        isEnabled: true,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Manually triggers a sync of all local user data to Google Sheets
   */
  async syncAllUsersToGoogleSheets(): Promise<{
    success: boolean;
    syncedCount: number;
    errors: string[];
  }> {
    if (!this.isGoogleSheetsEnabled || !this.googleSheetsService) {
      return {
        success: false,
        syncedCount: 0,
        errors: ['Google Sheets integration is not enabled'],
      };
    }

    try {
      const localUsers = this.getAllUsersLocally();
      const errors: string[] = [];
      let syncedCount = 0;

      for (const user of localUsers) {
        try {
          await this.googleSheetsService.addUser(user);
          syncedCount++;
        } catch (error) {
          errors.push(`Failed to sync user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update last sync time
      localStorage.setItem('lastGoogleSheetsSync', new Date().toISOString());

      return {
        success: errors.length === 0,
        syncedCount,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
  /**
   * Retries sync for a specific user
   */
  private async retrySyncForUser(email: string): Promise<void> {
    if (!this.isGoogleSheetsEnabled || !this.googleSheetsService) {
      notificationService.showError('Sync Error', 'Google Sheets integration is not enabled');
      return;
    }

    try {
      const userData = this.findUserByEmail(email);
      if (!userData) {
        notificationService.showError('Sync Error', `User ${email} not found locally`);
        return;
      }

      const syncSuccess = await this.googleSheetsService.updateUser(userData);
      if (syncSuccess) {
        notificationService.showSyncSuccess('retry sync', email);
      } else {
        notificationService.showSyncFailure('retry sync', 'Sync failed, will retry automatically');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      notificationService.showSyncFailure('retry sync', errorMessage);
    }
  }

  /**
   * Processes all pending offline operations
   */
  async processPendingOperations(): Promise<{
    success: boolean;
    processed: number;
    successful: number;
    failed: number;
  }> {
    if (!this.isGoogleSheetsEnabled || !this.googleSheetsService) {
      return {
        success: false,
        processed: 0,
        successful: 0,
        failed: 0,
      };
    }

    try {
      const result = await this.googleSheetsService.processOfflineOperations();
      
      if (result.successful > 0) {
        notificationService.showConnectionRestored(result.successful);
      }
      
      if (result.failed > 0) {
        notificationService.showWarning(
          'Partial Sync',
          `${result.failed} operations still pending. Will retry automatically.`
        );
      }

      return {
        success: result.failed === 0,
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
      };
    } catch (error) {
      console.error('Failed to process pending operations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      notificationService.showError('Sync Error', `Failed to process pending operations: ${errorMessage}`);
      
      return {
        success: false,
        processed: 0,
        successful: 0,
        failed: 0,
      };
    }
  }

  /**
   * Starts automatic sync monitoring
   */
  startAutoSync(): void {
    if (!this.isGoogleSheetsEnabled || !this.googleSheetsService) {
      console.warn('Cannot start auto-sync: Google Sheets integration is not enabled');
      return;
    }

    // Start auto-sync with 5-minute intervals
    this.googleSheetsService.startAutoSync(5);

    // Check for offline operations on startup
    setTimeout(() => {
      this.checkOfflineOperations();
    }, 2000);

    // Periodically check connection status
    setInterval(() => {
      this.checkConnectionStatus();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Checks for offline operations and notifies user
   */
  private async checkOfflineOperations(): Promise<void> {
    if (!this.googleSheetsService) return;

    const stats = this.googleSheetsService.getOfflineStorageStats();
    if (stats.pendingOperations > 0) {
      notificationService.showOfflineMode(stats.pendingOperations);
    }
  }

  /**
   * Checks connection status and processes pending operations if connected
   */
  private async checkConnectionStatus(): Promise<void> {
    if (!this.googleSheetsService) return;

    try {
      const status = await this.googleSheetsService.getConnectionStatus();
      
      if (status.isConnected && status.pendingOperations > 0) {
        // Connection is restored and we have pending operations
        await this.processPendingOperations();
      } else if (!status.isConnected && status.pendingOperations > 0) {
        // Still offline with pending operations
        console.log(`Still offline with ${status.pendingOperations} pending operations`);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  }

  /**
   * Gets comprehensive sync status
   */
  async getComprehensiveSyncStatus(): Promise<{
    isEnabled: boolean;
    isConnected: boolean;
    lastSyncTime?: string;
    pendingOperations: number;
    failedOperations: number;
    totalOperations: number;
    configurationValid: boolean;
    error?: string;
  }> {
    if (!this.isGoogleSheetsEnabled || !this.googleSheetsService) {
      return {
        isEnabled: false,
        isConnected: false,
        pendingOperations: 0,
        failedOperations: 0,
        totalOperations: 0,
        configurationValid: false,
        error: 'Google Sheets integration is not enabled',
      };
    }

    try {
      const connectionStatus = await this.googleSheetsService.getConnectionStatus();
      const stats = this.googleSheetsService.getOfflineStorageStats();

      return {
        isEnabled: true,
        isConnected: connectionStatus.isConnected,
        lastSyncTime: connectionStatus.lastSyncTime,
        pendingOperations: connectionStatus.pendingOperations,
        failedOperations: connectionStatus.failedOperations,
        totalOperations: stats.totalOperations,
        configurationValid: connectionStatus.isConnected,
        error: connectionStatus.error,
      };
    } catch (error) {
      return {
        isEnabled: true,
        isConnected: false,
        pendingOperations: 0,
        failedOperations: 0,
        totalOperations: 0,
        configurationValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Manually triggers a full sync
   */
  async triggerManualSync(): Promise<boolean> {
    if (!this.isGoogleSheetsEnabled || !this.googleSheetsService) {
      notificationService.showError('Sync Error', 'Google Sheets integration is not enabled');
      return false;
    }

    try {
      notificationService.showInfo('Sync Started', 'Manually syncing all pending operations...');
      
      const success = await this.googleSheetsService.syncOfflineOperations();
      
      if (success) {
        notificationService.showSyncSuccess('manual sync', 'All operations synced successfully');
      } else {
        notificationService.showWarning('Partial Sync', 'Some operations are still pending');
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      notificationService.showSyncFailure('manual sync', errorMessage);
      return false;
    }
  }
}

export default UserDataService;