const SystemMetrics = require('../models/SystemMetrics');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');
const os = require('os');

class SystemMetricsService {
  constructor() {
    this.isCollecting = false;
    this.collectionInterval = null;
    this.intervalMs = 5 * 60 * 1000; // 5 minutes
  }

  // Start automatic metrics collection
  startCollection() {
    if (this.isCollecting) {
      console.log('System metrics collection is already running');
      return;
    }

    console.log('Starting system metrics collection...');
    this.isCollecting = true;
    
    // Collect initial metrics
    this.collectMetrics();
    
    // Set up interval for regular collection
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, this.intervalMs);
  }

  // Stop automatic metrics collection
  stopCollection() {
    if (!this.isCollecting) {
      console.log('System metrics collection is not running');
      return;
    }

    console.log('Stopping system metrics collection...');
    this.isCollecting = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  // Collect current system metrics
  async collectMetrics() {
    try {
      console.log('Collecting system metrics...');
      
      const timestamp = new Date();
      
      // Get system information
      const memUsage = process.memoryUsage();
      const cpuUsage = os.loadavg();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      // Get database stats
      let dbStats = {};
      try {
        dbStats = await mongoose.connection.db.stats();
      } catch (error) {
        console.warn('Failed to get database stats:', error.message);
        dbStats = {
          dataSize: 0,
          indexSize: 0,
          objects: 0,
          collections: 0
        };
      }

      // Get application metrics
      const [
        totalUsers,
        activeUsers,
        totalOrders,
        recentOrders,
        totalProducts,
        activeProducts,
        recentAuditLogs,
        criticalAuditLogs
      ] = await Promise.all([
        User.countDocuments().catch(() => 0),
        User.countDocuments({ 
          lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).catch(() => 0),
        Order.countDocuments().catch(() => 0),
        Order.countDocuments({ 
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).catch(() => 0),
        Product.countDocuments().catch(() => 0),
        Product.countDocuments({ status: 'active' }).catch(() => 0),
        AuditLog.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
        }).catch(() => 0),
        AuditLog.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
          severity: 'critical'
        }).catch(() => 0)
      ]);

      // Calculate metrics
      const metricsData = {
        timestamp,
        server: {
          uptime: process.uptime(),
          memory: {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
          },
          cpu: {
            usage: Math.min(cpuUsage[0] * 100, 100), // 1-minute load average as percentage, capped at 100%
            loadAverage: cpuUsage
          },
          disk: {
            used: usedMem,
            total: totalMem,
            percentage: (usedMem / totalMem) * 100
          }
        },
        database: {
          connections: {
            active: mongoose.connection.readyState === 1 ? 1 : 0,
            available: 1,
            total: 1
          },
          operations: {
            queries: 0, // Would need query counter
            inserts: 0,
            updates: 0,
            deletes: 0
          },
          performance: {
            avgQueryTime: 0, // Would need query time tracking
            slowQueries: 0,
            indexHitRatio: 0
          },
          storage: {
            dataSize: dbStats.dataSize || 0,
            indexSize: dbStats.indexSize || 0,
            totalSize: (dbStats.dataSize || 0) + (dbStats.indexSize || 0)
          }
        },
        application: {
          requests: {
            total: 0, // Would need request counter middleware
            successful: 0,
            failed: 0,
            avgResponseTime: 0
          },
          users: {
            active: activeUsers,
            concurrent: activeUsers, // Approximation
            totalSessions: activeUsers
          },
          cache: {
            hitRate: 0, // Would need cache metrics
            missRate: 0,
            size: 0
          },
          errors: {
            total: recentAuditLogs,
            critical: criticalAuditLogs,
            warnings: 0
          }
        },
        security: {
          loginAttempts: {
            successful: 0, // Would need login tracking
            failed: 0,
            blocked: 0
          },
          threats: {
            detected: 0,
            blocked: 0,
            severity: {
              low: 0,
              medium: 0,
              high: 0,
              critical: criticalAuditLogs
            }
          }
        },
        business: {
          orders: {
            total: totalOrders,
            completed: 0, // Would need status-based counting
            pending: 0,
            cancelled: 0
          },
          revenue: {
            total: 0, // Would need revenue calculation
            currency: 'USD'
          },
          users: {
            registered: totalUsers,
            active: activeUsers,
            suspended: 0 // Would need status-based counting
          },
          products: {
            total: totalProducts,
            active: activeProducts,
            outOfStock: 0 // Would need inventory-based counting
          }
        }
      };

      // Save metrics to database
      const metrics = await SystemMetrics.recordMetrics(metricsData);
      
      console.log(`System metrics collected successfully at ${timestamp.toISOString()}`);
      
      // Log any concerning metrics
      if (metricsData.server.memory.percentage > 80) {
        console.warn(`High memory usage: ${metricsData.server.memory.percentage.toFixed(1)}%`);
      }
      
      if (metricsData.server.cpu.usage > 80) {
        console.warn(`High CPU usage: ${metricsData.server.cpu.usage.toFixed(1)}%`);
      }
      
      if (criticalAuditLogs > 0) {
        console.warn(`${criticalAuditLogs} critical security events in the last hour`);
      }
      
      return metrics;
      
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      
      // Try to record a minimal error metric
      try {
        await SystemMetrics.recordMetrics({
          timestamp: new Date(),
          server: {
            uptime: process.uptime(),
            memory: {
              used: 0,
              total: 0,
              percentage: 0
            },
            cpu: {
              usage: 0,
              loadAverage: [0, 0, 0]
            }
          },
          database: {
            connections: { active: 0, available: 0, total: 0 },
            storage: { dataSize: 0, indexSize: 0, totalSize: 0 }
          },
          application: {
            requests: { total: 0, successful: 0, failed: 1, avgResponseTime: 0 },
            users: { active: 0, concurrent: 0, totalSessions: 0 },
            errors: { total: 1, critical: 1, warnings: 0 }
          },
          business: {
            orders: { total: 0, completed: 0, pending: 0, cancelled: 0 },
            users: { registered: 0, active: 0, suspended: 0 },
            products: { total: 0, active: 0, outOfStock: 0 }
          }
        });
      } catch (saveError) {
        console.error('Failed to save error metrics:', saveError);
      }
      
      throw error;
    }
  }

  // Get current collection status
  getStatus() {
    return {
      isCollecting: this.isCollecting,
      intervalMs: this.intervalMs,
      nextCollection: this.collectionInterval ? 
        new Date(Date.now() + this.intervalMs) : null
    };
  }

  // Update collection interval
  setInterval(intervalMs) {
    this.intervalMs = intervalMs;
    
    if (this.isCollecting) {
      this.stopCollection();
      this.startCollection();
    }
  }

  // Force immediate metrics collection
  async forceCollection() {
    return await this.collectMetrics();
  }

  // Clean up old metrics (called periodically)
  async cleanupOldMetrics(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const result = await SystemMetrics.deleteMany({
        timestamp: { $lt: cutoffDate }
      });
      
      console.log(`Cleaned up ${result.deletedCount} old metrics records`);
      return result.deletedCount;
      
    } catch (error) {
      console.error('Error cleaning up old metrics:', error);
      throw error;
    }
  }
}

// Create singleton instance
const systemMetricsService = new SystemMetricsService();

module.exports = systemMetricsService;