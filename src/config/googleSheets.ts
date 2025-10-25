/**
 * Google Sheets configuration and validation utilities
 */

export interface GoogleSheetsEnvironment {
  apiKey: string;
  spreadsheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

/**
 * Validates Google Sheets environment variables
 */
export function validateGoogleSheetsConfig(): boolean {
  try {
    const config = getGoogleSheetsConfig();
    const requiredFields = ['apiKey', 'spreadsheetId', 'serviceAccountEmail', 'privateKey'];
    
    const missingFields = requiredFields.filter(field => !config[field as keyof GoogleSheetsEnvironment]);
    
    if (missingFields.length > 0) {
      console.error('Missing Google Sheets configuration fields:', missingFields);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating Google Sheets configuration:', error);
    return false;
  }
}

/**
 * Gets Google Sheets configuration from centralized environment config
 */
export function getGoogleSheetsConfig(): GoogleSheetsEnvironment {
  // Use dynamic import to avoid circular dependencies and require issues
  try {
    // For development, return placeholder values
    if (import.meta.env.MODE === 'development') {
      return {
        apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || 'placeholder',
        spreadsheetId: import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID || 'placeholder',
        serviceAccountEmail: import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL || 'placeholder',
        privateKey: (import.meta.env.VITE_GOOGLE_PRIVATE_KEY || 'placeholder').replace(/\\n/g, '\n'),
      };
    }
    
    // For production, import from environment config
    const config = import('./environment');
    return config.then(env => ({
      apiKey: env.googleSheetsApiKey,
      spreadsheetId: env.googleSheetsSpreadsheetId,
      serviceAccountEmail: env.googleServiceAccountEmail,
      privateKey: env.googlePrivateKey.replace(/\\n/g, '\n'),
    }));
  } catch (error) {
    console.warn('Failed to load Google Sheets config, using placeholders:', error);
    return {
      apiKey: 'placeholder',
      spreadsheetId: 'placeholder',
      serviceAccountEmail: 'placeholder',
      privateKey: 'placeholder',
    };
  }
}

/**
 * Default sheet configuration
 */
export const GOOGLE_SHEETS_CONFIG = {
  DEFAULT_SHEET_NAME: 'Users',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  BATCH_SIZE: 100, // Maximum number of rows to process at once
} as const;

/**
 * Column mappings for user data
 */
export const USER_DATA_COLUMNS = {
  ID: 'A',
  EMAIL: 'B',
  FIRST_NAME: 'C',
  LAST_NAME: 'D',
  PHONE: 'E',
  DATE_OF_BIRTH: 'F',
  ADDRESS: 'G',
  CITY: 'H',
  STATE: 'I',
  ZIP_CODE: 'J',
  COUNTRY: 'K',
  SIGNUP_DATE: 'L',
  LAST_LOGIN_DATE: 'M',
  IS_ACTIVE: 'N',
  PREFERENCES: 'O',
} as const;

/**
 * Generates a range string for Google Sheets API
 */
export function generateRange(
  sheetName: string,
  startColumn: string,
  endColumn: string,
  startRow?: number,
  endRow?: number
): string {
  let range = `${sheetName}!${startColumn}`;
  
  if (startRow) {
    range += startRow;
  }
  
  range += `:${endColumn}`;
  
  if (endRow) {
    range += endRow;
  }
  
  return range;
}

/**
 * Validates spreadsheet ID format
 */
export function isValidSpreadsheetId(id: string): boolean {
  // Google Sheets ID is typically 44 characters long and contains alphanumeric characters, hyphens, and underscores
  const spreadsheetIdRegex = /^[a-zA-Z0-9-_]{44}$/;
  return spreadsheetIdRegex.test(id);
}

/**
 * Validates email format for service account
 */
export function isValidServiceAccountEmail(email: string): boolean {
  const serviceAccountRegex = /^[a-zA-Z0-9-]+@[a-zA-Z0-9-]+\.iam\.gserviceaccount\.com$/;
  return serviceAccountRegex.test(email);
}