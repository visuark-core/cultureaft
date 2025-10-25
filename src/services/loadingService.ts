/**
 * Loading State Management Service
 * Centralized loading state management for better user feedback
 */

export interface LoadingState {
  isLoading: boolean;
  operation: string | null;
  progress?: number;
  message?: string;
}

export interface LoadingListener {
  (state: LoadingState): void;
}

class LoadingService {
  private loadingStates: Map<string, LoadingState> = new Map();
  private listeners: LoadingListener[] = [];
  private globalState: LoadingState = {
    isLoading: false,
    operation: null
  };

  /**
   * Start loading for a specific operation
   */
  startLoading(operationId: string, message?: string): void {
    const state: LoadingState = {
      isLoading: true,
      operation: operationId,
      message,
      progress: 0
    };

    this.loadingStates.set(operationId, state);
    this.updateGlobalState();
  }

  /**
   * Update loading progress for an operation
   */
  updateProgress(operationId: string, progress: number, message?: string): void {
    const state = this.loadingStates.get(operationId);
    if (state) {
      state.progress = Math.max(0, Math.min(100, progress));
      if (message) {
        state.message = message;
      }
      this.loadingStates.set(operationId, state);
      this.updateGlobalState();
    }
  }

  /**
   * Update loading message for an operation
   */
  updateMessage(operationId: string, message: string): void {
    const state = this.loadingStates.get(operationId);
    if (state) {
      state.message = message;
      this.loadingStates.set(operationId, state);
      this.updateGlobalState();
    }
  }

  /**
   * Stop loading for a specific operation
   */
  stopLoading(operationId: string): void {
    this.loadingStates.delete(operationId);
    this.updateGlobalState();
  }

  /**
   * Stop all loading operations
   */
  stopAllLoading(): void {
    this.loadingStates.clear();
    this.updateGlobalState();
  }

  /**
   * Check if a specific operation is loading
   */
  isLoading(operationId: string): boolean {
    const state = this.loadingStates.get(operationId);
    return state?.isLoading || false;
  }

  /**
   * Check if any operation is loading
   */
  isAnyLoading(): boolean {
    return this.globalState.isLoading;
  }

  /**
   * Get loading state for a specific operation
   */
  getLoadingState(operationId: string): LoadingState | null {
    return this.loadingStates.get(operationId) || null;
  }

  /**
   * Get global loading state
   */
  getGlobalState(): LoadingState {
    return { ...this.globalState };
  }

  /**
   * Get all active loading operations
   */
  getActiveOperations(): string[] {
    return Array.from(this.loadingStates.keys());
  }

  /**
   * Update global loading state based on individual operations
   */
  private updateGlobalState(): void {
    const activeStates = Array.from(this.loadingStates.values());
    
    if (activeStates.length === 0) {
      this.globalState = {
        isLoading: false,
        operation: null
      };
    } else {
      // Find the most recent or highest priority operation
      const primaryState = activeStates[activeStates.length - 1];
      
      this.globalState = {
        isLoading: true,
        operation: primaryState.operation,
        message: primaryState.message,
        progress: this.calculateOverallProgress(activeStates)
      };
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Calculate overall progress from multiple operations
   */
  private calculateOverallProgress(states: LoadingState[]): number | undefined {
    const statesWithProgress = states.filter(state => 
      typeof state.progress === 'number'
    );

    if (statesWithProgress.length === 0) {
      return undefined;
    }

    const totalProgress = statesWithProgress.reduce(
      (sum, state) => sum + (state.progress || 0), 
      0
    );

    return Math.round(totalProgress / statesWithProgress.length);
  }

  /**
   * Add loading state listener
   */
  addListener(listener: LoadingListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Remove loading state listener
   */
  removeListener(listener: LoadingListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.globalState);
      } catch (error) {
        console.error('Error in loading state listener:', error);
      }
    });
  }

  /**
   * Wrap an async operation with loading state management
   */
  async withLoading<T>(
    operationId: string,
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> {
    try {
      this.startLoading(operationId, message);
      const result = await operation();
      return result;
    } finally {
      this.stopLoading(operationId);
    }
  }

  /**
   * Wrap an async operation with progress tracking
   */
  async withProgress<T>(
    operationId: string,
    operation: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
    initialMessage?: string
  ): Promise<T> {
    try {
      this.startLoading(operationId, initialMessage);
      
      const updateProgress = (progress: number, message?: string) => {
        this.updateProgress(operationId, progress, message);
      };

      const result = await operation(updateProgress);
      return result;
    } finally {
      this.stopLoading(operationId);
    }
  }
}

// Create singleton instance
const loadingService = new LoadingService();

export default loadingService;