import { PaymentError } from '../types/payment';

/**
 * Payment utility functions
 */

/**
 * Convert amount to paisa (smallest currency unit for INR)
 */
export const convertToPaisa = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Convert amount from paisa to rupees
 */
export const convertFromPaisa = (paisa: number): number => {
  return paisa / 100;
};

/**
 * Format amount for display with currency symbol
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    const symbol = currency === 'INR' ? '₹' : currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
};

/**
 * Generate unique receipt ID
 */
export const generateReceiptId = (prefix: string = 'rcpt'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Generate unique order ID
 */
export const generateOrderId = (prefix: string = 'order'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check for Indian mobile number patterns
  // 10 digits starting with 6-9, or 11 digits starting with 0, or 12 digits starting with 91
  return /^([6-9]\d{9}|0[6-9]\d{9}|91[6-9]\d{9})$/.test(cleanPhone);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{5})(\d{5})/, '$1 $2');
  }
  
  if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
    return cleanPhone.replace(/(\d{1})(\d{5})(\d{5})/, '$1 $2 $3');
  }
  
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{5})/, '+$1 $2 $3');
  }
  
  return phone; // Return original if no pattern matches
};

/**
 * Validate amount
 */
export const validateAmount = (amount: number): { isValid: boolean; error?: string } => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }
  
  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  
  if (amount < 1) {
    return { isValid: false, error: 'Minimum amount is ₹1' };
  }
  
  if (amount > 1000000) {
    return { isValid: false, error: 'Maximum amount is ₹10,00,000' };
  }
  
  // Check for too many decimal places
  if (amount.toString().split('.')[1]?.length > 2) {
    return { isValid: false, error: 'Amount cannot have more than 2 decimal places' };
  }
  
  return { isValid: true };
};

/**
 * Sanitize user input for payment notes
 */
export const sanitizePaymentNotes = (notes: Record<string, string>): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  
  Object.entries(notes).forEach(([key, value]) => {
    // Remove HTML tags and limit length
    const cleanKey = key.replace(/<[^>]*>/g, '').substring(0, 50);
    const cleanValue = value.replace(/<[^>]*>/g, '').substring(0, 255);
    
    if (cleanKey && cleanValue) {
      sanitized[cleanKey] = cleanValue;
    }
  });
  
  return sanitized;
};

/**
 * Get user-friendly error message from payment error
 */
export const getPaymentErrorMessage = (error: PaymentError | Error | string): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle PaymentError type
  const paymentError = error as PaymentError;
  
  // Map common error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'BAD_REQUEST_ERROR': 'Invalid payment request. Please check your details and try again.',
    'GATEWAY_ERROR': 'Payment gateway is temporarily unavailable. Please try again later.',
    'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
    'SERVER_ERROR': 'Payment server is temporarily unavailable. Please try again later.',
    'PAYMENT_FAILED': 'Payment was not successful. Please try again or use a different payment method.',
    'INVALID_SIGNATURE': 'Payment verification failed. Please contact support if amount was deducted.',
    'PAYMENT_CANCELLED': 'Payment was cancelled by user.',
    'PAYMENT_TIMEOUT': 'Payment request timed out. Please try again.',
    'INSUFFICIENT_FUNDS': 'Insufficient funds in your account. Please try with a different payment method.',
    'CARD_DECLINED': 'Your card was declined. Please try with a different card or payment method.',
    'INVALID_CARD': 'Invalid card details. Please check your card information and try again.',
    'EXPIRED_CARD': 'Your card has expired. Please use a different card.',
    'AUTHENTICATION_FAILED': 'Payment authentication failed. Please try again.',
  };
  
  return errorMessages[paymentError.code] || paymentError.message || 'An unexpected error occurred during payment processing.';
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: PaymentError | Error | string): boolean => {
  if (typeof error === 'string') {
    return false;
  }
  
  if (error instanceof Error) {
    // Network and timeout errors are usually retryable
    return error.message.toLowerCase().includes('network') || 
           error.message.toLowerCase().includes('timeout');
  }
  
  const paymentError = error as PaymentError;
  const retryableCodes = [
    'GATEWAY_ERROR',
    'NETWORK_ERROR',
    'SERVER_ERROR',
    'PAYMENT_TIMEOUT',
  ];
  
  return retryableCodes.includes(paymentError.code);
};

/**
 * Debounce function for preventing multiple rapid payment attempts
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Create a delay promise for retry mechanisms
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 */
export const calculateBackoffDelay = (attempt: number, baseDelay: number = 1000, maxDelay: number = 10000): number => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
  return Math.min(jitteredDelay, maxDelay);
};

/**
 * Mask sensitive information for logging
 */
export const maskSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveFields = ['key', 'secret', 'signature', 'password', 'token'];
  const masked = { ...data };
  
  Object.keys(masked).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      const value = masked[key];
      if (typeof value === 'string' && value.length > 4) {
        masked[key] = value.substring(0, 4) + '*'.repeat(value.length - 4);
      } else {
        masked[key] = '***';
      }
    }
  });
  
  return masked;
};

/**
 * Get payment method display name
 */
export const getPaymentMethodDisplayName = (method: string): string => {
  const methodNames: Record<string, string> = {
    'card': 'Credit/Debit Card',
    'netbanking': 'Net Banking',
    'wallet': 'Digital Wallet',
    'upi': 'UPI',
    'emi': 'EMI',
    'paylater': 'Pay Later',
    'cardless_emi': 'Cardless EMI',
    'bank_transfer': 'Bank Transfer',
  };
  
  return methodNames[method] || method;
};