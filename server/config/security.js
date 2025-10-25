/**
 * Security Configuration
 * Centralized security settings for the application
 */

const corsOptions = {
  origin: function (origin, callback) {
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'https://cultureaft.vercel.app',
      'https://www.cultureaft.com',
      'https://cultureaft.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

const securityHeaders = (req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.razorpay.com https://sheets.googleapis.com https://accounts.google.com",
    "frame-src 'self' https://api.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  // HSTS (HTTP Strict Transport Security) - only in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain routes in development
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      return req.path.startsWith('/api/health') || req.path.startsWith('/api/status');
    }
    return false;
  }
};

const authRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false
};

module.exports = {
  corsOptions,
  securityHeaders,
  rateLimitConfig,
  authRateLimitConfig
};