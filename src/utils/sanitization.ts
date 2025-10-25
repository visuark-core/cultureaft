/**
 * Frontend Input Sanitization Utilities
 * Provides client-side input validation and sanitization
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Create a temporary div element to leverage browser's HTML parsing
  const temp = document.createElement('div');
  temp.textContent = input;
  return temp.innerHTML;
}

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/\0/g, ''); // Remove null bytes
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  const sanitized = email.trim().toLowerCase();
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-digit characters except + at the beginning
  const sanitized = phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  
  // Basic phone number validation (10-15 digits, optional + at start)
  const phoneRegex = /^\+?[\d]{10,15}$/;
  if (!phoneRegex.test(sanitized)) {
    throw new Error('Invalid phone number format');
  }
  
  return sanitized;
}

/**
 * Sanitize URL to prevent malicious redirects
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  
  const sanitized = url.trim();
  
  // Allow only http, https, and relative URLs
  const urlRegex = /^(https?:\/\/|\/)/i;
  if (!urlRegex.test(sanitized)) {
    throw new Error('Invalid URL format');
  }
  
  // Prevent javascript: and data: protocols
  if (/^(javascript|data|vbscript):/i.test(sanitized)) {
    throw new Error('Unsafe URL protocol');
  }
  
  return sanitized;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number, options: {
  min?: number;
  max?: number;
  allowFloat?: boolean;
} = {}): number {
  const { min, max, allowFloat = true } = options;
  
  let num: number;
  
  if (typeof input === 'string') {
    // Remove non-numeric characters except decimal point and minus sign
    const cleaned = input.replace(/[^\d.-]/g, '');
    num = allowFloat ? parseFloat(cleaned) : parseInt(cleaned, 10);
  } else {
    num = input;
  }
  
  if (isNaN(num)) {
    throw new Error('Invalid number format');
  }
  
  if (typeof min === 'number' && num < min) {
    throw new Error(`Number must be at least ${min}`);
  }
  
  if (typeof max === 'number' && num > max) {
    throw new Error(`Number must not exceed ${max}`);
  }
  
  return num;
}

/**
 * Sanitize text input with length limits
 */
export function sanitizeText(input: string, options: {
  minLength?: number;
  maxLength?: number;
  allowHtml?: boolean;
} = {}): string {
  if (typeof input !== 'string') return '';
  
  const { minLength = 0, maxLength = 1000, allowHtml = false } = options;
  
  let sanitized = allowHtml ? input.trim() : sanitizeString(input);
  
  if (sanitized.length < minLength) {
    throw new Error(`Text must be at least ${minLength} characters long`);
  }
  
  if (sanitized.length > maxLength) {
    throw new Error(`Text must not exceed ${maxLength} characters`);
  }
  
  return sanitized;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeString(obj) as any;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as any;
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeString(key);
    sanitized[sanitizedKey] = sanitizeObject(value);
  }
  
  return sanitized;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  if (typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      feedback: ['Password must be a string']
    };
  }
  
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }
  
  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }
  
  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }
  
  // Number check
  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }
  
  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }
  
  // Common password check
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    feedback.push('Password is too common');
    score = Math.max(0, score - 2);
  }
  
  return {
    isValid: score >= 4 && feedback.length === 0,
    score,
    feedback
  };
}

/**
 * Escape special characters for use in regular expressions
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove potentially dangerous file extensions
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return '';
  
  // Remove path separators and dangerous characters
  let sanitized = fileName.replace(/[\/\\:*?"<>|]/g, '');
  
  // Remove leading dots and spaces
  sanitized = sanitized.replace(/^[\s.]+/, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 255 - (ext ? ext.length + 1 : 0));
    sanitized = ext ? `${name}.${ext}` : name;
  }
  
  // Check for dangerous extensions
  const dangerousExtensions = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
    'php', 'asp', 'aspx', 'jsp', 'py', 'rb', 'pl', 'sh'
  ];
  
  const extension = sanitized.split('.').pop()?.toLowerCase();
  if (extension && dangerousExtensions.includes(extension)) {
    throw new Error('File type not allowed');
  }
  
  return sanitized;
}

/**
 * Validate and sanitize credit card number (for display purposes only)
 */
export function sanitizeCreditCard(cardNumber: string): string {
  if (typeof cardNumber !== 'string') return '';
  
  // Remove all non-digit characters
  const digits = cardNumber.replace(/\D/g, '');
  
  // Basic length validation
  if (digits.length < 13 || digits.length > 19) {
    throw new Error('Invalid credit card number length');
  }
  
  // Return masked version (show only last 4 digits)
  return '**** **** **** ' + digits.slice(-4);
}