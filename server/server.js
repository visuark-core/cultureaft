const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');
const systemMetricsService = require('./services/systemMetricsService');

// Load environment variables from the server directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('--- Loaded Environment Variables ---');
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET);
console.log('------------------------------------');

connectDB();

const app = express();
const port = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:5173' // Vite dev server default port
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Authentication routes
app.use('/api/auth', require('./routes/auth'));

// User management routes
app.use('/api/users', require('./routes/users'));

// Product management routes
app.use('/api/products', require('./routes/products'));

// System administration routes
app.use('/api/system', require('./routes/system'));

// Existing routes
app.use('/api/profile', require('./routes/profile'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));

// Global error handling middleware
const { handleValidationError } = require('./middleware/validation');
app.use(handleValidationError);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    data: null
  });
});

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
    
    // Start system metrics collection after server starts
    setTimeout(() => {
      try {
        systemMetricsService.startCollection();
        console.log('System metrics collection started');
      } catch (error) {
        console.error('Failed to start system metrics collection:', error);
      }
    }, 5000); // Wait 5 seconds for server to fully initialize
  });
}

module.exports = app;