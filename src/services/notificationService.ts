/**
 * Notification service for user feedback on sync failures and other events
 */

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  persistent?: boolean;
  actionLabel?: string;
  actionCallback?: () => void;
  autoHideDelay?: number;
}

export interface NotificationOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  persistent?: boolean;
  actionLabel?: string;
  actionCallback?: () => void;
  autoHideDelay?: number;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private readonly MAX_NOTIFICATIONS = 50;

  /**
   * Shows a notification to the user
   */
  show(
    title: string,
    message: string,
    options: NotificationOptions = {}
  ): string {
    const notification: Notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: options.type || 'info',
      title,
      message,
      timestamp: new Date().toISOString(),
      persistent: options.persistent || false,
      actionLabel: options.actionLabel,
      actionCallback: options.actionCallback,
      autoHideDelay: options.autoHideDelay || (options.type === 'error' ? 10000 : 5000),
    };

    this.notifications.unshift(notification);

    // Limit the number of notifications
    if (this.notifications.length > this.MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
    }

    this.notifyListeners();

    // Auto-hide non-persistent notifications
    if (!notification.persistent && notification.autoHideDelay) {
      setTimeout(() => {
        this.hide(notification.id);
      }, notification.autoHideDelay);
    }

    return notification.id;
  }

  /**
   * Shows a success notification
   */
  showSuccess(title: string, message: string, options: Omit<NotificationOptions, 'type'> = {}): string {
    return this.show(title, message, { ...options, type: 'success' });
  }

  /**
   * Shows an error notification
   */
  showError(title: string, message: string, options: Omit<NotificationOptions, 'type'> = {}): string {
    return this.show(title, message, { ...options, type: 'error', persistent: true });
  }

  /**
   * Shows a warning notification
   */
  showWarning(title: string, message: string, options: Omit<NotificationOptions, 'type'> = {}): string {
    return this.show(title, message, { ...options, type: 'warning' });
  }

  /**
   * Shows an info notification
   */
  showInfo(title: string, message: string, options: Omit<NotificationOptions, 'type'> = {}): string {
    return this.show(title, message, { ...options, type: 'info' });
  }

  /**
   * Hides a specific notification
   */
  hide(notificationId: string): boolean {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    
    if (this.notifications.length < initialLength) {
      this.notifyListeners();
      return true;
    }
    
    return false;
  }

  /**
   * Clears all notifications
   */
  clearAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  /**
   * Clears notifications of a specific type
   */
  clearByType(type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notifications = this.notifications.filter(n => n.type !== type);
    this.notifyListeners();
  }

  /**
   * Gets all current notifications
   */
  getAll(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Gets notifications by type
   */
  getByType(type: 'success' | 'error' | 'warning' | 'info'): Notification[] {
    return this.notifications.filter(n => n.type === type);
  }

  /**
   * Subscribes to notification changes
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifies all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Shows a Google Sheets sync failure notification
   */
  showSyncFailure(operation: string, error: string, retryCallback?: () => void): string {
    return this.showError(
      'Data Sync Failed',
      `Failed to sync ${operation} to Google Sheets: ${error}`,
      {
        persistent: true,
        actionLabel: retryCallback ? 'Retry Now' : undefined,
        actionCallback: retryCallback,
      }
    );
  }

  /**
   * Shows a Google Sheets sync success notification
   */
  showSyncSuccess(operation: string, details?: string): string {
    return this.showSuccess(
      'Data Synced',
      `Successfully synced ${operation} to Google Sheets${details ? `: ${details}` : ''}`,
      {
        autoHideDelay: 3000,
      }
    );
  }

  /**
   * Shows offline mode notification
   */
  showOfflineMode(pendingOperations: number): string {
    return this.showWarning(
      'Offline Mode',
      `${pendingOperations} operations are queued for sync when connection is restored`,
      {
        persistent: true,
      }
    );
  }

  /**
   * Shows connection restored notification
   */
  showConnectionRestored(syncedOperations: number): string {
    return this.showSuccess(
      'Connection Restored',
      `Successfully synced ${syncedOperations} pending operations`,
      {
        autoHideDelay: 5000,
      }
    );
  }

  /**
   * Shows configuration error notification
   */
  showConfigurationError(details: string): string {
    return this.showError(
      'Configuration Error',
      `Google Sheets integration is not properly configured: ${details}`,
      {
        persistent: true,
      }
    );
  }

  /**
   * Gets notification statistics
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    persistent: number;
  } {
    const byType = this.notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const persistent = this.notifications.filter(n => n.persistent).length;

    return {
      total: this.notifications.length,
      byType,
      persistent,
    };
  }

  /**
   * Executes a notification action
   */
  executeAction(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    
    if (notification && notification.actionCallback) {
      try {
        notification.actionCallback();
        return true;
      } catch (error) {
        console.error('Error executing notification action:', error);
        return false;
      }
    }
    
    return false;
  }

  /**
   * Marks a notification as read (for persistent notifications)
   */
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    
    if (notification && notification.persistent) {
      // For now, just hide the notification
      return this.hide(notificationId);
    }
    
    return false;
  }
}

// Global notification service instance
export const notificationService = new NotificationService();

export default NotificationService;