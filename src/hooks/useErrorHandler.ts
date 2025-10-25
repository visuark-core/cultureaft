import { useCallback, useEffect, useState } from 'react';
import { errorHandlingService, ErrorDetails } from '../services/errorHandlingService';

export interface UseErrorHandlerOptions {
  showNotifications?: boolean;
  logErrors?: boolean;
  onError?: (error: ErrorDetails) => void;
}

export interface UseErrorHandlerReturn {
  handleError: (error: any, context?: any) => ErrorDetails;
  clearErrors: () => void;
  errors: ErrorDetails[];
  hasErrors: boolean;
  lastError: ErrorDetails | null;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const {
    logErrors = true,
    onError
  } = options;

  const [errors, setErrors] = useState<ErrorDetails[]>([]);

  const handleError = useCallback((error: any, context?: any): ErrorDetails => {
    const errorDetails = errorHandlingService.processError(error, context);
    
    // Add to local error state
    setErrors(prev => [errorDetails, ...prev.slice(0, 9)]); // Keep last 10 errors
    
    // Call custom error handler if provided
    if (onError) {
      onError(errorDetails);
    }

    return errorDetails;
  }, [onError]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Setup global error handling on mount
  useEffect(() => {
    if (logErrors) {
      errorHandlingService.setupGlobalErrorHandling();
    }
  }, [logErrors]);

  return {
    handleError,
    clearErrors,
    errors,
    hasErrors: errors.length > 0,
    lastError: errors.length > 0 ? errors[0] : null
  };
};

// Specialized hook for API errors
export const useApiErrorHandler = () => {
  const { handleError, ...rest } = useErrorHandler({
    showNotifications: true,
    logErrors: true
  });

  const handleApiError = useCallback((error: any, endpoint?: string) => {
    return handleError(error, {
      type: 'api',
      endpoint,
      timestamp: new Date().toISOString()
    });
  }, [handleError]);

  return {
    handleApiError,
    handleError,
    ...rest
  };
};

// Hook for form validation errors
export const useFormErrorHandler = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { handleError, ...rest } = useErrorHandler({
    showNotifications: false, // Don't show notifications for form errors
    logErrors: false
  });

  const handleFieldError = useCallback((field: string, error: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const handleFormError = useCallback((error: any, formData?: any) => {
    // Handle validation errors from API
    if (error.response?.status === 400 && error.response.data?.fieldErrors) {
      const apiFieldErrors = error.response.data.fieldErrors;
      setFieldErrors(apiFieldErrors);
      return;
    }

    // Handle general form errors
    return handleError(error, {
      type: 'form',
      formData,
      timestamp: new Date().toISOString()
    });
  }, [handleError]);

  return {
    handleFormError,
    handleFieldError,
    clearFieldError,
    clearAllFieldErrors,
    fieldErrors,
    hasFieldErrors: Object.keys(fieldErrors).length > 0,
    handleError,
    ...rest
  };
};