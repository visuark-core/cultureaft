/**
 * Types for Google Sheets integration
 */

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  signupDate: string;
  lastLoginDate?: string;
  isActive: boolean;
  preferences?: Record<string, any>;
}

export interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

export interface GoogleSheetsResponse {
  success: boolean;
  data?: any;
  error?: string;
  retryCount?: number;
}

export interface BatchOperationResult {
  successful: number;
  failed: number;
  errors: string[];
}

export interface SyncOperation {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  userData: UserData;
  timestamp: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
  error?: string;
  retryCount: number;
}

export interface SyncQueueItem {
  id: string;
  operation: SyncOperation;
  priority: number; // Higher number = higher priority
  createdAt: string;
  scheduledAt?: string;
}

export interface GoogleSheetsServiceOptions {
  retryAttempts?: number;
  retryDelay?: number;
  batchSize?: number;
  enableQueue?: boolean;
  enableOfflineStorage?: boolean;
}

export interface OfflineStorageItem {
  id: string;
  operation: SyncOperation;
  createdAt: string;
  synced: boolean;
}

export interface GoogleSheetsError extends Error {
  code?: string;
  status?: number;
  retryable?: boolean;
  details?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SheetMetadata {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
  lastUpdated?: string;
}

export interface SyncStatus {
  isConnected: boolean;
  lastSyncTime?: string;
  pendingOperations: number;
  failedOperations: number;
  totalOperations: number;
  errors: string[];
}

// Event types for Google Sheets operations
export type GoogleSheetsEventType = 
  | 'USER_ADDED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'BATCH_COMPLETED'
  | 'SYNC_FAILED'
  | 'CONNECTION_LOST'
  | 'CONNECTION_RESTORED';

export interface GoogleSheetsEvent {
  type: GoogleSheetsEventType;
  data: any;
  timestamp: string;
  source: string;
}

export type GoogleSheetsEventListener = (event: GoogleSheetsEvent) => void;

// Configuration for different environments
export interface EnvironmentConfig {
  development: GoogleSheetsConfig;
  staging: GoogleSheetsConfig;
  production: GoogleSheetsConfig;
}

// Audit log entry for tracking changes
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details: Record<string, any>;
  success: boolean;
  error?: string;
}