import React, { useState, useEffect } from 'react';
import { errorHandlingService, ErrorDetails, ErrorRecoveryAction } from '../services/errorHandlingService';

interface ErrorNotificationProps {
  maxVisible?: number;
  autoHideDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface NotificationState {
  id: string;
  errorDetails: ErrorDetails;
  recoveryActions: ErrorRecoveryAction[];
  visible: boolean;
  autoHideTimer?: number;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  maxVisible = 3,
  autoHideDelay = 5000,
  position = 'top-right'
}) => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  useEffect(() => {
    const handleError = (errorDetails: ErrorDetails) => {
      // Don't show notifications for low severity errors or validation errors
      if (errorDetails.severity === 'low' || errorDetails.category === 'validation') {
        return;
      }

      const id = `error-${Date.now()}-${Math.random()}`;
      const recoveryActions = errorHandlingService.getRecoveryActions(errorDetails);
      
      const notification: NotificationState = {
        id,
        errorDetails,
        recoveryActions,
        visible: true
      };

      // Auto-hide for non-critical errors
      if (errorDetails.severity !== 'critical' && autoHideDelay > 0) {
        notification.autoHideTimer = setTimeout(() => {
          hideNotification(id);
        }, autoHideDelay);
      }

      setNotifications(prev => {
        const newNotifications = [notification, ...prev];
        // Keep only the most recent notifications
        return newNotifications.slice(0, maxVisible);
      });
    };

    errorHandlingService.addErrorListener(handleError);

    return () => {
      errorHandlingService.removeErrorListener(handleError);
    };
  }, [maxVisible, autoHideDelay]);

  const hideNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, visible: false }
          : notification
      )
    );

    // Remove from DOM after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  };

  const handleAction = (notification: NotificationState, action: ErrorRecoveryAction) => {
    // Clear auto-hide timer
    if (notification.autoHideTimer) {
      clearTimeout(notification.autoHideTimer);
    }

    // Execute action
    action.action();

    // Hide notification
    hideNotification(notification.id);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 border-red-600';
      case 'high':
        return 'bg-orange-500 border-orange-600';
      case 'medium':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      default:
        return 'ℹ️';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm w-full`}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`transform transition-all duration-300 ease-in-out ${
            notification.visible 
              ? 'translate-x-0 opacity-100' 
              : 'translate-x-full opacity-0'
          }`}
        >
          <div className={`rounded-lg shadow-lg border-l-4 ${getSeverityColor(notification.errorDetails.severity)} bg-white p-4`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-lg">
                  {getSeverityIcon(notification.errorDetails.severity)}
                </span>
              </div>
              
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {notification.errorDetails.code.replace(/_/g, ' ')}
                  </h4>
                  <button
                    onClick={() => hideNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {notification.errorDetails.userMessage}
                </p>

                {notification.recoveryActions.length > 0 && (
                  <div className="mt-3 flex space-x-2">
                    {notification.recoveryActions.slice(0, 2).map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleAction(notification, action)}
                        className={`text-xs px-3 py-1 rounded font-medium ${
                          action.type === 'retry'
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : action.type === 'logout'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {notification.errorDetails.severity === 'critical' && (
                  <div className="mt-2 text-xs text-gray-500">
                    This error requires immediate attention
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ErrorNotification;