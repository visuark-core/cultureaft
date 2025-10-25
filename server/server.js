const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const http = require('http');
const { corsOptions, securityHeaders, rateLimitConfig, authRateLimitConfig } = require('./config/security');

// New Services
const DatabaseManager = require('./services/DatabaseManager');
const ConfigValidator = require('./services/ConfigValidator');
const SecurityLogger = require('./utils/securityLogger');
const InventoryService = require('./services/inventoryService');
const ErrorHandler = require('./utils/errorHandler');
const HealthMonitor = require('./services/healthMonitorService');
const CashOnDeliveryService = require('./services/cashOnDeliveryService');
const LogManager = require('./utils/logger');

// Import WebSocket and Analytics services
const WebSocketService = require('./services/websocketService');
const AnalyticsEventService = require('./services/analyticsEventService');
const { initializeRedis, testRedisConnection, closeRedisConnections } = require('./config/redis');

dotenv.config();

// 1. Validate Configuration
console.log('🚀 Starting Culturaft Server...');

let configReport;
try {
  configReport = ConfigValidator.validate();
  console.log(`📋 Configuration validation completed with ${configReport.summary.totalErrors} errors and ${configReport.summary.totalWarnings} warnings`);
  
  if (configReport.status === 'failed') {
    console.error('💥 Critical configuration errors detected. Server cannot start safely.');
    console.error('Please fix the following configuration issues:');
    configReport.errors.forEach(error => console.error(`  ❌ ${error}`));
    
    // Graceful shutdown
    console.log('🛑 Initiating graceful shutdown due to configuration errors...');
    process.exit(1);
  }
  
  if (configReport.warnings.length > 0) {
    console.warn('⚠️  Configuration warnings detected (server will continue):');
    configReport.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
  }
  
} catch (error) {
  console.error('💥 Configuration validation crashed:', error.message);
  console.error('🛑 Cannot start server without valid configuration');
  process.exit(1);
}

// 2. Connect to Database
const dbManager = new DatabaseManager(process.env.MONGO_URI);
dbManager.connect();

// Enhanced configuration status logging
console.log('--- Server Configuration Status ---');
console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
console.log('🚪 Port:', process.env.PORT || 5000);
console.log('🗄️  Database:', process.env.MONGO_URI ? '✅ Configured' : '❌ Not configured');
console.log('🔐 JWT Auth:', process.env.JWT_SECRET ? '✅ Configured' : '❌ Not configured');
console.log('☁️  Cloudinary:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configured' : '❌ Not configured');
console.log('👤 Admin User:', process.env.SUPER_ADMIN_EMAIL ? '✅ Configured' : '❌ Not configured');
console.log('💳 Payment:', 'Cash on Delivery Only');
console.log('📊 Config Status:', configReport.status === 'passed' ? '✅ All validations passed' : '⚠️  Has warnings');
console.log('-----------------------------------');

// Initialize Redis
initializeRedis();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: false, // We'll handle CSP manually
  crossOriginEmbedderPolicy: false
}));

// Import enhanced security middleware
const {
  enhancedSecurityHeaders,
  advancedSanitization,
  sqlInjectionDetection,
  xssDetection,
  ipBlocking,
  requestSizeLimit,
  bruteForceProtection
} = require('./middleware/security');

const securityMonitoringService = require('./services/securityMonitoringService');

// Apply enhanced security headers
app.use(enhancedSecurityHeaders);

// IP blocking (should be first)
app.use(ipBlocking);

// Request size limiting
app.use(requestSizeLimit('10mb'));

// Rate limiting with brute force protection
const limiter = rateLimit(rateLimitConfig);
const authLimiter = rateLimit(authRateLimitConfig);

app.use(limiter);
app.use(bruteForceProtection);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Metrics and logging middleware
const metricsMiddleware = require('./middleware/metrics');
app.use(metricsMiddleware);

// Advanced input sanitization
app.use(advancedSanitization);

// Security attack detection
app.use(sqlInjectionDetection);
app.use(xssDetection);

// Legacy input sanitization middleware
const { sanitizeRequest } = require('./utils/validation');
app.use(sanitizeRequest);

// Security monitoring middleware
const securityLogger = require('./utils/securityLogger');
app.use(securityLogger.createSecurityMiddleware());

// Record requests in security monitoring
app.use((req, res, next) => {
  securityMonitoringService.recordEvent('REQUEST', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check route
app.use('/api/health', require('./routes/health'));

// Apply auth rate limiting to authentication routes
app.use('/api/auth', authLimiter);

// API routes
app.use('/api/products', require('./routes/publicProducts')); // Enhanced public product routes
app.use('/api/profile', require('./routes/profile'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/orders', require('./routes/orders'));
// Payment routes removed - using COD only
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/google-sheets', require('./routes/googleSheets'));
app.use('/api/security', require('./routes/security'));
app.use('/api/financial-reports', require('./routes/financialReports'));
app.use('/api/data', require('./routes/dataRoutes'));

// Admin routes
app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/admin/audit', require('./routes/adminAudit'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/products', require('./routes/enhancedAdminProducts')); // Enhanced admin product routes with Cloudinary + Sheets
app.use('/api/admin/orders', require('./routes/adminOrders'));
app.use('/api/admin/payments', require('./routes/adminPayments'));
app.use('/api/admin/delivery-agents', require('./routes/adminDeliveryAgents'));
app.use('/api/admin/dashboard', require('./routes/adminDashboard'));

// Enhanced error handling middleware
const { 
  createErrorMiddlewareStack, 
  handleUnhandledRejections 
} = require('./middleware/errorMiddleware');
const { handleValidationError } = require('./middleware/validation');

// Initialize unhandled rejection handlers
handleUnhandledRejections();

// Apply request timing and correlation ID middleware early
const errorMiddlewareStack = createErrorMiddlewareStack();
app.use(errorMiddlewareStack[0]); // addRequestTiming
app.use(errorMiddlewareStack[1]); // addCorrelationId
app.use(errorMiddlewareStack[2]); // logRequestCompletion

// Existing validation error handler
app.use(handleValidationError);

// Enhanced global error handlers - MUST be last
app.use(errorMiddlewareStack[3]); // addSecurityHeaders
app.use(errorMiddlewareStack[4]); // sanitizeErrorResponse
app.use(errorMiddlewareStack[5]); // enhancedErrorHandler

// Initialize WebSocket service
WebSocketService.initialize(server);

// Start periodic analytics processing
AnalyticsEventService.startPeriodicProcessing();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  WebSocketService.shutdown();
  await closeRedisConnections();
  await dbManager.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  WebSocketService.shutdown();
  await closeRedisConnections();
  await dbManager.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
  console.log('WebSocket service initialized');
  console.log('Analytics event service started');
});