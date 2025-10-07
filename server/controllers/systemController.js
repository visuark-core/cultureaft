const SystemSettings = require('../models/SystemSettings');
const SystemMetrics = require('../models/SystemMetrics');
const AuditLog = require('../models/AuditLog');
const AdminUser = require('../models/AdminUser');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const os = require('os');
const mongoose = require('mongoose');

// Get system settings by category
const getSettings = async (req, res) => {
  try {
    const { category } = req.params;
    const includePrivate = req.admin.role.level <= 2; // Super admin and admin can see private settings

    let settings;
    if (category) {
      settings = await SystemSettings.getByCategory(category, includePrivate);
    } else {
      const query = includePrivate ? {} : { isPublic: true };
      settings = await SystemSettings.find(query).sort({ category: 1, key: 1 });
    }

    // Log the action
    await AuditLog.logAction({
      adminId: req.admin._id,
      action: 'system_config_view',
      resource: 'system',
      resourceId: category || 'all',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      severity: 'low'
    });

    res.json({
      success: true,
      message: 'Settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error getting system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system settings',
      data: null
    });
  }
};

// Update system setting
const updateSetting = async (req, res) => {
  try {
    const { category, key } = req.params;
    const { value, reason } = req.body;

    // Check if admin has permission to modify system settings
    if (req.admin.role.level > 2) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to modify system settings',
        data: null
      });
    }

    const updatedSetting = await SystemSettings.updateSetting(
      category,
      key,
      value,
      req.admin._id,
      reason
    );

    // Log the action
    await AuditLog.logAction({
      adminId: req.admin._id,
      action: 'system_config_update',
      resource: 'system',
      resourceId: `${category}.${key}`,
      changes: { oldValue: updatedSetting.history[updatedSetting.history.length - 1]?.value, newValue: value },
      metadata: { reason },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      severity: 'medium'
    });

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: updatedSetting
    });
  } catch (error) {
    console.error('Error updating system setting:', error);
    
    // Log the failed action
    await AuditLog.logAction({
      adminId: req.admin._id,
      action: 'system_config_update',
      resource: 'system',
      resourceId: `${req.params.category}.${req.params.key}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      severity: 'medium',
      status: 'failed',
      errorMessage: error.message
    });

    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update system setting',
      data: null
    });
  }
};

// Get system health and performance metrics
const getSystemHealth = async (req, res) => {
  try {
    const health = await SystemMetrics.getCurrentHealth();
    
    // Get additional real-time system info
    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: os.cpus(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      loadAverage: os.loadavg()
    };

    // Log the action
    await AuditLog.logAction({
      adminId: req.admin._id,
      action: 'system_health_view',
      resource: 'system',
      resourceId: 'health',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      severity: 'low'
    });

    res.json({
      success: true,
      message: 'System health retrieved successfully',
      data: {
        health,
        systemInfo,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system health',
      data: null
    });
  }
};

// Get performance metrics
const getPerformanceMetrics = async (req, res) => {
  try {
    const { timeRange = '24h', interval = '1h' } = req.query;
    
    // Parse time range
    const hours = parseInt(timeRange.replace('h', '')) || 24;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const endTime = new Date();

    const metrics = await SystemMetrics.getMetricsRange(startTime, endTime, interval);
    const summary = await SystemMetrics.getPerformanceSummary(hours);
    const anomalies = await SystemMetrics.detectAnomalies(hours);

    // Log the action
    await AuditLog.logAction({
      adminId: req.admin._id,
      action: 'system_metrics_view',
      resource: 'system',
      resourceId: 'metrics',
      metadata: { timeRange, interval },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      severity: 'low'
    });

    res.json({
      success: true,
      message: 'Performance metrics retrieved successfully',
      data: {
        metrics,
        summary,
        anomalies,
        timeRange: { startTime, endTime, interval }
      }
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics',
      data: null
    });
  }
};

// Get audit logs with filtering
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      adminId,
      action,
      resource,
      severity,
      startDate,
      endDate,
      ipAddress
    } = req.query;

    // Build query
    const query = {};
    
    if (adminId) query.adminId = adminId;
    if (action) query.action = new RegExp(action, 'i');
    if (resource) query.resource = resource;
    if (severity) query.severity = severity;
    if (ipAddress) query['request.ipAddress'] = ipAddress;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('adminId', 'email profile.firstName profile.lastName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query)
    ]);

    // Log the action
    await AuditLog.logAction({
      adminId: req.admin._id,
      action: 'audit_logs_view',
      resource: 'system',
      resourceId: 'audit',
      metadata: { filters: req.query },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      severity: 'low'
    });

    res.json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs',
      data: null
    });
  }
};

// Get security report
const getSecurityReport = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const report = await AuditLog.generateSecurityReport(parseInt(days));
    const securityEvents = await AuditLog.getSecurityEvents(parseInt(days));
    const permissionViolations = await AuditLog.getPermissionViolations(parseInt(days));

    // Log the action
    await AuditLog.logAction({
      adminId: req.admin._id,
      action: 'security_report_view',
      resource: 'system',
      resourceId: 'security',
      metadata: { days: parseInt(days) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      severity: 'medium'
    });

    res.json({
      success: true,
      message: 'Security report generated successfully',
      data: {
        report,
        securityEvents,
        permissionViolations
      }
    });
  } catch (error) {
    console.error('Error generating security report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate security report',
      data: null
    });
  }
};

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    // Get database statistics
    const dbStats = await mongoose.connection.db.stats();
    
    // Get collection counts
    const [
      totalUsers,
      activeUsers,
      totalAdmins,
      totalProducts,
      activeProducts,
      totalOrders,
      recentOrders,
      totalAuditLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      AdminUser.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      AuditLog.countDocuments()
    ]);

    const stats = {
      database: {
        size: dbStats.dataSize,
        indexSize: dbStats.indexSize,
        collections: dbStats.collections,
        objects: dbStats.objects
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      admins: {
        total: totalAdmins
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: totalProducts - activeProducts
      },
      orders: {
        total: totalOrders,
        recent: recentOrders
      },
      audit: {
        totalLogs: totalAuditLogs
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: os.platform()
      }
    };

    // Log the action
    await AuditLog.logAction({
      adminId: req.admin._id,
      action: 'system_stats_view',
      resource: 'system',
      resourceId: 'stats',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      severity: 'low'
    });

    res.json({
      success: true,
      message: 'System statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error getting system statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system statistics',
      data: null
    });
  }
};

// Initialize default system settings
const initializeSettings = async (req, res) => {
  try {
    // Only super admins can initialize settings
    if (req.admin.role.level > 1) {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can initialize system settings',
        data: null
      });
    }

    await SystemSettings.createDefaults(req.admin._id);

    // Log the action
    await AuditLog.logAction({
      adminId: req.admin._id,
      action: 'system_settings_initialize',
      resource: 'system',
      resourceId: 'settings',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      severity: 'high'
    });

    res.json({
      success: true,
      message: 'Default system settings initialized successfully',
      data: null
    });
  } catch (error) {
    console.error('Error initializing system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize system settings',
      data: null
    });
  }
};

// Record current system metrics
const recordMetrics = async (req, res) => {
  try {
    // Get current system metrics
    const memUsage = process.memoryUsage();
    const cpuUsage = os.loadavg();
    
    // Get database stats
    const dbStats = await mongoose.connection.db.stats();
    
    // Get application metrics
    const [totalUsers, activeUsers, totalOrders, recentOrders] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 
        lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      Order.countDocuments(),
      Order.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    const metricsData = {
      timestamp: new Date(),
      server: {
        uptime: process.uptime(),
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
        },
        cpu: {
          usage: cpuUsage[0] * 100, // 1-minute load average as percentage
          loadAverage: cpuUsage
        }
      },
      database: {
        connections: {
          active: mongoose.connection.readyState === 1 ? 1 : 0,
          available: 1,
          total: 1
        },
        storage: {
          dataSize: dbStats.dataSize,
          indexSize: dbStats.indexSize,
          totalSize: dbStats.dataSize + dbStats.indexSize
        }
      },
      application: {
        users: {
          active: activeUsers,
          totalSessions: activeUsers
        },
        requests: {
          total: 0, // Would need request counter middleware
          successful: 0,
          failed: 0,
          avgResponseTime: 0
        },
        errors: {
          total: 0,
          critical: 0,
          warnings: 0
        }
      },
      business: {
        orders: {
          total: totalOrders,
          completed: 0, // Would need to count by status
          pending: 0,
          cancelled: 0
        },
        users: {
          registered: totalUsers,
          active: activeUsers,
          suspended: 0
        }
      }
    };

    const metrics = await SystemMetrics.recordMetrics(metricsData);

    // Log the action
    await AuditLog.logAction({
      adminId: req.admin._id,
      action: 'system_metrics_record',
      resource: 'system',
      resourceId: 'metrics',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      severity: 'low'
    });

    res.json({
      success: true,
      message: 'System metrics recorded successfully',
      data: metrics
    });
  } catch (error) {
    console.error('Error recording system metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record system metrics',
      data: null
    });
  }
};

module.exports = {
  getSettings,
  updateSetting,
  getSystemHealth,
  getPerformanceMetrics,
  getAuditLogs,
  getSecurityReport,
  getSystemStats,
  initializeSettings,
  recordMetrics
};