const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// UUID v4 implementation to avoid module compatibility issues
const uuidv4 = () => {
  return crypto.randomUUID();
};

const logDirectory = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Create separate log streams for different security event types
const securityLogStream = fs.createWriteStream(path.join(logDirectory, 'security.log'), { flags: 'a' });
const authLogStream = fs.createWriteStream(path.join(logDirectory, 'auth.log'), { flags: 'a' });
const auditLogStream = fs.createWriteStream(path.join(logDirectory, 'audit.log'), { flags: 'a' });

class SecurityLogger {
  constructor() {
    this.correlationMap = new Map(); // For tracking related events
    this.eventCounters = new Map(); // For tracking event frequencies
  }

  /**
   * Enhanced security event logging with categorization and correlation
   * @param {string} eventType - Type of security event
   * @param {object} context - Event context including request details
   */
  static logSecurityEvent(eventType, context = {}) {
    const correlationId = context.correlationId || context.requestId || uuidv4();
    const timestamp = new Date().toISOString();
    
    // Determine severity and category
    const { severity, category } = this.categorizeEvent(eventType);
    
    // Create comprehensive log entry
    const logEntry = {
      timestamp,
      correlationId,
      eventType,
      category,
      severity,
      context: {
        // Request context
        requestId: context.requestId,
        ip: context.ip || 'unknown',
        userAgent: context.userAgent || 'unknown',
        method: context.method,
        path: context.path,
        originalUrl: context.originalUrl,
        
        // Admin context
        adminId: context.adminId,
        adminEmail: context.adminEmail,
        adminRole: context.adminRole,
        
        // Security context
        errorType: context.errorType,
        errorCode: context.errorCode,
        description: context.description,
        
        // Additional metadata
        ...context.metadata
      },
      
      // Error details if present
      error: context.error ? {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack
      } : undefined,
      
      // Performance metrics
      responseTime: context.responseTime,
      
      // Geolocation data (if available)
      location: context.location,
      
      // Risk assessment
      riskScore: this.calculateRiskScore(eventType, context),
      
      // Event metadata
      eventId: uuidv4(),
      source: 'culturaft-admin-api',
      version: '1.0'
    };

    // Write to appropriate log stream
    this.writeToLogStream(category, logEntry);
    
    // Update event counters for monitoring
    this.updateEventCounters(eventType, severity);
    
    // Handle high-severity events
    if (severity === 'critical' || severity === 'high') {
      this.handleHighSeverityEvent(logEntry);
    }
    
    // Store correlation for related events
    if (correlationId) {
      this.storeCorrelation(correlationId, logEntry);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  static logFailure(req, reason) {
    const context = {
      requestId: req.requestContext?.requestId || uuidv4(),
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      errorType: 'AUTHENTICATION_FAILURE',
      description: reason,
      severity: 'medium'
    };
    
    this.logSecurityEvent('authentication_failure', context);
  }

  /**
   * Log authentication events with enhanced context
   */
  static logAuthEvent(eventType, adminId, context = {}) {
    this.logSecurityEvent(eventType, {
      ...context,
      adminId,
      category: 'authentication'
    });
  }

  /**
   * Log authorization events
   */
  static logAuthzEvent(eventType, adminId, resource, action, context = {}) {
    this.logSecurityEvent(eventType, {
      ...context,
      adminId,
      resource,
      action,
      category: 'authorization'
    });
  }

  /**
   * Log suspicious activity with detailed tracking
   */
  static logSuspiciousActivity(activityType, context = {}) {
    this.logSecurityEvent('suspicious_activity', {
      ...context,
      activityType,
      category: 'security_threat',
      severity: 'high'
    });
  }

  /**
   * Categorize security events for proper handling
   */
  static categorizeEvent(eventType) {
    const eventCategories = {
      // Authentication events
      'authentication_success': { category: 'authentication', severity: 'low' },
      'authentication_failure': { category: 'authentication', severity: 'medium' },
      'token_expired': { category: 'authentication', severity: 'low' },
      'token_refresh_failed': { category: 'authentication', severity: 'medium' },
      'token_auto_refresh': { category: 'authentication', severity: 'low' },
      'invalid_token_signature': { category: 'authentication', severity: 'high' },
      'token_verification_error': { category: 'authentication', severity: 'medium' },
      'admin_not_found': { category: 'authentication', severity: 'high' },
      'inactive_admin_access': { category: 'authentication', severity: 'high' },
      'locked_admin_access': { category: 'authentication', severity: 'high' },
      
      // Authorization events
      'unauthorized_access_attempt': { category: 'authorization', severity: 'high' },
      'permission_denied': { category: 'authorization', severity: 'medium' },
      'role_escalation_attempt': { category: 'authorization', severity: 'critical' },
      
      // Security threats
      'suspicious_activity_detected': { category: 'security_threat', severity: 'critical' },
      'brute_force_attempt': { category: 'security_threat', severity: 'critical' },
      'rate_limit_exceeded': { category: 'security_threat', severity: 'high' },
      'sql_injection_attempt': { category: 'security_threat', severity: 'critical' },
      'xss_attempt': { category: 'security_threat', severity: 'critical' },
      
      // System events
      'database_error_during_auth': { category: 'system', severity: 'critical' },
      'authentication_system_error': { category: 'system', severity: 'critical' },
      'activity_update_failed': { category: 'system', severity: 'medium' },
      
      // Session management
      'session_created': { category: 'session', severity: 'low' },
      'session_expired': { category: 'session', severity: 'low' },
      'session_revoked': { category: 'session', severity: 'medium' },
      'concurrent_session_limit': { category: 'session', severity: 'medium' }
    };

    return eventCategories[eventType] || { category: 'general', severity: 'medium' };
  }

  /**
   * Calculate risk score based on event type and context
   */
  static calculateRiskScore(eventType, context) {
    let riskScore = 0;
    
    // Base risk by event type
    const eventRisks = {
      'authentication_failure': 3,
      'unauthorized_access_attempt': 7,
      'suspicious_activity_detected': 8,
      'brute_force_attempt': 9,
      'role_escalation_attempt': 10,
      'sql_injection_attempt': 10,
      'xss_attempt': 10
    };
    
    riskScore += eventRisks[eventType] || 1;
    
    // Increase risk for repeated events from same IP
    const recentEvents = this.getRecentEventsByIP(context.ip);
    if (recentEvents > 5) riskScore += 3;
    if (recentEvents > 10) riskScore += 5;
    
    // Increase risk for unusual access patterns
    if (context.suspiciousIndicators?.length > 0) {
      riskScore += context.suspiciousIndicators.length * 2;
    }
    
    // Increase risk for admin accounts with high privileges
    if (context.adminRole === 'super_admin') riskScore += 2;
    
    return Math.min(riskScore, 10); // Cap at 10
  }

  /**
   * Write log entry to appropriate stream based on category
   */
  static writeToLogStream(category, logEntry) {
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Always write to main security log
    securityLogStream.write(logLine);
    
    // Write to category-specific logs
    switch (category) {
      case 'authentication':
      case 'authorization':
      case 'session':
        authLogStream.write(logLine);
        break;
      case 'audit':
        auditLogStream.write(logLine);
        break;
    }
  }

  /**
   * Update event counters for monitoring and alerting
   */
  static updateEventCounters(eventType, severity) {
    const key = `${eventType}_${severity}`;
    const current = this.eventCounters.get(key) || 0;
    this.eventCounters.set(key, current + 1);
    
    // Reset counters periodically (every hour)
    if (!this.counterResetTimer) {
      this.counterResetTimer = setInterval(() => {
        this.eventCounters.clear();
      }, 3600000); // 1 hour
    }
  }

  /**
   * Handle high-severity security events
   */
  static handleHighSeverityEvent(logEntry) {
    // In a production environment, this could:
    // - Send alerts to security team
    // - Trigger automated responses
    // - Update threat intelligence feeds
    // - Block suspicious IPs
    
    console.warn(`HIGH SEVERITY SECURITY EVENT: ${logEntry.eventType}`, {
      correlationId: logEntry.correlationId,
      ip: logEntry.context.ip,
      adminId: logEntry.context.adminId,
      riskScore: logEntry.riskScore
    });
    
    // Store high-severity events for immediate review
    this.storeHighSeverityEvent(logEntry);
  }

  /**
   * Store correlation data for tracking related events
   */
  static storeCorrelation(correlationId, logEntry) {
    if (!this.correlationMap.has(correlationId)) {
      this.correlationMap.set(correlationId, []);
    }
    
    const events = this.correlationMap.get(correlationId);
    events.push({
      timestamp: logEntry.timestamp,
      eventType: logEntry.eventType,
      severity: logEntry.severity
    });
    
    // Keep only recent correlations (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentEvents = events.filter(event => 
      new Date(event.timestamp).getTime() > oneDayAgo
    );
    
    this.correlationMap.set(correlationId, recentEvents);
  }

  /**
   * Get recent events by IP for risk calculation
   */
  static getRecentEventsByIP(ip) {
    // This would typically query a database or cache
    // For now, return a mock value
    return 0;
  }

  /**
   * Store high-severity events for immediate review
   */
  static storeHighSeverityEvent(logEntry) {
    // In production, this would store in a high-priority queue
    // or send to a security incident management system
    const alertFile = path.join(logDirectory, 'security-alerts.log');
    fs.appendFileSync(alertFile, JSON.stringify(logEntry) + '\n');
  }

  /**
   * Get security event statistics
   */
  static getEventStats() {
    const stats = {};
    for (const [key, count] of this.eventCounters.entries()) {
      stats[key] = count;
    }
    return stats;
  }

  /**
   * Get correlated events for a given correlation ID
   */
  static getCorrelatedEvents(correlationId) {
    return this.correlationMap.get(correlationId) || [];
  }

  /**
   * Create security middleware for Express
   */
  static createSecurityMiddleware() {
    return (req, res, next) => {
      // Add request context for security logging
      req.requestContext = {
        requestId: uuidv4(),
        startTime: Date.now(),
        ip: req.ip || req.connection?.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      };

      // Log request start
      this.logSecurityEvent('request_started', {
        requestId: req.requestContext.requestId,
        ip: req.requestContext.ip,
        userAgent: req.requestContext.userAgent,
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        category: 'audit',
        severity: 'low'
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(...args) {
        const responseTime = Date.now() - req.requestContext.startTime;
        
        SecurityLogger.logSecurityEvent('request_completed', {
          requestId: req.requestContext.requestId,
          ip: req.requestContext.ip,
          userAgent: req.requestContext.userAgent,
          method: req.method,
          path: req.path,
          originalUrl: req.originalUrl,
          statusCode: res.statusCode,
          responseTime,
          category: 'audit',
          severity: 'low'
        });

        originalEnd.apply(this, args);
      };

      next();
    };
  }

  /**
   * Legacy log method for backward compatibility
   */
  static log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata,
    };
    securityLogStream.write(`${JSON.stringify(logEntry)}\n`);
  }
}

// Initialize static properties
SecurityLogger.correlationMap = new Map();
SecurityLogger.eventCounters = new Map();
SecurityLogger.counterResetTimer = null;

module.exports = SecurityLogger;