/**
 * Security Monitoring API Routes
 * Provides endpoints for security monitoring and management
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const securityMonitoringService = require('../services/securityMonitoringService');
const securityLogger = require('../utils/securityLogger');
const { validateRequiredString, validateNumber } = require('../utils/validation');

/**
 * Get security health status
 * Public endpoint for basic health check
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = securityMonitoringService.getHealthStatus();
    
    res.json({
      success: true,
      message: 'Security health status retrieved',
      data: healthStatus
    });
  } catch (error) {
    await securityLogger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to get security health status',
      data: null
    });
  }
});

/**
 * Get security metrics
 * Requires admin authentication
 */
router.get('/metrics', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const metrics = securityMonitoringService.getMetrics();
    
    await securityLogger.logSecurityEvent('SECURITY_METRICS_ACCESSED', {
      userId: req.user.id,
      email: req.user.email
    }, req);
    
    res.json({
      success: true,
      message: 'Security metrics retrieved',
      data: metrics
    });
  } catch (error) {
    await securityLogger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to get security metrics',
      data: null
    });
  }
});

/**
 * Get active security alerts
 * Requires admin authentication
 */
router.get('/alerts', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { severity, limit = 50 } = req.query;
    
    let alerts = securityMonitoringService.getActiveAlerts();
    
    // Filter by severity if specified
    if (severity) {
      const validSeverity = validateRequiredString(severity, 'severity');
      alerts = alerts.filter(alert => alert.severity === validSeverity.toUpperCase());
    }
    
    // Limit results
    const limitNum = validateNumber(limit, 'limit', 1, 100);
    alerts = alerts.slice(0, limitNum);
    
    await securityLogger.logSecurityEvent('SECURITY_ALERTS_ACCESSED', {
      userId: req.user.id,
      email: req.user.email,
      alertCount: alerts.length
    }, req);
    
    res.json({
      success: true,
      message: 'Security alerts retrieved',
      data: {
        alerts,
        total: alerts.length
      }
    });
  } catch (error) {
    await securityLogger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to get security alerts',
      data: null
    });
  }
});

/**
 * Acknowledge security alert
 * Requires admin authentication
 */
router.post('/alerts/:alertId/acknowledge', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { alertId } = req.params;
    const validAlertId = validateRequiredString(alertId, 'alertId');
    
    const acknowledged = securityMonitoringService.acknowledgeAlert(validAlertId);
    
    if (!acknowledged) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
        data: null
      });
    }
    
    await securityLogger.logSecurityEvent('SECURITY_ALERT_ACKNOWLEDGED', {
      userId: req.user.id,
      email: req.user.email,
      alertId: validAlertId
    }, req);
    
    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: { alertId: validAlertId }
    });
  } catch (error) {
    await securityLogger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      data: null
    });
  }
});

/**
 * Generate security report
 * Requires admin authentication
 */
router.get('/report', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const validTimeRanges = ['1h', '24h', '7d'];
    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range. Valid options: 1h, 24h, 7d',
        data: null
      });
    }
    
    const report = securityMonitoringService.generateSecurityReport(timeRange);
    
    await securityLogger.logSecurityEvent('SECURITY_REPORT_GENERATED', {
      userId: req.user.id,
      email: req.user.email,
      timeRange
    }, req);
    
    res.json({
      success: true,
      message: 'Security report generated',
      data: report
    });
  } catch (error) {
    await securityLogger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to generate security report',
      data: null
    });
  }
});

/**
 * Update security thresholds
 * Requires admin authentication
 */
router.put('/thresholds', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      suspiciousActivityRate,
      failedLoginRate,
      blockedRequestRate,
      maxAlertsPerHour
    } = req.body;
    
    const newThresholds = {};
    
    if (suspiciousActivityRate !== undefined) {
      newThresholds.suspiciousActivityRate = validateNumber(
        suspiciousActivityRate, 
        'suspiciousActivityRate', 
        0, 
        1
      );
    }
    
    if (failedLoginRate !== undefined) {
      newThresholds.failedLoginRate = validateNumber(
        failedLoginRate, 
        'failedLoginRate', 
        0, 
        1
      );
    }
    
    if (blockedRequestRate !== undefined) {
      newThresholds.blockedRequestRate = validateNumber(
        blockedRequestRate, 
        'blockedRequestRate', 
        0, 
        1
      );
    }
    
    if (maxAlertsPerHour !== undefined) {
      newThresholds.maxAlertsPerHour = validateNumber(
        maxAlertsPerHour, 
        'maxAlertsPerHour', 
        1, 
        1000
      );
    }
    
    securityMonitoringService.setThresholds(newThresholds);
    
    await securityLogger.logSecurityEvent('SECURITY_THRESHOLDS_UPDATED', {
      userId: req.user.id,
      email: req.user.email,
      newThresholds
    }, req);
    
    res.json({
      success: true,
      message: 'Security thresholds updated successfully',
      data: newThresholds
    });
  } catch (error) {
    await securityLogger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to update security thresholds',
      data: null
    });
  }
});

/**
 * Get blocked IPs
 * Requires admin authentication
 */
router.get('/blocked-ips', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { blockedIPs, suspiciousIPs } = require('../middleware/security');
    
    const blockedIPList = Array.from(blockedIPs);
    const suspiciousIPList = Array.from(suspiciousIPs.entries()).map(([ip, data]) => ({
      ip,
      ...data,
      firstSeen: new Date(data.firstSeen).toISOString(),
      lastSeen: new Date(data.lastSeen).toISOString()
    }));
    
    await securityLogger.logSecurityEvent('BLOCKED_IPS_ACCESSED', {
      userId: req.user.id,
      email: req.user.email,
      blockedCount: blockedIPList.length,
      suspiciousCount: suspiciousIPList.length
    }, req);
    
    res.json({
      success: true,
      message: 'Blocked IPs retrieved',
      data: {
        blockedIPs: blockedIPList,
        suspiciousIPs: suspiciousIPList
      }
    });
  } catch (error) {
    await securityLogger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to get blocked IPs',
      data: null
    });
  }
});

/**
 * Unblock IP address
 * Requires admin authentication
 */
router.delete('/blocked-ips/:ip', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { ip } = req.params;
    const { validateIP } = require('../utils/validation');
    const validIP = validateIP(ip);
    
    const { blockedIPs, suspiciousIPs } = require('../middleware/security');
    
    const wasBlocked = blockedIPs.has(validIP);
    const wasSuspicious = suspiciousIPs.has(validIP);
    
    blockedIPs.delete(validIP);
    suspiciousIPs.delete(validIP);
    
    await securityLogger.logSecurityEvent('IP_UNBLOCKED', {
      userId: req.user.id,
      email: req.user.email,
      ip: validIP,
      wasBlocked,
      wasSuspicious
    }, req);
    
    res.json({
      success: true,
      message: 'IP address unblocked successfully',
      data: { 
        ip: validIP,
        wasBlocked,
        wasSuspicious
      }
    });
  } catch (error) {
    await securityLogger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock IP address',
      data: null
    });
  }
});

/**
 * Emergency security lockdown
 * Requires admin authentication
 */
router.post('/lockdown', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { reason, duration = 3600 } = req.body; // Default 1 hour
    
    const validReason = validateRequiredString(reason, 'reason', 1, 500);
    const validDuration = validateNumber(duration, 'duration', 60, 86400); // 1 minute to 24 hours
    
    // This would implement emergency lockdown logic
    // For now, we'll just log the event
    await securityLogger.logSecurityEvent('EMERGENCY_LOCKDOWN_INITIATED', {
      userId: req.user.id,
      email: req.user.email,
      reason: validReason,
      duration: validDuration
    }, req);
    
    // Create critical alert
    securityMonitoringService.createAlert('CRITICAL', 'EMERGENCY_LOCKDOWN', {
      initiatedBy: req.user.email,
      reason: validReason,
      duration: validDuration
    });
    
    res.json({
      success: true,
      message: 'Emergency lockdown initiated',
      data: {
        reason: validReason,
        duration: validDuration,
        initiatedBy: req.user.email,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    await securityLogger.logError(error, req);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate emergency lockdown',
      data: null
    });
  }
});

module.exports = router;