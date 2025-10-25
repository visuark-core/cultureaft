/**
 * React hook for loading state management
 */

import { useState, useEffect, useCallback } from 'react';
import loadingService, { LoadingState } from '../services/loadingService';

/**
 * Hook for global loading state
 */
export function useGlobalLoading() {
  const [loadingState, setLoadingState] = useState<LoadingState>(
    loadingService.getGlobalState()
  );

  useEffect(() => {
    const unsubscribe = loadingService.addListener(setLoadingState);
    return unsubscribe;
  }, []);

  return loadingState;
}

/**
 * Hook for specific operation loading state
 */
export function useOperationLoading(operationId: string) {
  const [loadingState, setLoadingState] = useState<LoadingState | null>(
    loadingService.getLoadingState(operationId)
  );

  useEffect(() => {
    const unsubscribe = loadingService.addListener((globalState) => {
      const operationState = loadingService.getLoadingState(operationId);
      setLoadingState(operationState);
    });

    return unsubscribe;
  }, [operationId]);

  const startLoading = useCallback((message?: string) => {
    loadingService.startLoading(operationId, message);
  }, [operationId]);

  const updateProgress = useCallback((progress: number, message?: string) => {
    loadingService.updateProgress(operationId, progress, message);
  }, [operationId]);

  const updateMessage = useCallback((message: string) => {
    loadingService.updateMessage(operationId, message);
  }, [operationId]);

  const stopLoading = useCallback(() => {
    loadingService.stopLoading(operationId);
  }, [operationId]);

  return {
    loadingState,
    isLoading: loadingState?.isLoading || false,
    progress: loadingState?.progress,
    message: loadingState?.message,
    startLoading,
    updateProgress,
    updateMessage,
    stopLoading
  };
}

/**
 * Hook for wrapping async operations with loading state
 */
export function useAsyncOperation() {
  const withLoading = useCallback(async <T>(
    operationId: string,
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    return loadingService.withLoading(operationId, operation, message);
  }, []);

  const withProgress = useCallback(async <T>(
    operationId: string,
    operation: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
    initialMessage?: string
  ): Promise<T> => {
    return loadingService.withProgress(operationId, operation, initialMessage);
  }, []);

  return {
    withLoading,
    withProgress
  };
}