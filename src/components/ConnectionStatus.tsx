/**
 * Connection Status Component
 * Displays detailed connection information and allows manual refresh
 */

import React from 'react';
import { useConnection } from '../hooks/useConnection';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className = '',
  showDetails = false,
  compact = false
}) => {
  const {
    isOnline,
    isApiConnected,
    latency,
    error,
    lastChecked,
    connectionQuality,
    isStable,
    forceCheck
  } = useConnection();

  const getStatusIcon = () => {
    if (!isOnline) return '🔴';
    if (!isApiConnected) return '🟡';
    
    switch (connectionQuality) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'poor': return '🟡';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (!isApiConnected) return 'API Disconnected';
    
    switch (connectionQuality) {
      case 'excellent': return 'Excellent Connection';
      case 'good': return 'Good Connection';
      case 'poor': return 'Poor Connection';
      default: return 'Connected';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600 bg-red-50 border-red-200';
    if (!isApiConnected) return 'text-orange-600 bg-orange-50 border-orange-200';
    
    switch (connectionQuality) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'poor': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleRefresh = async () => {
    try {
      await forceCheck();
    } catch (error) {
      console.error('Failed to refresh connection status:', error);
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <span className="text-sm">{getStatusIcon()}</span>
        <span className={`text-xs font-medium ${
          isStable ? 'text-green-600' : 'text-red-600'
        }`}>
          {isStable ? 'Connected' : 'Connection Issues'}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getStatusIcon()}</span>
          <div>
            <div className="font-medium text-sm">
              {getStatusText()}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          className="text-xs px-2 py-1 rounded border border-current hover:bg-current hover:text-white transition-colors"
          title="Refresh connection status"
        >
          Refresh
        </button>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium">Network Status</div>
              <div className="mt-1">
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
            
            <div>
              <div className="font-medium">API Status</div>
              <div className="mt-1">
                {isApiConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            
            {latency !== null && (
              <div>
                <div className="font-medium">Latency</div>
                <div className="mt-1">
                  {latency}ms
                </div>
              </div>
            )}
            
            <div>
              <div className="font-medium">Last Checked</div>
              <div className="mt-1">
                {lastChecked.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;