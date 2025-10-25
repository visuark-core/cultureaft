/**
 * Environment Configuration
 * Centralized management of environment variables with validation
 */

interface EnvironmentConfig {
  // API Configuration
  apiBaseUrl: string;

  // Payment Configuration
  paymentMethod: string;

  // Google Sheets Configuration
  googleSheetsApiKey: string;
  googleSheetsSpreadsheetId: string;
  googleServiceAccountEmail: string;
  googlePrivateKey: string;

  // Application Configuration
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

class EnvironmentValidator {
  private static validateRequired(value: string | undefined, name: string): string {
    if (!value || value.trim() === '') {
      throw new Error(`Environment variable ${name} is required but not set`);
    }
    return value.trim();
  }

  private static validateOptional(value: string | undefined, defaultValue: string = ''): string {
    return value?.trim() || defaultValue;
  }

  private static validateUrl(value: string | undefined, name: string): string {
    const url = this.validateRequired(value, name);
    try {
      new URL(url);
      return url;
    } catch {
      throw new Error(`Environment variable ${name} must be a valid URL`);
    }
  }

  static validate(): EnvironmentConfig {
    const nodeEnv = import.meta.env.MODE || 'development';
    const isDev = nodeEnv === 'development';

    return {
      // API Configuration
      apiBaseUrl: isDev ? 
        this.validateOptional(import.meta.env.VITE_API_BASE_URL, 'http://localhost:5000') :
        this.validateUrl(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL'),

      // Payment Configuration
      paymentMethod: 'cod',

      // Google Sheets Configuration (optional in development)
      googleSheetsApiKey: isDev ?
        this.validateOptional(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY, 'placeholder') :
        this.validateRequired(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY, 'VITE_GOOGLE_SHEETS_API_KEY'),
      googleSheetsSpreadsheetId: isDev ?
        this.validateOptional(import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID, 'placeholder') :
        this.validateRequired(import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID, 'VITE_GOOGLE_SHEETS_SPREADSHEET_ID'),
      googleServiceAccountEmail: isDev ?
        this.validateOptional(import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL, 'placeholder') :
        this.validateRequired(import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL, 'VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL'),
      googlePrivateKey: isDev ?
        this.validateOptional(import.meta.env.VITE_GOOGLE_PRIVATE_KEY, 'placeholder') :
        this.validateRequired(import.meta.env.VITE_GOOGLE_PRIVATE_KEY, 'VITE_GOOGLE_PRIVATE_KEY'),

      // Application Configuration
      isDevelopment: isDev,
      isProduction: nodeEnv === 'production',
      isTest: nodeEnv === 'test'
    };
  }
}

// Validate and export configuration
let config: EnvironmentConfig;

try {
  config = EnvironmentValidator.validate();
} catch (error) {
  console.error('Environment configuration error:', error);
  // Provide fallback configuration for development
  config = {
    apiBaseUrl: 'http://localhost:5000',
    paymentMethod: 'cod',
    googleSheetsApiKey: 'placeholder',
    googleSheetsSpreadsheetId: 'placeholder',
    googleServiceAccountEmail: 'placeholder',
    googlePrivateKey: 'placeholder',
    isDevelopment: true,
    isProduction: false,
    isTest: false
  };

  if (import.meta.env.MODE === 'production') {
    throw error; // Don't allow production to start with invalid config
  }
}

export default config;

// Export individual configurations for convenience
export const {
  apiBaseUrl,
  paymentMethod,
  googleSheetsApiKey,
  googleSheetsSpreadsheetId,
  googleServiceAccountEmail,
  googlePrivateKey,
  isDevelopment,
  isProduction,
  isTest
} = config;