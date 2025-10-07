const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const SCRIPT_LOAD_TIMEOUT = 10000; // 10 seconds

let loadPromise: Promise<boolean> | null = null;
let isScriptLoaded = false;

/**
 * Check if Razorpay script is already loaded
 */
export const isRazorpayLoaded = (): boolean => {
  return isScriptLoaded && typeof window !== 'undefined' && !!window.Razorpay;
};

/**
 * Remove existing Razorpay script from DOM
 */
const removeExistingScript = (): void => {
  const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
  if (existingScript) {
    existingScript.remove();
  }
};

/**
 * Load Razorpay script with timeout and retry mechanism
 */
export const loadRazorpayScript = (forceReload: boolean = false): Promise<boolean> => {
  // Return existing promise if script is being loaded
  if (loadPromise && !forceReload) {
    return loadPromise;
  }

  // Return resolved promise if script is already loaded
  if (isRazorpayLoaded() && !forceReload) {
    return Promise.resolve(true);
  }

  // Reset state if force reload is requested
  if (forceReload) {
    removeExistingScript();
    isScriptLoaded = false;
    loadPromise = null;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('Razorpay script can only be loaded in a browser environment'));
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.defer = true;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      cleanup();
      loadPromise = null;
      reject(new Error(`Razorpay script loading timed out after ${SCRIPT_LOAD_TIMEOUT}ms`));
    }, SCRIPT_LOAD_TIMEOUT);

    // Cleanup function
    const cleanup = () => {
      clearTimeout(timeoutId);
      script.onload = null;
      script.onerror = null;
    };

    // Success handler
    script.onload = () => {
      cleanup();
      
      // Verify that Razorpay is actually available
      if (typeof window.Razorpay === 'undefined') {
        loadPromise = null;
        reject(new Error('Razorpay script loaded but Razorpay object is not available'));
        return;
      }

      isScriptLoaded = true;
      resolve(true);
    };

    // Error handler
    script.onerror = (event) => {
      cleanup();
      loadPromise = null;
      
      const errorMessage = event instanceof ErrorEvent 
        ? `Failed to load Razorpay script: ${event.message}`
        : 'Failed to load Razorpay script due to network error';
      
      reject(new Error(errorMessage));
    };

    // Add script to document
    try {
      document.body.appendChild(script);
    } catch (error) {
      cleanup();
      loadPromise = null;
      reject(new Error(`Failed to add Razorpay script to document: ${error}`));
    }
  });

  return loadPromise;
};

/**
 * Preload Razorpay script for better performance
 */
export const preloadRazorpayScript = (): void => {
  if (typeof window !== 'undefined' && !isRazorpayLoaded()) {
    loadRazorpayScript().catch(error => {
      console.warn('Failed to preload Razorpay script:', error.message);
    });
  }
};

/**
 * Get script loading status
 */
export const getRazorpayLoadingStatus = (): {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
} => {
  return {
    isLoaded: isRazorpayLoaded(),
    isLoading: !!loadPromise && !isScriptLoaded,
    error: null, // We don't store errors in this utility
  };
};