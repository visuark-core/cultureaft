/**
 * Offline storage service for handling failed Google Sheets operations
 */

import { UserData } from './googleSheetsService';

export interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  userData: UserData;
  timestamp: string;
  retryCount: number;
  lastError?: string;
  priority: number;
}

export interface OfflineStorageStats {
  totalOperations: number;
  pendingOperations: number;
  failedOperations: number;
  oldestOperation?: string;
  newestOperation?: string;
}

class OfflineStorageService {
  private readonly STORAGE_KEY = 'offline_google_sheets_operations';
  private readonly MAX_OPERATIONS = 1000; // Maximum number of operations to store
  private readonly MAX_AGE_DAYS = 30; // Maximum age of operations in days

  /**
   * Stores a failed operation for later retry
   */
  storeFailedOperation(
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    userData: UserData,
    error?: string,
    priority: number = 0
  ): string {
    const operation: OfflineOperation = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      userData,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      lastError: error,
      priority,
    };

    const operations = this.getAllOperations();
    operations.push(operation);

    // Clean up old operations
    this.cleanupOperations(operations);

    // Sort by priority and timestamp
    operations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(); // Older first
    });

    // Limit the number of operations
    if (operations.length > this.MAX_OPERATIONS) {
      operations.splice(this.MAX_OPERATIONS);
    }

    this.saveOperations(operations);
    console.log(`Stored offline operation ${operation.id} for later retry`);
    
    return operation.id;
  }

  /**
   * Gets all stored operations
   */
  getAllOperations(): OfflineOperation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const operations: OfflineOperation[] = JSON.parse(stored);
      return this.cleanupOperations(operations);
    } catch (error) {
      console.error('Failed to load offline operations:', error);
      return [];
    }
  }

  /**
   * Gets pending operations (not yet successfully synced)
   */
  getPendingOperations(): OfflineOperation[] {
    return this.getAllOperations().filter(op => op.retryCount < 5); // Max 5 retry attempts
  }

  /**
   * Updates an operation's retry count and error
   */
  updateOperationRetry(operationId: string, error?: string): boolean {
    const operations = this.getAllOperations();
    const operationIndex = operations.findIndex(op => op.id === operationId);

    if (operationIndex === -1) {
      return false;
    }

    operations[operationIndex].retryCount++;
    operations[operationIndex].lastError = error;
    operations[operationIndex].timestamp = new Date().toISOString(); // Update timestamp for retry ordering

    this.saveOperations(operations);
    return true;
  }

  /**
   * Removes an operation (when successfully synced)
   */
  removeOperation(operationId: string): boolean {
    const operations = this.getAllOperations();
    const initialLength = operations.length;
    const filteredOperations = operations.filter(op => op.id !== operationId);

    if (filteredOperations.length < initialLength) {
      this.saveOperations(filteredOperations);
      console.log(`Removed offline operation ${operationId}`);
      return true;
    }

    return false;
  }

  /**
   * Clears all operations
   */
  clearAllOperations(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('Cleared all offline operations');
  }

  /**
   * Gets statistics about stored operations
   */
  getStorageStats(): OfflineStorageStats {
    const operations = this.getAllOperations();
    const pendingOperations = operations.filter(op => op.retryCount < 5);
    const failedOperations = operations.filter(op => op.retryCount >= 5);

    const timestamps = operations.map(op => op.timestamp).sort();

    return {
      totalOperations: operations.length,
      pendingOperations: pendingOperations.length,
      failedOperations: failedOperations.length,
      oldestOperation: timestamps[0],
      newestOperation: timestamps[timestamps.length - 1],
    };
  }

  /**
   * Exports operations for backup or debugging
   */
  exportOperations(): string {
    const operations = this.getAllOperations();
    return JSON.stringify(operations, null, 2);
  }

  /**
   * Imports operations from backup
   */
  importOperations(operationsJson: string): boolean {
    try {
      const operations: OfflineOperation[] = JSON.parse(operationsJson);
      
      // Validate the structure
      if (!Array.isArray(operations)) {
        throw new Error('Invalid operations format');
      }

      for (const op of operations) {
        if (!op.id || !op.type || !op.userData || !op.timestamp) {
          throw new Error('Invalid operation structure');
        }
      }

      this.saveOperations(operations);
      console.log(`Imported ${operations.length} offline operations`);
      return true;
    } catch (error) {
      console.error('Failed to import operations:', error);
      return false;
    }
  }

  /**
   * Gets operations by type
   */
  getOperationsByType(type: 'CREATE' | 'UPDATE' | 'DELETE'): OfflineOperation[] {
    return this.getAllOperations().filter(op => op.type === type);
  }

  /**
   * Gets operations for a specific user
   */
  getOperationsForUser(userEmail: string): OfflineOperation[] {
    return this.getAllOperations().filter(op => op.userData.email === userEmail);
  }

  /**
   * Checks if there are any pending operations
   */
  hasPendingOperations(): boolean {
    return this.getPendingOperations().length > 0;
  }

  /**
   * Gets the next operation to retry
   */
  getNextOperationToRetry(): OfflineOperation | null {
    const pending = this.getPendingOperations();
    if (pending.length === 0) {
      return null;
    }

    // Sort by priority and retry count (fewer retries first)
    pending.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.retryCount - b.retryCount;
    });

    return pending[0];
  }

  /**
   * Processes a batch of operations
   */
  getBatchOperations(batchSize: number = 10): OfflineOperation[] {
    const pending = this.getPendingOperations();
    return pending.slice(0, batchSize);
  }

  /**
   * Cleans up old operations
   */
  private cleanupOperations(operations: OfflineOperation[]): OfflineOperation[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.MAX_AGE_DAYS);

    return operations.filter(op => {
      const operationDate = new Date(op.timestamp);
      return operationDate > cutoffDate;
    });
  }

  /**
   * Saves operations to localStorage
   */
  private saveOperations(operations: OfflineOperation[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error('Failed to save offline operations:', error);
      
      // If storage is full, try to clean up and save again
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, cleaning up old operations');
        const recentOperations = operations.slice(-Math.floor(this.MAX_OPERATIONS / 2));
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentOperations));
        } catch (secondError) {
          console.error('Failed to save operations even after cleanup:', secondError);
        }
      }
    }
  }

  /**
   * Validates operation data
   */
  private validateOperation(operation: OfflineOperation): boolean {
    if (!operation.id || !operation.type || !operation.userData || !operation.timestamp) {
      return false;
    }

    if (!['CREATE', 'UPDATE', 'DELETE'].includes(operation.type)) {
      return false;
    }

    if (!operation.userData.email || !operation.userData.firstName || !operation.userData.lastName) {
      return false;
    }

    return true;
  }

  /**
   * Gets storage usage information
   */
  getStorageUsage(): {
    usedBytes: number;
    estimatedMaxBytes: number;
    usagePercentage: number;
  } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY) || '';
      const usedBytes = new Blob([data]).size;
      const estimatedMaxBytes = 5 * 1024 * 1024; // Estimate 5MB localStorage limit
      const usagePercentage = (usedBytes / estimatedMaxBytes) * 100;

      return {
        usedBytes,
        estimatedMaxBytes,
        usagePercentage: Math.min(usagePercentage, 100),
      };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return {
        usedBytes: 0,
        estimatedMaxBytes: 0,
        usagePercentage: 0,
      };
    }
  }
}

export default OfflineStorageService;