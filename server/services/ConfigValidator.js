/**
 * ConfigValidator - Comprehensive configuration validation system
 * Validates all required environment variables and service configurations at startup
 * Excludes Razorpay validation as per requirements
 */
class ConfigValidator {
    constructor() {
        this.validationErrors = [];
        this.validationWarnings = [];
        this.validationReport = {
            status: 'unknown',
            timestamp: new Date().toISOString(),
            errors: [],
            warnings: [],
            validatedConfigs: []
        };
    }

    /**
     * Main validation method - validates all configurations
     * @param {Object} options - Validation options
     * @returns {Object} Validation report
     */
    static validate(options = {}) {
        const validator = new ConfigValidator();
        
        try {
            console.log('🔍 Starting configuration validation...');
            
            // Validate all required configurations
            validator.validateRequiredVariables();
            validator.validateJWTSecrets();
            validator.validateMongoDbUri();
            validator.validateCloudinaryConfig();
            validator.validateAdminConfig();
            validator.validatePaymentConfig();
            
            // Generate final report
            const report = validator.generateReport();
            
            if (report.errors.length > 0) {
                console.error('❌ Configuration validation failed:');
                report.errors.forEach(error => console.error(`  - ${error}`));
                
                if (!options.skipExit) {
                    process.exit(1);
                }
            } else {
                console.log('✅ Configuration validation passed');
                if (report.warnings.length > 0) {
                    console.warn('⚠️  Configuration warnings:');
                    report.warnings.forEach(warning => console.warn(`  - ${warning}`));
                }
            }
            
            return report;
        } catch (error) {
            console.error('💥 Configuration validation crashed:', error.message);
            if (!options.skipExit) {
                process.exit(1);
            }
            throw error;
        }
    }

    /**
     * Validate all required environment variables
     */
    validateRequiredVariables() {
        const requiredVariables = [
            // Core application
            'NODE_ENV',
            'MONGO_URI',
            
            // JWT Configuration
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'JWT_EXPIRES_IN',
            'REFRESH_TOKEN_EXPIRES_IN',
            
            // Cloudinary Configuration
            'CLOUDINARY_CLOUD_NAME',
            'CLOUDINARY_API_KEY',
            'CLOUDINARY_API_SECRET',
            
            // Admin Configuration
            'SUPER_ADMIN_EMAIL',
            'SUPER_ADMIN_PASSWORD'
        ];

        const optionalVariables = [
            'PORT',
            'PAYMENT_TIMEOUT',
            'MAX_RETRY_ATTEMPTS'
        ];

        // Check required variables
        for (const variable of requiredVariables) {
            if (!process.env[variable] || process.env[variable].trim() === '') {
                this.addError(`Missing required environment variable: ${variable}`);
            } else {
                this.addValidatedConfig(`${variable}: configured`);
            }
        }

        // Check optional variables and set defaults
        for (const variable of optionalVariables) {
            if (!process.env[variable]) {
                this.addWarning(`Optional environment variable ${variable} not set, using default`);
            } else {
                this.addValidatedConfig(`${variable}: ${process.env[variable]}`);
            }
        }
    }

    /**
     * Validate JWT secret strength and configuration
     */
    validateJWTSecrets() {
        const jwtSecret = process.env.JWT_SECRET;
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
        
        if (jwtSecret) {
            // Check JWT secret strength
            if (jwtSecret.length < 32) {
                this.addError('JWT_SECRET must be at least 32 characters long for security');
            } else if (jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
                this.addError('JWT_SECRET is using default placeholder value - must be changed for production');
            } else if (!/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(jwtSecret)) {
                this.addWarning('JWT_SECRET contains unusual characters - ensure it\'s properly escaped');
            } else {
                this.addValidatedConfig('JWT_SECRET: strong secret configured');
            }
        }

        if (jwtRefreshSecret) {
            // Check JWT refresh secret strength
            if (jwtRefreshSecret.length < 32) {
                this.addError('JWT_REFRESH_SECRET must be at least 32 characters long for security');
            } else if (jwtRefreshSecret === 'your-super-secret-refresh-key-change-this-in-production') {
                this.addError('JWT_REFRESH_SECRET is using default placeholder value - must be changed for production');
            } else if (jwtRefreshSecret === jwtSecret) {
                this.addError('JWT_REFRESH_SECRET must be different from JWT_SECRET');
            } else {
                this.addValidatedConfig('JWT_REFRESH_SECRET: strong secret configured');
            }
        }

        // Validate JWT expiration times
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN;
        const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;
        
        if (jwtExpiresIn && !this.isValidTimeFormat(jwtExpiresIn)) {
            this.addError(`JWT_EXPIRES_IN has invalid format: ${jwtExpiresIn}. Use formats like '15m', '1h', '1d'`);
        }
        
        if (refreshExpiresIn && !this.isValidTimeFormat(refreshExpiresIn)) {
            this.addError(`REFRESH_TOKEN_EXPIRES_IN has invalid format: ${refreshExpiresIn}. Use formats like '7d', '30d'`);
        }
    }

    /**
     * Validate MongoDB URI format and connection string
     */
    validateMongoDbUri() {
        const mongoUri = process.env.MONGO_URI;
        
        if (!mongoUri) {
            return; // Already handled in required variables
        }

        // Check URI format
        if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
            this.addError('MONGO_URI must start with "mongodb://" or "mongodb+srv://"');
            return;
        }

        try {
            // Basic URI parsing validation
            const url = new URL(mongoUri);
            
            // Check for database name
            if (!url.pathname || url.pathname === '/') {
                this.addWarning('MONGO_URI does not specify a database name');
            }
            
            // Check for authentication in production
            if (process.env.NODE_ENV === 'production') {
                if (!url.username || !url.password) {
                    this.addError('MONGO_URI must include authentication credentials in production');
                }
            }
            
            // Check for SSL in production
            if (process.env.NODE_ENV === 'production' && mongoUri.startsWith('mongodb+srv://')) {
                if (!mongoUri.includes('ssl=true') && !mongoUri.includes('tls=true')) {
                    this.addWarning('Consider enabling SSL/TLS for MongoDB connection in production');
                }
            }
            
            this.addValidatedConfig('MONGO_URI: valid MongoDB connection string');
            
        } catch (error) {
            this.addError(`MONGO_URI has invalid format: ${error.message}`);
        }
    }

    /**
     * Validate Cloudinary configuration
     */
    validateCloudinaryConfig() {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        // Check for placeholder values
        const placeholders = ['your_cloud_name', 'your_api_key', 'your_api_secret'];
        
        if (placeholders.includes(cloudName)) {
            this.addError('CLOUDINARY_CLOUD_NAME is using placeholder value - must be configured');
        } else if (cloudName && cloudName.length > 0) {
            this.addValidatedConfig('CLOUDINARY_CLOUD_NAME: configured');
        }

        if (placeholders.includes(apiKey)) {
            this.addError('CLOUDINARY_API_KEY is using placeholder value - must be configured');
        } else if (apiKey) {
            // Validate API key format (should be numeric)
            if (!/^\d+$/.test(apiKey)) {
                this.addWarning('CLOUDINARY_API_KEY should be numeric');
            } else {
                this.addValidatedConfig('CLOUDINARY_API_KEY: valid format');
            }
        }

        if (placeholders.includes(apiSecret)) {
            this.addError('CLOUDINARY_API_SECRET is using placeholder value - must be configured');
        } else if (apiSecret) {
            // Check API secret strength
            if (apiSecret.length < 20) {
                this.addWarning('CLOUDINARY_API_SECRET seems too short - verify it\'s correct');
            } else {
                this.addValidatedConfig('CLOUDINARY_API_SECRET: configured');
            }
        }
    }

    /**
     * Validate admin configuration
     */
    validateAdminConfig() {
        const adminEmail = process.env.SUPER_ADMIN_EMAIL;
        const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

        if (adminEmail) {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(adminEmail)) {
                this.addError('SUPER_ADMIN_EMAIL has invalid email format');
            } else {
                this.addValidatedConfig('SUPER_ADMIN_EMAIL: valid email format');
            }
        }

        if (adminPassword) {
            // Check password strength
            if (adminPassword.length < 8) {
                this.addError('SUPER_ADMIN_PASSWORD must be at least 8 characters long');
            } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(adminPassword)) {
                this.addWarning('SUPER_ADMIN_PASSWORD should contain uppercase, lowercase, numbers, and special characters');
            } else {
                this.addValidatedConfig('SUPER_ADMIN_PASSWORD: strong password configured');
            }
        }
    }

    /**
     * Validate payment configuration (excluding Razorpay as per requirements)
     */
    validatePaymentConfig() {
        const paymentTimeout = process.env.PAYMENT_TIMEOUT;
        const maxRetryAttempts = process.env.MAX_RETRY_ATTEMPTS;

        if (paymentTimeout) {
            const timeout = parseInt(paymentTimeout);
            if (isNaN(timeout) || timeout < 30000) {
                this.addWarning('PAYMENT_TIMEOUT should be at least 30000ms (30 seconds)');
            } else if (timeout > 600000) {
                this.addWarning('PAYMENT_TIMEOUT is very high (>10 minutes) - consider reducing');
            } else {
                this.addValidatedConfig(`PAYMENT_TIMEOUT: ${timeout}ms`);
            }
        }

        if (maxRetryAttempts) {
            const attempts = parseInt(maxRetryAttempts);
            if (isNaN(attempts) || attempts < 1) {
                this.addError('MAX_RETRY_ATTEMPTS must be a positive integer');
            } else if (attempts > 10) {
                this.addWarning('MAX_RETRY_ATTEMPTS is very high - consider reducing to avoid long delays');
            } else {
                this.addValidatedConfig(`MAX_RETRY_ATTEMPTS: ${attempts}`);
            }
        }

        this.addValidatedConfig('Payment method: Cash on Delivery only');
    }

    /**
     * Validate time format for JWT expiration
     * @param {string} timeStr - Time string to validate
     * @returns {boolean} True if valid format
     */
    isValidTimeFormat(timeStr) {
        // Valid formats: 60, "2 days", "10h", "7d", "1m", "1s"
        return /^(\d+|\d+\s*(s|m|h|d|days?|hours?|minutes?|seconds?))$/i.test(timeStr);
    }

    /**
     * Add validation error
     * @param {string} message - Error message
     */
    addError(message) {
        this.validationErrors.push(message);
        this.validationReport.errors.push(message);
    }

    /**
     * Add validation warning
     * @param {string} message - Warning message
     */
    addWarning(message) {
        this.validationWarnings.push(message);
        this.validationReport.warnings.push(message);
    }

    /**
     * Add validated configuration
     * @param {string} config - Configuration description
     */
    addValidatedConfig(config) {
        this.validationReport.validatedConfigs.push(config);
    }

    /**
     * Generate comprehensive validation report
     * @returns {Object} Validation report
     */
    generateReport() {
        this.validationReport.status = this.validationErrors.length > 0 ? 'failed' : 'passed';
        this.validationReport.timestamp = new Date().toISOString();
        
        return {
            ...this.validationReport,
            summary: {
                totalErrors: this.validationErrors.length,
                totalWarnings: this.validationWarnings.length,
                totalValidated: this.validationReport.validatedConfigs.length,
                status: this.validationReport.status
            }
        };
    }

    /**
     * Get configuration status for health endpoint
     * @returns {Object} Configuration status
     */
    static getConfigurationStatus() {
        try {
            const validator = new ConfigValidator();
            const report = ConfigValidator.validate({ skipExit: true });
            
            return {
                status: report.status,
                lastValidated: report.timestamp,
                errors: report.errors,
                warnings: report.warnings,
                configuredServices: report.validatedConfigs.length
            };
        } catch (error) {
            return {
                status: 'error',
                lastValidated: new Date().toISOString(),
                errors: [error.message],
                warnings: [],
                configuredServices: 0
            };
        }
    }
}

module.exports = ConfigValidator;