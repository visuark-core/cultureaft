/**
 * React hook for connection monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import connectionMonitor, { ConnectionStatus } from '../services/connectionMonitor';

/**
 * Hook for monitoring connection status
 */
export function useConnection() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    connectionMonitor.getStatus()
  );

  useEffect(() => {
    const unsubscribe = connectionMonitor.addListener(setConnectionStatus);
    return unsubscribe;
  }, []);

  const forceCheck = useCallback(async () => {
    return connectionMonitor.forceCheck();
  }, []);

  const getConnectionQuality = useCallback(() => {
    return connectionMonitor.getConnectionQuality();
  }, []);

  const isConnectionStable = useCallback(() => {
    return connectionMonitor.isConnectionStable();
  }, []);

  return {
    connectionStatus,
    isOnline: connectionStatus.isOnline,
    isApiConnected: connectionStatus.isApiConnected,
    latency: connectionStatus.latency,
    error: connectionStatus.error,
    lastChecked: connectionStatus.lastChecked,
    connectionQuality: getConnectionQuality(),
    isStable: isConnectionStable(),
    forceCheck
  };
}