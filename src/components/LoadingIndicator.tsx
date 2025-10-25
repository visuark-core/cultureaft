/**
 * Global Loading Indicator Component
 * Displays loading state with progress and connection status
 */

import React from 'react';
import { useGlobalLoading } from '../hooks/useLoading';
// import { useConnection } from '../hooks/useConnection'; // DISABLED - not used anymore

interface LoadingIndicatorProps {
  className?: string;
  // showConnectionStatus?: boolean; // DISABLED - not used anymore
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  className = ''
  // showConnectionStatus = true // DISABLED - not used anymore
}) => {
  const loadingState = useGlobalLoading();
  // const { isOnline, isApiConnected, connectionQuality, error } = useConnection(); // DISABLED - not used anymore

  if (!loadingState.isLoading) {
    return null;
  }

  // Connection status functions DISABLED - not used anymore
  // const getConnectionStatusColor = () => {
  //   if (!isOnline) return 'text-red-500';
  //   if (!isApiConnected) return 'text-orange-500';
  //   
  //   switch (connectionQuality) {
  //     case 'excellent': return 'text-green-500';
  //     case 'good': return 'text-blue-500';
  //     case 'poor': return 'text-yellow-500';
  //     default: return 'text-gray-500';
  //   }
  // };

  // const getConnectionStatusText = () => {
  //   if (!isOnline) return 'Offline';
  //   if (!isApiConnected) return 'Connecting...';
  //   
  //   switch (connectionQuality) {
  //     case 'excellent': return 'Connected';
  //     case 'good': return 'Connected';
  //     case 'poor': return 'Slow connection';
  //     default: return 'Connected';
  //   }
  // };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-64">
        {/* Loading State */}
        {loadingState.isLoading && (
          <div className="mb-3">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {loadingState.operation || 'Loading...'}
                </div>
                {loadingState.message && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {loadingState.message}
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {typeof loadingState.progress === 'number' && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(loadingState.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${loadingState.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Connection Status - DISABLED to prevent dialog spam */}
        {/* 
        {showConnectionStatus && (
          <div className={`flex items-center space-x-2 ${loadingState.isLoading ? 'border-t border-gray-200 dark:border-gray-700 pt-3' : ''}`}>
            <div className={`w-2 h-2 rounded-full ${
              isOnline && isApiConnected ? 'bg-green-500' : 
              isOnline ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <div className="flex-1">
              <div className={`text-xs font-medium ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </div>
              {error && (
                <div className="text-xs text-red-500 mt-1">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
        */}
      </div>
    </div>
  );
};

export default LoadingIndicator;