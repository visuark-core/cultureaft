/**
 * Security Monitoring Service
 * Real-time security monitoring and alerting system
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class SecurityMonitoringService extends EventEmitter {
  constructor() {
    super();
    this.alerts = [];
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousActivities: 0,
      failedLogins: 0,
      rateLimitExceeded: 0,
      lastReset: Date.now()
    };
    this.thresholds = {
      suspiciousActivityRate: 0.1, // 10% of requests
      failedLoginRate: 0.05, // 5% of auth requests
      blockedRequestRate: 0.02, // 2% of requests
      maxAlertsPerHour: 50
    };
    this.alertHistory = [];
    this.monitoringInterval = null;
    
    this.startMonitoring();
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring() {
    // Monitor every 5 minutes
    this.monitoringInterval = setInterval(() => {
      this.analyzeSecurityMetrics();
      this.cleanupOldAlerts();
    }, 5 * 60 * 1000);
    
    // Reset metrics every hour
    setInterval(() => {
      this.resetMetrics();
    }, 60 * 60 * 1000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Record security event
   */
  recordEvent(eventType, data = {}) {
    const timestamp = Date.now();
    
    // Update metrics
    this.metrics.totalRequests++;
    
    switch (eventType) {
      case 'BLOCKED_REQUEST':
        this.metrics.blockedRequests++;
        break;
      case 'SUSPICIOUS_ACTIVITY':
        this.metrics.suspiciousActivities++;
        break;
      case 'FAILED_LOGIN':
        this.metrics.failedLogins++;
        break;
      case 'RATE_LIMIT_EXCEEDED':
        this.metrics.rateLimitExceeded++;
        break;
    }
    
    // Emit event for real-time processing
    this.emit('securityEvent', {
      type: eventType,
      timestamp,
      data
    });
    
    // Check if immediate alert is needed
    this.checkForImmediateThreats(eventType, data);
  }

  /**
   * Check for immediate security threats
   */
  checkForImmediateThreats(eventType, data) {
    const now = Date.now();
    const recentWindow = 5 * 60 * 1000; // 5 minutes
    
    // Check for rapid-fire attacks
    if (['SUSPICIOUS_ACTIVITY', 'FAILED_LOGIN', 'BLOCKED_REQUEST'].includes(eventType)) {
      const recentEvents = this.alertHistory.filter(
        alert => now - alert.timestamp < recentWindow && alert.type === eventType
      );
      
      if (recentEvents.length > 10) {
        this.createAlert('HIGH', 'RAPID_ATTACK_DETECTED', {
          eventType,
          count: recentEvents.length,
          timeWindow: '5 minutes',
          ...data
        });
      }
    }
    
    // Check for coordinated attacks from multiple IPs
    if (data.ip) {
      const recentIPs = new Set();
      this.alertHistory
        .filter(alert => now - alert.timestamp < recentWindow)
        .forEach(alert => {
          if (alert.data && alert.data.ip) {
            recentIPs.add(alert.data.ip);
          }
        });
      
      if (recentIPs.size > 5) {
        this.createAlert('CRITICAL', 'COORDINATED_ATTACK', {
          uniqueIPs: recentIPs.size,
          timeWindow: '5 minutes'
        });
      }
    }
  }

  /**
   * Analyze security metrics and create alerts
   */
  analyzeSecurityMetrics() {
    const { totalRequests, blockedRequests, suspiciousActivities, failedLogins } = this.metrics;
    
    if (totalRequests === 0) return;
    
    // Calculate rates
    const suspiciousRate = suspiciousActivities / totalRequests;
    const blockedRate = blockedRequests / totalRequests;
    const failedLoginRate = failedLogins / totalRequests;
    
    // Check thresholds
    if (suspiciousRate > this.thresholds.suspiciousActivityRate) {
      this.createAlert('HIGH', 'HIGH_SUSPICIOUS_ACTIVITY_RATE', {
        rate: (suspiciousRate * 100).toFixed(2) + '%',
        threshold: (this.thresholds.suspiciousActivityRate * 100).toFixed(2) + '%',
        count: suspiciousActivities,
        totalRequests
      });
    }
    
    if (blockedRate > this.thresholds.blockedRequestRate) {
      this.createAlert('MEDIUM', 'HIGH_BLOCKED_REQUEST_RATE', {
        rate: (blockedRate * 100).toFixed(2) + '%',
        threshold: (this.thresholds.blockedRequestRate * 100).toFixed(2) + '%',
        count: blockedRequests,
        totalRequests
      });
    }
    
    if (failedLoginRate > this.thresholds.failedLoginRate) {
      this.createAlert('HIGH', 'HIGH_FAILED_LOGIN_RATE', {
        rate: (failedLoginRate * 100).toFixed(2) + '%',
        threshold: (this.thresholds.failedLoginRate * 100).toFixed(2) + '%',
        count: failedLogins,
        totalRequests
      });
    }
  }

  /**
   * Create security alert
   */
  createAlert(severity, type, data = {}) {
    const alert = {
      id: this.generateAlertId(),
      severity,
      type,
      timestamp: Date.now(),
      data,
      acknowledged: false
    };
    
    this.alerts.push(alert);
    this.alertHistory.push(alert);
    
    // Limit active alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    // Emit alert event
    this.emit('securityAlert', alert);
    
    // Log alert
    this.logAlert(alert);
    
    return alert;
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log security alert
   */
  async logAlert(alert) {
    try {
      const logDir = path.join(__dirname, '../logs');
      const alertLogFile = path.join(logDir, 'security-alerts.log');
      
      await fs.mkdir(logDir, { recursive: true });
      
      const logEntry = JSON.stringify({
        ...alert,
        timestamp: new Date(alert.timestamp).toISOString()
      }) + '\n';
      
      await fs.appendFile(alertLogFile, logEntry);
    } catch (error) {
      console.error('Failed to log security alert:', error);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity) {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Get security metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.lastReset;
    return {
      ...this.metrics,
      uptime,
      rates: {
        suspiciousActivityRate: this.metrics.totalRequests > 0 
          ? (this.metrics.suspiciousActivities / this.metrics.totalRequests * 100).toFixed(2) + '%'
          : '0%',
        blockedRequestRate: this.metrics.totalRequests > 0
          ? (this.metrics.blockedRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
          : '0%',
        failedLoginRate: this.metrics.totalRequests > 0
          ? (this.metrics.failedLogins / this.metrics.totalRequests * 100).toFixed(2) + '%'
          : '0%'
      },
      alertCounts: {
        total: this.alerts.length,
        active: this.getActiveAlerts().length,
        critical: this.getAlertsBySeverity('CRITICAL').length,
        high: this.getAlertsBySeverity('HIGH').length,
        medium: this.getAlertsBySeverity('MEDIUM').length,
        low: this.getAlertsBySeverity('LOW').length
      }
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousActivities: 0,
      failedLogins: 0,
      rateLimitExceeded: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Clean up old alerts
   */
  cleanupOldAlerts() {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    this.alerts = this.alerts.filter(alert => now - alert.timestamp < maxAge);
    this.alertHistory = this.alertHistory.filter(alert => now - alert.timestamp < maxAge);
  }

  /**
   * Generate security report
   */
  generateSecurityReport(timeRange = '24h') {
    const now = Date.now();
    let startTime;
    
    switch (timeRange) {
      case '1h':
        startTime = now - (60 * 60 * 1000);
        break;
      case '24h':
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = now - (24 * 60 * 60 * 1000);
    }
    
    const relevantAlerts = this.alertHistory.filter(
      alert => alert.timestamp >= startTime
    );
    
    const alertsByType = {};
    const alertsBySeverity = {};
    
    relevantAlerts.forEach(alert => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    });
    
    return {
      timeRange,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(now).toISOString(),
      totalAlerts: relevantAlerts.length,
      alertsByType,
      alertsBySeverity,
      topThreats: Object.entries(alertsByType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count })),
      metrics: this.getMetrics()
    };
  }

  /**
   * Set custom thresholds
   */
  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get system health status
   */
  getHealthStatus() {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL');
    const highAlerts = activeAlerts.filter(a => a.severity === 'HIGH');
    
    let status = 'HEALTHY';
    let message = 'All systems operating normally';
    
    if (criticalAlerts.length > 0) {
      status = 'CRITICAL';
      message = `${criticalAlerts.length} critical security alert(s) require immediate attention`;
    } else if (highAlerts.length > 0) {
      status = 'WARNING';
      message = `${highAlerts.length} high-priority security alert(s) detected`;
    } else if (activeAlerts.length > 10) {
      status = 'WARNING';
      message = `${activeAlerts.length} active security alerts`;
    }
    
    return {
      status,
      message,
      timestamp: new Date().toISOString(),
      alertCounts: {
        critical: criticalAlerts.length,
        high: highAlerts.length,
        total: activeAlerts.length
      }
    };
  }
}

// Create singleton instance
const securityMonitoringService = new SecurityMonitoringService();

module.exports = securityMonitoringService;