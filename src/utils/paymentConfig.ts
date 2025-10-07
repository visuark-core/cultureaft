import { PaymentConfig } from '../types/payment';

/**
 * Default payment configuration
 */
const DEFAULT_CONFIG: PaymentConfig = {
  keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  currency: 'INR',
  companyName: 'Handicraft Store',
  themeColor: '#3B82F6',
  timeout: 30000,
  retryAttempts: 3,
};

/**
 * Environment-specific configurations
 */
const ENVIRONMENT_CONFIGS: Record<string, Partial<PaymentConfig>> = {
  development: {
    companyName: 'Handicraft Store (Dev)',
    themeColor: '#10B981', // Green for development
  },
  staging: {
    companyName: 'Handicraft Store (Staging)',
    themeColor: '#F59E0B', // Yellow for staging
  },
  production: {
    companyName: 'Handicraft Store',
    themeColor: '#3B82F6', // Blue for production
  },
};

/**
 * Get environment-specific payment configuration
 */
export const getPaymentConfig = (): PaymentConfig => {
  const environment = import.meta.env.MODE || 'development';
  const envConfig = ENVIRONMENT_CONFIGS[environment] || {};
  
  return {
    ...DEFAULT_CONFIG,
    ...envConfig,
  };
};

/**
 * Validate payment configuration
 */
export const validatePaymentConfig = (config: PaymentConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!config.keyId) {
    errors.push('Razorpay Key ID is required');
  } else if (!config.keyId.startsWith('rzp_')) {
    warnings.push('Razorpay Key ID should start with "rzp_"');
  }

  if (!config.currency) {
    errors.push('Currency is required');
  } else if (config.currency !== 'INR') {
    warnings.push('Only INR currency is fully supported');
  }

  if (!config.companyName) {
    errors.push('Company name is required');
  }

  // Optional fields validation
  if (config.timeout && (config.timeout < 5000 || config.timeout > 300000)) {
    warnings.push('Timeout should be between 5 seconds and 5 minutes');
  }

  if (config.retryAttempts && (config.retryAttempts < 1 || config.retryAttempts > 5)) {
    warnings.push('Retry attempts should be between 1 and 5');
  }

  if (config.themeColor && !isValidHexColor(config.themeColor)) {
    warnings.push('Theme color should be a valid hex color');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Check if a string is a valid hex color
 */
const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Get Razorpay checkout options with branding
 */
export const getRazorpayCheckoutOptions = (config: PaymentConfig) => {
  return {
    theme: {
      color: config.themeColor,
    },
    modal: {
      backdropclose: false,
      escape: true,
      handleback: true,
      confirm_close: true,
      ondismiss: () => {
        console.log('Payment modal dismissed');
      },
    },
    retry: {
      enabled: true,
      max_count: config.retryAttempts || 3,
    },
    timeout: config.timeout || 300, // Razorpay expects timeout in seconds
    remember_customer: true,
  };
};

/**
 * Get company branding information
 */
export const getCompanyBranding = (config: PaymentConfig) => {
  return {
    name: config.companyName,
    logo: config.companyLogo,
    theme_color: config.themeColor,
  };
};

/**
 * Check if we're in test mode
 */
export const isTestMode = (): boolean => {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
  return keyId.includes('test') || import.meta.env.MODE === 'development';
};

/**
 * Get environment information
 */
export const getEnvironmentInfo = () => {
  return {
    mode: import.meta.env.MODE,
    isTestMode: isTestMode(),
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };
};

/**
 * Log configuration status (for debugging)
 */
export const logConfigurationStatus = (): void => {
  if (import.meta.env.DEV) {
    const config = getPaymentConfig();
    const validation = validatePaymentConfig(config);
    const envInfo = getEnvironmentInfo();

    console.group('🔧 Payment Configuration Status');
    console.log('Environment:', envInfo);
    console.log('Configuration:', config);
    console.log('Validation:', validation);
    
    if (validation.errors.length > 0) {
      console.error('❌ Configuration Errors:', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Configuration Warnings:', validation.warnings);
    }
    
    if (validation.isValid) {
      console.log('✅ Configuration is valid');
    }
    
    console.groupEnd();
  }
};