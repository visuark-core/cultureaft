const mongoose = require('mongoose');

const SystemMetricsSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  server: {
    uptime: Number, // in seconds
    memory: {
      used: Number, // in bytes
      total: Number, // in bytes
      percentage: Number
    },
    cpu: {
      usage: Number, // percentage
      loadAverage: [Number] // 1, 5, 15 minute averages
    },
    disk: {
      used: Number, // in bytes
      total: Number, // in bytes
      percentage: Number
    }
  },
  database: {
    connections: {
      active: Number,
      available: Number,
      total: Number
    },
    operations: {
      queries: Number,
      inserts: Number,
      updates: Number,
      deletes: Number
    },
    performance: {
      avgQueryTime: Number, // in milliseconds
      slowQueries: Number,
      indexHitRatio: Number
    },
    storage: {
      dataSize: Number, // in bytes
      indexSize: Number, // in bytes
      totalSize: Number // in bytes
    }
  },
  application: {
    requests: {
      total: Number,
      successful: Number,
      failed: Number,
      avgResponseTime: Number // in milliseconds
    },
    users: {
      active: Number,
      concurrent: Number,
      totalSessions: Number
    },
    cache: {
      hitRate: Number, // percentage
      missRate: Number, // percentage
      size: Number // in bytes
    },
    errors: {
      total: Number,
      critical: Number,
      warnings: Number
    }
  },
  security: {
    loginAttempts: {
      successful: Number,
      failed: Number,
      blocked: Number
    },
    threats: {
      detected: Number,
      blocked: Number,
      severity: {
        low: Number,
        medium: Number,
        high: Number,
        critical: Number
      }
    }
  },
  business: {
    orders: {
      total: Number,
      completed: Number,
      pending: Number,
      cancelled: Number
    },
    revenue: {
      total: Number,
      currency: String
    },
    users: {
      registered: Number,
      active: Number,
      suspended: Number
    },
    products: {
      total: Number,
      active: Number,
      outOfStock: Number
    }
  }
}, {
  timestamps: false // We use our own timestamp field
});

// Indexes for time-series queries
SystemMetricsSchema.index({ timestamp: -1 });
SystemMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Static method to record current metrics
SystemMetricsSchema.statics.recordMetrics = async function(metricsData) {
  try {
    const metrics = new this(metricsData);
    await metrics.save();
    return metrics;
  } catch (error) {
    console.error('Failed to record system metrics:', error);
    throw error;
  }
};

// Static method to get metrics for a time range
SystemMetricsSchema.statics.getMetricsRange = function(startTime, endTime, interval = '1h') {
  const groupBy = this.getGroupByInterval(interval);
  
  return this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startTime,
          $lte: endTime
        }
      }
    },
    {
      $group: {
        _id: groupBy,
        avgCpuUsage: { $avg: '$server.cpu.usage' },
        avgMemoryUsage: { $avg: '$server.memory.percentage' },
        avgResponseTime: { $avg: '$application.requests.avgResponseTime' },
        totalRequests: { $sum: '$application.requests.total' },
        totalErrors: { $sum: '$application.errors.total' },
        avgActiveUsers: { $avg: '$application.users.active' },
        timestamp: { $first: '$timestamp' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Helper method to get grouping interval
SystemMetricsSchema.statics.getGroupByInterval = function(interval) {
  switch (interval) {
    case '5m':
      return {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' },
        minute: { $subtract: [{ $minute: '$timestamp' }, { $mod: [{ $minute: '$timestamp' }, 5] }] }
      };
    case '15m':
      return {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' },
        minute: { $subtract: [{ $minute: '$timestamp' }, { $mod: [{ $minute: '$timestamp' }, 15] }] }
      };
    case '1h':
      return {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      };
    case '1d':
      return {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      };
    default:
      return {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      };
  }
};

// Static method to get current system health
SystemMetricsSchema.statics.getCurrentHealth = async function() {
  const latestMetrics = await this.findOne().sort({ timestamp: -1 });
  
  if (!latestMetrics) {
    return {
      status: 'unknown',
      message: 'No metrics available'
    };
  }

  const health = {
    status: 'healthy',
    issues: [],
    metrics: latestMetrics,
    timestamp: latestMetrics.timestamp
  };

  // Check various health indicators
  if (latestMetrics.server.memory.percentage > 90) {
    health.status = 'warning';
    health.issues.push('High memory usage');
  }

  if (latestMetrics.server.cpu.usage > 90) {
    health.status = 'warning';
    health.issues.push('High CPU usage');
  }

  if (latestMetrics.application.requests.avgResponseTime > 5000) {
    health.status = 'warning';
    health.issues.push('Slow response times');
  }

  if (latestMetrics.application.errors.critical > 0) {
    health.status = 'critical';
    health.issues.push('Critical errors detected');
  }

  if (latestMetrics.database.performance.slowQueries > 10) {
    health.status = 'warning';
    health.issues.push('Slow database queries');
  }

  return health;
};

// Static method to get performance summary
SystemMetricsSchema.statics.getPerformanceSummary = async function(hours = 24) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const summary = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: null,
        avgCpuUsage: { $avg: '$server.cpu.usage' },
        maxCpuUsage: { $max: '$server.cpu.usage' },
        avgMemoryUsage: { $avg: '$server.memory.percentage' },
        maxMemoryUsage: { $max: '$server.memory.percentage' },
        avgResponseTime: { $avg: '$application.requests.avgResponseTime' },
        maxResponseTime: { $max: '$application.requests.avgResponseTime' },
        totalRequests: { $sum: '$application.requests.total' },
        totalErrors: { $sum: '$application.errors.total' },
        totalCriticalErrors: { $sum: '$application.errors.critical' },
        avgActiveUsers: { $avg: '$application.users.active' },
        maxActiveUsers: { $max: '$application.users.active' }
      }
    }
  ]);

  return summary[0] || {};
};

// Static method to detect anomalies
SystemMetricsSchema.statics.detectAnomalies = async function(hours = 24) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const metrics = await this.find({
    timestamp: { $gte: startTime }
  }).sort({ timestamp: -1 });

  const anomalies = [];

  // Simple anomaly detection based on thresholds
  metrics.forEach(metric => {
    if (metric.server.cpu.usage > 95) {
      anomalies.push({
        type: 'cpu_spike',
        severity: 'high',
        timestamp: metric.timestamp,
        value: metric.server.cpu.usage,
        message: `CPU usage spiked to ${metric.server.cpu.usage}%`
      });
    }

    if (metric.server.memory.percentage > 95) {
      anomalies.push({
        type: 'memory_spike',
        severity: 'high',
        timestamp: metric.timestamp,
        value: metric.server.memory.percentage,
        message: `Memory usage spiked to ${metric.server.memory.percentage}%`
      });
    }

    if (metric.application.requests.avgResponseTime > 10000) {
      anomalies.push({
        type: 'slow_response',
        severity: 'medium',
        timestamp: metric.timestamp,
        value: metric.application.requests.avgResponseTime,
        message: `Response time increased to ${metric.application.requests.avgResponseTime}ms`
      });
    }

    if (metric.application.errors.critical > 0) {
      anomalies.push({
        type: 'critical_errors',
        severity: 'critical',
        timestamp: metric.timestamp,
        value: metric.application.errors.critical,
        message: `${metric.application.errors.critical} critical errors detected`
      });
    }
  });

  return anomalies.sort((a, b) => b.timestamp - a.timestamp);
};

const SystemMetrics = mongoose.model('SystemMetrics', SystemMetricsSchema);

module.exports = SystemMetrics;