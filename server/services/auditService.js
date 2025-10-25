const AuditLog = require('../models/AuditLog');
const AdminUser = require('../models/AdminUser');

class AuditService {
  
  // Log admin action with enhanced context
  async logAction(adminId, action, resource, options = {}) {
    try {
      const {
        resourceId,
        changes,
        previousValues,
        ipAddress = 'unknown',
        userAgent = 'unknown',
        severity = 'low',
        description,
        metadata = {}
      } = options;

      const logEntry = new AuditLog({
        adminId,
        action,
        resource,
        resourceId,
        changes,
        previousValues,
        ipAddress,
        userAgent,
        severity,
        description: description || `${action} performed on ${resource}`,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      });

      await logEntry.save();
      
      // Check for suspicious activity
      await this.checkSuspiciousActivity(adminId);
      
      return logEntry;
    } catch (error) {
      console.error('Error logging audit action:', error);
      throw error;
    }
  }

  // Get audit logs with filtering and pagination
  async getAuditLogs(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = options;

      const query = {};

      // Apply filters
      if (filters.adminId) {
        query.adminId = filters.adminId;
      }

      if (filters.action) {
        if (Array.isArray(filters.action)) {
          query.action = { $in: filters.action };
        } else {
          query.action = filters.action;
        }
      }

      if (filters.resource) {
        if (Array.isArray(filters.resource)) {
          query.resource = { $in: filters.resource };
        } else {
          query.resource = filters.resource;
        }
      }

      if (filters.severity) {
        if (Array.isArray(filters.severity)) {
          query.severity = { $in: filters.severity };
        } else {
          query.severity = filters.severity;
        }
      }

      if (filters.dateFrom || filters.dateTo) {
        query.timestamp = {};
        if (filters.dateFrom) {
          query.timestamp.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.timestamp.$lte = new Date(filters.dateTo);
        }
      }

      if (filters.ipAddress) {
        query.ipAddress = filters.ipAddress;
      }

      if (filters.resourceId) {
        query.resourceId = filters.resourceId;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      
      const [logs, totalCount] = await Promise.all([
        AuditLog.find(query)
          .populate('adminId', 'email profile.firstName profile.lastName role.name')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(query)
      ]);

      return {
        logs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error retrieving audit logs:', error);
      throw error;
    }
  }

  // Get admin activity summary
  async getAdminActivitySummary(adminId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const pipeline = [
        {
          $match: {
            adminId: adminId,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
              action: "$action",
              resource: "$resource"
            },
            count: { $sum: 1 },
            lastActivity: { $max: "$timestamp" }
          }
        },
        {
          $group: {
            _id: "$_id.date",
            activities: {
              $push: {
                action: "$_id.action",
                resource: "$_id.resource",
                count: "$count",
                lastActivity: "$lastActivity"
              }
            },
            totalActions: { $sum: "$count" }
          }
        },
        {
          $sort: { "_id": -1 }
        }
      ];

      const activitySummary = await AuditLog.aggregate(pipeline);
      
      return activitySummary;
    } catch (error) {
      console.error('Error getting admin activity summary:', error);
      throw error;
    }
  }

  // Get security events
  async getSecurityEvents(days = 7, severity = ['high', 'critical']) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const securityEvents = await AuditLog.find({
        timestamp: { $gte: startDate },
        $or: [
          { severity: { $in: severity } },
          { action: { $in: ['login_failed', 'unauthorized_access_attempt', 'suspicious_activity_detected'] } }
        ]
      })
      .populate('adminId', 'email profile.firstName profile.lastName role.name')
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

      return securityEvents;
    } catch (error) {
      console.error('Error getting security events:', error);
      throw error;
    }
  }

  // Check for suspicious activity patterns
  async checkSuspiciousActivity(adminId) {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Count actions in the last hour
      const recentActivityCount = await AuditLog.countDocuments({
        adminId,
        timestamp: { $gte: oneHourAgo }
      });

      // Flag if more than 100 actions in an hour
      if (recentActivityCount > 100) {
        await this.logAction(adminId, 'suspicious_activity_detected', 'system', {
          ipAddress: 'system',
          userAgent: 'audit-service',
          severity: 'critical',
          description: `Suspicious activity detected: ${recentActivityCount} actions in 1 hour`,
          metadata: {
            activityCount: recentActivityCount,
            timeWindow: '1 hour',
            threshold: 100
          }
        });

        // Optionally, you could also lock the account or send alerts here
        return { suspicious: true, activityCount: recentActivityCount };
      }

      return { suspicious: false, activityCount: recentActivityCount };
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
      return { suspicious: false, activityCount: 0 };
    }
  }

  // Generate audit report
  async generateAuditReport(filters = {}, format = 'json') {
    try {
      const { logs } = await this.getAuditLogs(filters, { limit: 10000 });
      
      if (format === 'csv') {
        return this.convertToCSV(logs);
      }
      
      return {
        reportGenerated: new Date().toISOString(),
        filters,
        totalRecords: logs.length,
        logs
      };
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw error;
    }
  }

  // Convert audit logs to CSV format
  convertToCSV(logs) {
    const headers = [
      'Timestamp',
      'Admin Email',
      'Admin Name',
      'Action',
      'Resource',
      'Resource ID',
      'Severity',
      'IP Address',
      'Description'
    ];

    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        log.timestamp.toISOString(),
        log.adminId?.email || 'Unknown',
        log.adminId ? `${log.adminId.profile?.firstName || ''} ${log.adminId.profile?.lastName || ''}`.trim() : 'Unknown',
        log.action,
        log.resource,
        log.resourceId || '',
        log.severity,
        log.ipAddress,
        `"${log.description.replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Get audit statistics
  async getAuditStatistics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startDate }
          }
        },
        {
          $facet: {
            actionStats: [
              {
                $group: {
                  _id: "$action",
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } }
            ],
            resourceStats: [
              {
                $group: {
                  _id: "$resource",
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } }
            ],
            severityStats: [
              {
                $group: {
                  _id: "$severity",
                  count: { $sum: 1 }
                }
              }
            ],
            dailyStats: [
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                  count: { $sum: 1 }
                }
              },
              { $sort: { "_id": 1 } }
            ],
            topAdmins: [
              {
                $group: {
                  _id: "$adminId",
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 10 },
              {
                $lookup: {
                  from: "adminusers",
                  localField: "_id",
                  foreignField: "_id",
                  as: "admin"
                }
              },
              {
                $project: {
                  count: 1,
                  email: { $arrayElemAt: ["$admin.email", 0] },
                  name: {
                    $concat: [
                      { $arrayElemAt: ["$admin.profile.firstName", 0] },
                      " ",
                      { $arrayElemAt: ["$admin.profile.lastName", 0] }
                    ]
                  }
                }
              }
            ]
          }
        }
      ];

      const [statistics] = await AuditLog.aggregate(pipeline);
      
      return {
        period: `${days} days`,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        ...statistics
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      throw error;
    }
  }

  // Clean up old audit logs (for maintenance)
  async cleanupOldLogs(retentionDays = 730) { // 2 years default
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      console.log(`Cleaned up ${result.deletedCount} old audit logs`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();