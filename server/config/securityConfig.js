/**
 * Security Configuration
 * Centralized security settings and environment variable management
 */

const crypto = require('crypto');

// Generate secure random secrets if not provided
const generateSecret = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

// Security configuration with environment variable fallbacks
const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || generateSecret(32),
    refreshSecret: process.env.JWT_REFRESH_SECRET || generateSecret(32),
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'cultureaft-api',
    audience: process.env.JWT_AUDIENCE || 'cultureaft-client'
  },

  // Rate Limiting Configuration
  rateLimit: {
    // General API rate limiting
    general: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
      skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true'
    },

    // Authentication rate limiting
    auth: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS) || 5,
      blockDuration: parseInt(process.env.AUTH_RATE_LIMIT_BLOCK_DURATION) || 30 * 60 * 1000 // 30 minutes
    },

    // Password reset rate limiting
    passwordReset: {
      windowMs: parseInt(process.env.PASSWORD_RESET_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
      max: parseInt(process.env.PASSWORD_RESET_MAX_ATTEMPTS) || 3,
      blockDuration: parseInt(process.env.PASSWORD_RESET_BLOCK_DURATION) || 60 * 60 * 1000 // 1 hour
    },

    // File upload rate limiting
    upload: {
      windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000, // 5 minutes
      max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX_FILES) || 10,
      maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
    }
  },

  // Security Headers Configuration
  headers: {
    // Content Security Policy
    csp: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://checkout.razorpay.com",
          "https://apis.google.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:"
        ],
        connectSrc: [
          "'self'",
          "https://api.razorpay.com",
          "https://sheets.googleapis.com",
          "https://accounts.google.com"
        ],
        frameSrc: [
          "'self'",
          "https://api.razorpay.com"
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production'
      }
    },

    // HTTP Strict Transport Security
    hsts: {
      maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000, // 1 year
      includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
      preload: process.env.HSTS_PRELOAD !== 'false'
    },

    // Additional security headers
    additional: {
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'DENY',
      xXssProtection: '1; mode=block',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
      xPermittedCrossDomainPolicies: 'none',
      xDownloadOptions: 'noopen'
    }
  },

  // CORS Configuration
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
      
      // Default allowed origins
      const defaultOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
        'https://cultureaft.vercel.app',
        'https://www.cultureaft.com',
        'https://cultureaft.com'
      ];

      const origins = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;

      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // In development, allow any localhost origin
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        return callback(null, true);
      }

      if (origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-CSRF-Token',
      'X-API-Key'
    ],
    exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400 // 24 hours
  },

  // Input Validation Configuration
  validation: {
    // Maximum input lengths
    maxLengths: {
      email: 254,
      password: 128,
      name: 100,
      description: 1000,
      url: 2048,
      phoneNumber: 20
    },

    // Password requirements
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
      maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH) || 128,
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
      forbidCommonPasswords: process.env.PASSWORD_FORBID_COMMON !== 'false'
    },

    // File upload validation
    fileUpload: {
      allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,image/webp,application/pdf').split(','),
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
      maxFiles: parseInt(process.env.MAX_FILES_PER_REQUEST) || 5
    }
  },

  // IP Security Configuration
  ipSecurity: {
    // Admin IP whitelist
    adminWhitelist: (process.env.ADMIN_IP_WHITELIST || '').split(',').filter(Boolean),
    
    // Automatic IP blocking thresholds
    autoBlock: {
      enabled: process.env.AUTO_BLOCK_IPS !== 'false',
      suspiciousActivityThreshold: parseInt(process.env.SUSPICIOUS_ACTIVITY_THRESHOLD) || 5,
      blockDuration: parseInt(process.env.IP_BLOCK_DURATION) || 24 * 60 * 60 * 1000, // 24 hours
      whitelistedIPs: (process.env.WHITELISTED_IPS || '').split(',').filter(Boolean)
    }
  },

  // Monitoring and Alerting Configuration
  monitoring: {
    // Alert thresholds
    thresholds: {
      suspiciousActivityRate: parseFloat(process.env.SUSPICIOUS_ACTIVITY_RATE_THRESHOLD) || 0.1, // 10%
      failedLoginRate: parseFloat(process.env.FAILED_LOGIN_RATE_THRESHOLD) || 0.05, // 5%
      blockedRequestRate: parseFloat(process.env.BLOCKED_REQUEST_RATE_THRESHOLD) || 0.02, // 2%
      maxAlertsPerHour: parseInt(process.env.MAX_ALERTS_PER_HOUR) || 50
    },

    // Notification settings
    notifications: {
      enabled: process.env.SECURITY_NOTIFICATIONS_ENABLED !== 'false',
      email: process.env.SECURITY_NOTIFICATION_EMAIL || '',
      webhook: process.env.SECURITY_NOTIFICATION_WEBHOOK || '',
      slackWebhook: process.env.SLACK_WEBHOOK_URL || ''
    },

    // Log retention
    logRetention: {
      securityLogs: parseInt(process.env.SECURITY_LOG_RETENTION_DAYS) || 90, // 90 days
      errorLogs: parseInt(process.env.ERROR_LOG_RETENTION_DAYS) || 30, // 30 days
      accessLogs: parseInt(process.env.ACCESS_LOG_RETENTION_DAYS) || 7 // 7 days
    }
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || generateSecret(32),
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },

  // Encryption Configuration
  encryption: {
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    keyLength: parseInt(process.env.ENCRYPTION_KEY_LENGTH) || 32,
    ivLength: parseInt(process.env.ENCRYPTION_IV_LENGTH) || 16,
    tagLength: parseInt(process.env.ENCRYPTION_TAG_LENGTH) || 16,
    key: process.env.ENCRYPTION_KEY || generateSecret(32)
  },

  // Database Security
  database: {
    // Connection security
    ssl: process.env.DB_SSL === 'true',
    sslValidate: process.env.DB_SSL_VALIDATE !== 'false',
    
    // Query security
    maxQueryTime: parseInt(process.env.DB_MAX_QUERY_TIME) || 30000, // 30 seconds
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
    
    // Data encryption
    encryptSensitiveFields: process.env.DB_ENCRYPT_SENSITIVE !== 'false'
  }
};

// Validate critical security settings
const validateSecurityConfig = () => {
  const errors = [];

  // Check JWT secrets
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    errors.push('JWT_SECRET must be set in production');
  }

  if (!process.env.JWT_REFRESH_SECRET && process.env.NODE_ENV === 'production') {
    errors.push('JWT_REFRESH_SECRET must be set in production');
  }

  // Check encryption key
  if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    errors.push('ENCRYPTION_KEY must be set in production');
  }

  // Check session secret
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    errors.push('SESSION_SECRET must be set in production');
  }

  if (errors.length > 0) {
    console.error('Security configuration errors:');
    errors.forEach(error => console.error(`- ${error}`));
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Validate configuration on load
validateSecurityConfig();

module.exports = securityConfig;