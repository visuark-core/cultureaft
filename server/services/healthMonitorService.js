const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');
const cloudinary = require('../config/cloudinary');

class HealthMonitor {
  constructor() {
    // Only initialize Redis client if not disabled
    this.redisClient = process.env.DISABLE_REDIS === 'true' ? null : getRedisClient();
    this.healthCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
    this.periodicCheckInterval = null;
    this.periodicCheckFrequency = 60000; // 1 minute
    this.healthHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Check MongoDB health with detailed metrics
   */
  async checkMongoDB() {
    try {
      const startTime = Date.now();
      const connectionState = mongoose.connection.readyState;
      
      // Connection state mapping
      const stateMap = {
        0: 'disconnected',
        1: 'connected', 
        2: 'connecting',
        3: 'disconnecting'
      };

      if (connectionState === 1) {
        // Perform ping test
        await mongoose.connection.db.admin().ping();
        const responseTime = Date.now() - startTime;
        
        // Get additional connection details
        const dbStats = await mongoose.connection.db.stats();
        const connectionCount = mongoose.connection.db.serverConfig?.connections?.length || 0;
        
        return {
          status: 'healthy',
          responseTime: responseTime,
          details: {
            connectionState: stateMap[connectionState],
            database: mongoose.connection.name,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            collections: dbStats.collections,
            dataSize: dbStats.dataSize,
            indexSize: dbStats.indexSize,
            connections: connectionCount,
            uptime: process.uptime()
          }
        };
      } else {
        return { 
          status: 'unhealthy', 
          responseTime: Date.now() - startTime,
          message: `MongoDB connection state: ${stateMap[connectionState]}`,
          details: {
            connectionState: stateMap[connectionState],
            host: mongoose.connection.host,
            port: mongoose.connection.port
          }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: null,
        message: error.message,
        details: {
          error: error.name,
          stack: error.stack?.split('\n')[0]
        }
      };
    }
  }

  /**
   * Check Redis health with detailed metrics
   */
  async checkRedis() {
    try {
      // If Redis is disabled, report as healthy (not required)
      if (process.env.DISABLE_REDIS === 'true') {
        return {
          status: 'healthy',
          responseTime: null,
          message: 'Redis disabled - not required for operation',
          details: {
            configured: false,
            disabled: true
          }
        };
      }

      if (!this.redisClient) {
        return {
          status: 'unhealthy',
          responseTime: null,
          message: 'Redis client not initialized',
          details: {
            configured: false
          }
        };
      }

      const startTime = Date.now();
      
      // Perform ping test
      const pingResult = await this.redisClient.ping();
      const responseTime = Date.now() - startTime;
      
      if (pingResult === 'PONG') {
        // Get Redis info
        const info = await this.redisClient.info();
        const infoLines = info.split('\r\n');
        const serverInfo = {};
        
        infoLines.forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            if (['redis_version', 'uptime_in_seconds', 'connected_clients', 'used_memory_human'].includes(key)) {
              serverInfo[key] = value;
            }
          }
        });

        return {
          status: 'healthy',
          responseTime: responseTime,
          details: {
            version: serverInfo.redis_version,
            uptime: serverInfo.uptime_in_seconds,
            connectedClients: serverInfo.connected_clients,
            usedMemory: serverInfo.used_memory_human,
            connectionStatus: this.redisClient.status
          }
        };
      } else {
        return {
          status: 'unhealthy',
          responseTime: responseTime,
          message: `Unexpected ping response: ${pingResult}`,
          details: {
            connectionStatus: this.redisClient.status
          }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: null,
        message: error.message,
        details: {
          error: error.name,
          connectionStatus: this.redisClient?.status || 'unknown',
          stack: error.stack?.split('\n')[0]
        }
      };
    }
  }

  /**
   * Check Cloudinary health with detailed metrics
   */
  async checkCloudinary() {
    try {
      const startTime = Date.now();
      
      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return {
          status: 'healthy', // Changed to healthy since it's optional for basic operation
          responseTime: null,
          message: 'Cloudinary not configured - image uploads disabled',
          details: {
            configured: false,
            cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: !!process.env.CLOUDINARY_API_KEY,
            apiSecret: !!process.env.CLOUDINARY_API_SECRET
          }
        };
      }

      // Reconfigure cloudinary to ensure it has the latest config
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      // Perform ping test
      const pingResult = await cloudinary.api.ping();
      const responseTime = Date.now() - startTime;
      
      if (pingResult && pingResult.status === 'ok') {
        // Get usage information
        let usageInfo = {};
        try {
          const usage = await cloudinary.api.usage();
          usageInfo = {
            plan: usage.plan,
            credits: usage.credits,
            objects: usage.objects,
            bandwidth: usage.bandwidth,
            storage: usage.storage
          };
        } catch (usageError) {
          // Usage API might not be available on all plans
          usageInfo = { error: 'Usage information not available' };
        }

        return {
          status: 'healthy',
          responseTime: responseTime,
          details: {
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            configured: true,
            usage: usageInfo
          }
        };
      } else {
        return {
          status: 'unhealthy',
          responseTime: responseTime,
          message: 'Cloudinary ping failed',
          details: {
            pingResult: pingResult,
            configured: true
          }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: null,
        message: error.message,
        details: {
          error: error.name,
          configured: true,
          stack: error.stack?.split('\n')[0]
        }
      };
    }
  }

  /**
   * Get cached health status or perform fresh check
   */
  async getCachedHealthStatus(serviceName, checkFunction) {
    const cacheKey = `health_${serviceName}`;
    const cached = this.healthCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    
    const healthData = await checkFunction.call(this);
    this.healthCache.set(cacheKey, {
      data: healthData,
      timestamp: Date.now()
    });
    
    return healthData;
  }

  /**
   * Get comprehensive health report with detailed metrics
   */
  async getHealthReport() {
    const startTime = Date.now();
    
    try {
      const [mongoDB, redis, cloudinary] = await Promise.all([
        this.getCachedHealthStatus('mongodb', this.checkMongoDB),
        this.getCachedHealthStatus('redis', this.checkRedis),
        this.getCachedHealthStatus('cloudinary', this.checkCloudinary)
      ]);

      // Determine overall status
      const services = { mongoDB, redis, cloudinary };
      const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length;
      const totalServices = Object.keys(services).length;
      
      let overallStatus;
      if (healthyServices === totalServices) {
        overallStatus = 'healthy';
      } else if (healthyServices === 0) {
        overallStatus = 'unhealthy';
      } else {
        overallStatus = 'degraded';
      }

      // Calculate average response time
      const responseTimes = Object.values(services)
        .map(s => s.responseTime)
        .filter(rt => rt !== null);
      const avgResponseTime = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : null;

      const report = {
        overallStatus,
        timestamp: new Date().toISOString(),
        checkDuration: Date.now() - startTime,
        services,
        summary: {
          totalServices,
          healthyServices,
          degradedServices: totalServices - healthyServices,
          averageResponseTime: avgResponseTime
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        }
      };

      // Store in history
      this.addToHistory(report);
      
      return report;
    } catch (error) {
      return {
        overallStatus: 'unhealthy',
        timestamp: new Date().toISOString(),
        checkDuration: Date.now() - startTime,
        error: 'Failed to generate health report',
        message: error.message,
        details: {
          error: error.name,
          stack: error.stack?.split('\n')[0]
        }
      };
    }
  }

  /**
   * Get individual service health status
   */
  async getServiceHealth(serviceName) {
    const serviceChecks = {
      'mongodb': this.checkMongoDB,
      'redis': this.checkRedis,
      'cloudinary': this.checkCloudinary
    };

    const checkFunction = serviceChecks[serviceName.toLowerCase()];
    if (!checkFunction) {
      return {
        status: 'unknown',
        message: `Unknown service: ${serviceName}`,
        availableServices: Object.keys(serviceChecks)
      };
    }

    return await this.getCachedHealthStatus(serviceName.toLowerCase(), checkFunction);
  }

  /**
   * Add health report to history
   */
  addToHistory(report) {
    this.healthHistory.unshift({
      timestamp: report.timestamp,
      overallStatus: report.overallStatus,
      checkDuration: report.checkDuration,
      summary: report.summary
    });

    // Keep only the most recent entries
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get health history
   */
  getHealthHistory(limit = 10) {
    return this.healthHistory.slice(0, limit);
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks() {
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
    }

    this.periodicCheckInterval = setInterval(async () => {
      try {
        await this.getHealthReport();
        console.log(`[HealthMonitor] Periodic health check completed at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('[HealthMonitor] Periodic health check failed:', error.message);
      }
    }, this.periodicCheckFrequency);

    console.log(`[HealthMonitor] Periodic health checks started (interval: ${this.periodicCheckFrequency}ms)`);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks() {
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = null;
      console.log('[HealthMonitor] Periodic health checks stopped');
    }
  }

  /**
   * Clear health cache
   */
  clearCache() {
    this.healthCache.clear();
    console.log('[HealthMonitor] Health cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.healthCache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.healthCache.keys())
    };
  }
}

module.exports = new HealthMonitor();