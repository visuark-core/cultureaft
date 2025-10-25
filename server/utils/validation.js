/**
 * Input Validation and Sanitization Utilities
 * Provides comprehensive input validation and sanitization functions
 */

const validator = require('validator');
const xss = require('xss');

class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Sanitize string input to prevent XSS attacks
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return xss(input.trim());
};

/**
 * Validate and sanitize email
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', 'email');
  }
  
  const sanitizedEmail = sanitizeString(email).toLowerCase();
  
  if (!validator.isEmail(sanitizedEmail)) {
    throw new ValidationError('Invalid email format', 'email');
  }
  
  return sanitizedEmail;
};

/**
 * Validate phone number
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    throw new ValidationError('Phone number is required', 'phone');
  }
  
  const sanitizedPhone = sanitizeString(phone).replace(/\s+/g, '');
  
  if (!validator.isMobilePhone(sanitizedPhone, 'any')) {
    throw new ValidationError('Invalid phone number format', 'phone');
  }
  
  return sanitizedPhone;
};

/**
 * Validate required string field
 */
const validateRequiredString = (value, fieldName, minLength = 1, maxLength = 255) => {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${fieldName} is required`, fieldName.toLowerCase());
  }
  
  const sanitized = sanitizeString(value);
  
  if (sanitized.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`, fieldName.toLowerCase());
  }
  
  if (sanitized.length > maxLength) {
    throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`, fieldName.toLowerCase());
  }
  
  return sanitized;
};

/**
 * Validate optional string field
 */
const validateOptionalString = (value, fieldName, maxLength = 255) => {
  if (!value) return '';
  
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName.toLowerCase());
  }
  
  const sanitized = sanitizeString(value);
  
  if (sanitized.length > maxLength) {
    throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`, fieldName.toLowerCase());
  }
  
  return sanitized;
};

/**
 * Validate numeric field
 */
const validateNumber = (value, fieldName, min = null, max = null) => {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, fieldName.toLowerCase());
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName.toLowerCase());
  }
  
  if (min !== null && num < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName.toLowerCase());
  }
  
  if (max !== null && num > max) {
    throw new ValidationError(`${fieldName} must not exceed ${max}`, fieldName.toLowerCase());
  }
  
  return num;
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    throw new ValidationError(`${fieldName} is required`, fieldName.toLowerCase());
  }
  
  if (!validator.isMongoId(id.toString())) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName.toLowerCase());
  }
  
  return id.toString();
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required', 'password');
  }
  
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long', 'password');
  }
  
  if (password.length > 128) {
    throw new ValidationError('Password must not exceed 128 characters', 'password');
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter', 'password');
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    throw new ValidationError('Password must contain at least one lowercase letter', 'password');
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    throw new ValidationError('Password must contain at least one number', 'password');
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new ValidationError('Password must contain at least one special character', 'password');
  }
  
  // Check for common passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    throw new ValidationError('Password is too common, please choose a stronger password', 'password');
  }
  
  return password;
};

/**
 * Validate file upload
 */
const validateFileUpload = (file, allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    throw new ValidationError('File is required', 'file');
  }
  
  // Check file size
  if (file.size > maxSize) {
    throw new ValidationError(`File size must not exceed ${Math.round(maxSize / 1024 / 1024)}MB`, 'file');
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    throw new ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`, 'file');
  }
  
  // Check for dangerous file extensions
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh'
  ];
  
  const fileName = file.originalname.toLowerCase();
  const hasDangerousExtension = dangerousExtensions.some(ext => fileName.endsWith(ext));
  
  if (hasDangerousExtension) {
    throw new ValidationError('File type not allowed for security reasons', 'file');
  }
  
  return file;
};

/**
 * Validate IP address
 */
const validateIP = (ip) => {
  if (!ip || typeof ip !== 'string') {
    throw new ValidationError('IP address is required', 'ip');
  }
  
  if (!validator.isIP(ip)) {
    throw new ValidationError('Invalid IP address format', 'ip');
  }
  
  return ip;
};

/**
 * Validate JSON Web Token format
 */
const validateJWT = (token) => {
  if (!token || typeof token !== 'string') {
    throw new ValidationError('Token is required', 'token');
  }
  
  // Basic JWT format validation (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new ValidationError('Invalid token format', 'token');
  }
  
  // Check if each part is valid base64
  try {
    parts.forEach(part => {
      if (!part || !/^[A-Za-z0-9_-]+$/.test(part)) {
        throw new Error('Invalid base64');
      }
    });
  } catch (error) {
    throw new ValidationError('Invalid token format', 'token');
  }
  
  return token;
};

/**
 * Validate credit card number (basic format check)
 */
const validateCreditCard = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    throw new ValidationError('Credit card number is required', 'cardNumber');
  }
  
  const sanitized = cardNumber.replace(/\s+/g, '');
  
  if (!validator.isCreditCard(sanitized)) {
    throw new ValidationError('Invalid credit card number', 'cardNumber');
  }
  
  return sanitized;
};

/**
 * Advanced input sanitization with configurable options
 */
const sanitizeInput = (input, options = {}) => {
  const {
    allowHtml = false,
    maxLength = null,
    removeScripts = true,
    removeEvents = true,
    allowedTags = [],
    allowedAttributes = []
  } = options;
  
  if (typeof input !== 'string') return input;
  
  let sanitized = input.trim();
  
  if (!allowHtml) {
    // Remove all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else {
    // Use XSS library with custom options
    const xssOptions = {
      whiteList: allowedTags.reduce((acc, tag) => {
        acc[tag] = allowedAttributes;
        return acc;
      }, {}),
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    };
    sanitized = xss(sanitized, xssOptions);
  }
  
  if (removeScripts) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');
  }
  
  if (removeEvents) {
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  }
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Validate URL
 */
const validateUrl = (url, fieldName = 'URL') => {
  if (!url || typeof url !== 'string') {
    throw new ValidationError(`${fieldName} is required`, fieldName.toLowerCase());
  }
  
  const sanitized = sanitizeString(url);
  
  if (!validator.isURL(sanitized)) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName.toLowerCase());
  }
  
  return sanitized;
};

/**
 * Validate date
 */
const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    throw new ValidationError(`${fieldName} is required`, fieldName.toLowerCase());
  }
  
  const parsedDate = new Date(date);
  
  if (isNaN(parsedDate.getTime())) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName.toLowerCase());
  }
  
  return parsedDate;
};

/**
 * Sanitize object recursively
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Middleware to sanitize request body
 */
const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

module.exports = {
  ValidationError,
  sanitizeString,
  validateEmail,
  validatePhone,
  validateRequiredString,
  validateOptionalString,
  validateNumber,
  validateObjectId,
  validateUrl,
  validateDate,
  validatePassword,
  validateFileUpload,
  validateIP,
  validateJWT,
  validateCreditCard,
  sanitizeObject,
  sanitizeRequest,
  sanitizeInput
};