const User = require('../models/User');
const { AdminUser } = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');
const { validationResult } = require('express-validator');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

/**
 * Get all users with advanced filtering and pagination
 */
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      registrationDateFrom,
      registrationDateTo,
      minOrders,
      maxOrders,
      minSpent,
      maxSpent,
      segmentation,
      hasFlags,
      flagType,
      tags,
      emailVerified,
      phoneVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filters object
    const filters = {
      search,
      status,
      registrationDateFrom,
      registrationDateTo,
      minOrders,
      maxOrders,
      minSpent,
      maxSpent,
      segmentation,
      hasFlags: hasFlags === 'true',
      flagType,
      tags: tags ? tags.split(',') : undefined,
      emailVerified: emailVerified !== undefined ? emailVerified === 'true' : undefined,
      phoneVerified: phoneVerified !== undefined ? phoneVerified === 'true' : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Max 100 per page
      sortBy,
      sortOrder
    };

    // Get users with advanced search
    const users = await User.advancedSearch(filters, options);
    
    // Get total count for pagination
    const totalQuery = User.advancedSearch(filters, { ...options, page: 1, limit: 0 });
    const totalUsers = await User.countDocuments(totalQuery.getQuery());

    // Get user statistics
    const stats = await User.getUserStats();

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(totalUsers / options.limit),
          totalUsers,
          hasNext: options.page < Math.ceil(totalUsers / options.limit),
          hasPrev: options.page > 1
        },
        stats,
        filters: filters
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      data: null,
      error: error.message
    });
  }
};

/**
 * Get single user by ID with complete details
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('referredBy', 'firstName lastName email customerId')
      .populate('flags.createdBy', 'profile email')
      .populate('flags.resolvedBy', 'profile email')
      .populate('notes.createdBy', 'profile email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    // Calculate engagement score
    user.calculateEngagementScore();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      data: null,
      error: error.message
    });
  }
};

/**
 * Update user information
 */
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const updateData = req.body;
    const adminId = req.admin._id;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.customerId;
    delete updateData.analytics;
    delete updateData.activity;
    delete updateData.flags;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    // Store original data for audit
    const originalData = user.toObject();

    // Update user
    Object.assign(user, updateData);
    await user.save();

    // Log the update
    await AuditLog.create({
      adminId,
      action: 'UPDATE_USER',
      resource: 'user',
      resourceId: userId,
      changes: {
        before: originalData,
        after: updateData
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'test-agent'
      },
      severity: 'medium'
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      data: null,
      error: error.message
    });
  }
};

/**
 * Update user status (activate, suspend, ban)
 */
const updateUserStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.admin._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    const oldStatus = user.status;
    user.status = status;

    // Add flag if suspending or banning
    if (status === 'suspended' || status === 'banned') {
      await user.addFlag({
        type: status === 'suspended' ? 'manual_review' : 'policy_violation',
        reason: reason || `Account ${status} by admin`,
        severity: status === 'banned' ? 'high' : 'medium'
      }, adminId);
    }

    await user.save();

    // Log the status change
    await AuditLog.create({
      adminId,
      action: 'UPDATE_USER_STATUS',
      resource: 'user',
      resourceId: userId,
      changes: {
        oldStatus,
        newStatus: status,
        reason
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: status === 'banned' ? 'high' : 'medium'
    });

    res.status(200).json({
      success: true,
      message: `User ${status} successfully`,
      data: { user }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      data: null,
      error: error.message
    });
  }
};

/**
 * Add flag to user
 */
const addUserFlag = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const flagData = req.body;
    const adminId = req.admin._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    await user.addFlag(flagData, adminId);

    // Log the flag addition
    await AuditLog.create({
      adminId,
      action: 'ADD_USER_FLAG',
      resource: 'user',
      resourceId: userId,
      changes: { flagData },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: flagData.severity || 'medium'
    });

    res.status(200).json({
      success: true,
      message: 'Flag added successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Add user flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add flag',
      data: null,
      error: error.message
    });
  }
};

/**
 * Resolve user flag
 */
const resolveUserFlag = async (req, res) => {
  try {
    const { userId, flagId } = req.params;
    const { notes } = req.body;
    const adminId = req.admin._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    await user.resolveFlag(flagId, adminId, notes);

    // Log the flag resolution
    await AuditLog.create({
      adminId,
      action: 'RESOLVE_USER_FLAG',
      resource: 'user',
      resourceId: userId,
      changes: { flagId, notes },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'low'
    });

    res.status(200).json({
      success: true,
      message: 'Flag resolved successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Resolve user flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve flag',
      data: null,
      error: error.message
    });
  }
};

/**
 * Add note to user
 */
const addUserNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { content, isPrivate = false } = req.body;
    const adminId = req.admin._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    user.notes.push({
      content,
      createdBy: adminId,
      isPrivate
    });

    await user.save();

    // Log the note addition
    await AuditLog.create({
      adminId,
      action: 'ADD_USER_NOTE',
      resource: 'user',
      resourceId: userId,
      changes: { content, isPrivate },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'low'
    });

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Add user note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      data: null,
      error: error.message
    });
  }
};

/**
 * Get user activity history
 */
const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    // Get audit logs for this user
    const auditLogs = await AuditLog.find({ resourceId: userId })
      .populate('adminId', 'profile.firstName profile.lastName email')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalLogs = await AuditLog.countDocuments({ resourceId: userId });

    res.status(200).json({
      success: true,
      message: 'User activity retrieved successfully',
      data: {
        activity: user.activity,
        auditLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLogs / limit),
          totalLogs,
          hasNext: page < Math.ceil(totalLogs / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activity',
      data: null,
      error: error.message
    });
  }
};

/**
 * Get user analytics and insights
 */
const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    // Update segmentation and engagement score
    user.updateSegmentation();
    user.calculateEngagementScore();
    await user.save();

    // Get additional analytics data
    const analytics = {
      ...user.analytics.toObject(),
      accountAge: user.accountAge,
      engagementScore: user.analytics.engagementScore,
      riskFactors: [],
      recommendations: []
    };

    // Analyze risk factors
    if (user.flags.filter(f => !f.resolved).length > 0) {
      analytics.riskFactors.push('Has unresolved flags');
    }
    
    if (user.activity.failedLoginAttempts > 3) {
      analytics.riskFactors.push('Multiple failed login attempts');
    }
    
    if (user.analytics.churnRisk === 'high') {
      analytics.riskFactors.push('High churn risk');
    }

    // Generate recommendations
    if (user.analytics.segmentation === 'at_risk') {
      analytics.recommendations.push('Send re-engagement campaign');
    }
    
    if (user.analytics.engagementScore < 30) {
      analytics.recommendations.push('Improve user engagement');
    }
    
    if (!user.emailVerified) {
      analytics.recommendations.push('Encourage email verification');
    }

    res.status(200).json({
      success: true,
      message: 'User analytics retrieved successfully',
      data: { analytics }
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user analytics',
      data: null,
      error: error.message
    });
  }
};

/**
 * Search users with advanced filters
 */
const searchUsers = async (req, res) => {
  try {
    const { q, filters = '{}', page = 1, limit = 20 } = req.query;

    let searchFilters = {};
    try {
      searchFilters = JSON.parse(filters);
    } catch (e) {
      // If filters is not valid JSON, ignore it
    }

    // Add text search if provided
    if (q) {
      searchFilters.search = q;
    }

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const users = await User.advancedSearch(searchFilters, options);
    const totalQuery = User.advancedSearch(searchFilters, { ...options, page: 1, limit: 0 });
    const totalUsers = await User.countDocuments(totalQuery.getQuery());

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: {
        users,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(totalUsers / options.limit),
          totalUsers,
          hasNext: options.page < Math.ceil(totalUsers / options.limit),
          hasPrev: options.page > 1
        },
        query: q,
        filters: searchFilters
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      data: null,
      error: error.message
    });
  }
};

/**
 * Delete user (soft delete by setting status to inactive)
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    // Soft delete by setting status to inactive
    const oldStatus = user.status;
    user.status = 'inactive';
    
    // Add flag for deletion
    await user.addFlag({
      type: 'manual_review',
      reason: reason || 'Account deleted by admin',
      severity: 'high'
    }, adminId);

    await user.save();

    // Log the deletion
    await AuditLog.create({
      adminId,
      action: 'DELETE_USER',
      resource: 'user',
      resourceId: userId,
      changes: {
        oldStatus,
        newStatus: 'inactive',
        reason
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'high'
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      data: null,
      error: error.message
    });
  }
};

/**
 * Bulk update users
 */
const bulkUpdateUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { updates, options = {} } = req.body;
    const adminId = req.admin._id;
    const results = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0
    };

    // Process each update
    for (const update of updates) {
      try {
        const { userId, data } = update;
        
        const user = await User.findById(userId);
        if (!user) {
          results.failed.push({
            userId,
            error: 'User not found',
            data: update
          });
          continue;
        }

        // Store original data for audit
        const originalData = user.toObject();

        // Remove sensitive fields
        delete data.customerId;
        delete data.analytics;
        delete data.activity;
        delete data.flags;

        // Update user
        Object.assign(user, data);
        await user.save();

        results.successful.push({
          userId,
          user: user.toObject()
        });

        // Log individual update
        await AuditLog.create({
          adminId,
          action: 'BULK_UPDATE_USER',
          resource: 'user',
          resourceId: userId,
          changes: {
            before: originalData,
            after: data,
            bulkOperation: true
          },
          request: {
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('User-Agent') || 'bulk-operation'
          },
          severity: 'medium'
        });

      } catch (error) {
        results.failed.push({
          userId: update.userId,
          error: error.message,
          data: update
        });
      }
      
      results.totalProcessed++;
    }

    results.totalSuccessful = results.successful.length;
    results.totalFailed = results.failed.length;

    // Log bulk operation summary
    await AuditLog.create({
      adminId,
      action: 'BULK_UPDATE_USERS_SUMMARY',
      resource: 'user',
      resourceId: null,
      changes: {
        totalProcessed: results.totalProcessed,
        totalSuccessful: results.totalSuccessful,
        totalFailed: results.totalFailed,
        bulkOperation: true
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'bulk-operation'
      },
      severity: 'medium'
    });

    const statusCode = results.totalFailed > 0 ? 207 : 200; // 207 Multi-Status if some failed

    res.status(statusCode).json({
      success: results.totalFailed === 0,
      message: `Bulk update completed. ${results.totalSuccessful} successful, ${results.totalFailed} failed.`,
      data: results
    });

  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk update failed',
      data: null,
      error: error.message
    });
  }
};

/**
 * Bulk update user status (activate, suspend, ban)
 */
const bulkUpdateUserStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { userIds, status, reason } = req.body;
    const adminId = req.admin._id;
    const results = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0
    };

    // Process each user
    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          results.failed.push({
            userId,
            error: 'User not found'
          });
          continue;
        }

        const oldStatus = user.status;
        user.status = status;

        // Add flag if suspending or banning
        if (status === 'suspended' || status === 'banned') {
          await user.addFlag({
            type: status === 'suspended' ? 'manual_review' : 'policy_violation',
            reason: reason || `Account ${status} by admin (bulk operation)`,
            severity: status === 'banned' ? 'high' : 'medium'
          }, adminId);
        }

        await user.save();

        results.successful.push({
          userId,
          oldStatus,
          newStatus: status,
          user: user.toObject()
        });

        // Log individual status change
        await AuditLog.create({
          adminId,
          action: 'BULK_UPDATE_USER_STATUS',
          resource: 'user',
          resourceId: userId,
          changes: {
            oldStatus,
            newStatus: status,
            reason,
            bulkOperation: true
          },
          request: {
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('User-Agent') || 'bulk-operation'
          },
          severity: status === 'banned' ? 'high' : 'medium'
        });

      } catch (error) {
        results.failed.push({
          userId,
          error: error.message
        });
      }
      
      results.totalProcessed++;
    }

    results.totalSuccessful = results.successful.length;
    results.totalFailed = results.failed.length;

    // Log bulk operation summary
    await AuditLog.create({
      adminId,
      action: 'BULK_UPDATE_USER_STATUS_SUMMARY',
      resource: 'user',
      resourceId: null,
      changes: {
        status,
        reason,
        totalProcessed: results.totalProcessed,
        totalSuccessful: results.totalSuccessful,
        totalFailed: results.totalFailed,
        bulkOperation: true
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'bulk-operation'
      },
      severity: status === 'banned' ? 'high' : 'medium'
    });

    const statusCode = results.totalFailed > 0 ? 207 : 200;

    res.status(statusCode).json({
      success: results.totalFailed === 0,
      message: `Bulk status update completed. ${results.totalSuccessful} successful, ${results.totalFailed} failed.`,
      data: results
    });

  } catch (error) {
    console.error('Bulk update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk status update failed',
      data: null,
      error: error.message
    });
  }
};

/**
 * Bulk delete users (soft delete)
 */
const bulkDeleteUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { userIds, reason } = req.body;
    const adminId = req.admin._id;
    const results = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0
    };

    // Process each user
    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          results.failed.push({
            userId,
            error: 'User not found'
          });
          continue;
        }

        const oldStatus = user.status;
        user.status = 'inactive';

        // Add flag for deletion
        await user.addFlag({
          type: 'manual_review',
          reason: reason || 'Account deleted by admin (bulk operation)',
          severity: 'high'
        }, adminId);

        await user.save();

        results.successful.push({
          userId,
          oldStatus,
          user: user.toObject()
        });

        // Log individual deletion
        await AuditLog.create({
          adminId,
          action: 'BULK_DELETE_USER',
          resource: 'user',
          resourceId: userId,
          changes: {
            oldStatus,
            newStatus: 'inactive',
            reason,
            bulkOperation: true
          },
          request: {
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('User-Agent') || 'bulk-operation'
          },
          severity: 'high'
        });

      } catch (error) {
        results.failed.push({
          userId,
          error: error.message
        });
      }
      
      results.totalProcessed++;
    }

    results.totalSuccessful = results.successful.length;
    results.totalFailed = results.failed.length;

    // Log bulk operation summary
    await AuditLog.create({
      adminId,
      action: 'BULK_DELETE_USERS_SUMMARY',
      resource: 'user',
      resourceId: null,
      changes: {
        reason,
        totalProcessed: results.totalProcessed,
        totalSuccessful: results.totalSuccessful,
        totalFailed: results.totalFailed,
        bulkOperation: true
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'bulk-operation'
      },
      severity: 'high'
    });

    const statusCode = results.totalFailed > 0 ? 207 : 200;

    res.status(statusCode).json({
      success: results.totalFailed === 0,
      message: `Bulk delete completed. ${results.totalSuccessful} successful, ${results.totalFailed} failed.`,
      data: results
    });

  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk delete failed',
      data: null,
      error: error.message
    });
  }
};

/**
 * Export users to CSV
 */
const exportUsersCSV = async (req, res) => {
  try {
    const {
      filters = {},
      fields = [],
      filename = `users_export_${Date.now()}.csv`
    } = req.body;

    const adminId = req.admin._id;

    // Default fields to export if none specified
    const defaultFields = [
      'customerId',
      'firstName',
      'lastName',
      'email',
      'phone',
      'status',
      'registrationDate',
      'analytics.totalOrders',
      'analytics.totalSpent',
      'analytics.segmentation',
      'activity.lastLogin',
      'emailVerified',
      'phoneVerified'
    ];

    const exportFields = fields.length > 0 ? fields : defaultFields;

    // Build query using existing advanced search
    const searchFilters = {
      ...filters,
      // Remove pagination for export
      page: undefined,
      limit: undefined
    };

    // Get users based on filters
    const users = await User.advancedSearch(searchFilters, { 
      page: 1, 
      limit: 10000, // Max export limit
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found matching the criteria',
        data: null
      });
    }

    // Prepare CSV data
    const csvData = users.map(user => {
      const row = {};
      
      exportFields.forEach(field => {
        const value = getNestedValue(user, field);
        row[field] = formatCSVValue(value);
      });
      
      return row;
    });

    // Create CSV headers
    const csvHeaders = exportFields.map(field => ({
      id: field,
      title: formatFieldTitle(field)
    }));

    // Create temporary file path
    const tempDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, filename);

    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: filePath,
      header: csvHeaders
    });

    // Write CSV file
    await csvWriter.writeRecords(csvData);

    // Log export operation
    await AuditLog.create({
      adminId,
      action: 'EXPORT_USERS_CSV',
      resource: 'user',
      resourceId: null,
      changes: {
        exportedCount: users.length,
        filters: searchFilters,
        fields: exportFields,
        filename
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'export-operation'
      },
      severity: 'medium'
    });

    // Send file as download
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('File download error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to download file',
          data: null,
          error: err.message
        });
      }

      // Clean up temporary file after download
      setTimeout(() => {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Failed to delete temporary file:', unlinkErr);
          }
        });
      }, 5000); // Delete after 5 seconds
    });

  } catch (error) {
    console.error('Export users CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export users',
      data: null,
      error: error.message
    });
  }
};

/**
 * Import users from CSV
 */
const importUsersCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file provided',
        data: null
      });
    }

    const adminId = req.admin._id;
    const { updateExisting = false, dryRun = false } = req.body;
    
    const results = {
      successful: [],
      failed: [],
      skipped: [],
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      totalSkipped: 0
    };

    // Parse CSV file
    const csvData = [];
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
    await new Promise((resolve, reject) => {
      const stream = Readable.from([fileContent]);
      
      stream
        .pipe(csv())
        .on('data', (row) => {
          csvData.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (csvData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty or invalid',
        data: null
      });
    }

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 2; // +2 because CSV starts at row 1 and we skip header
      
      try {
        // Validate required fields
        if (!row.email || !row.firstName || !row.lastName) {
          results.failed.push({
            row: rowNumber,
            data: row,
            error: 'Missing required fields (email, firstName, lastName)'
          });
          results.totalProcessed++;
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
          email: row.email.toLowerCase().trim() 
        });

        if (existingUser && !updateExisting) {
          results.skipped.push({
            row: rowNumber,
            data: row,
            reason: 'User already exists',
            existingUserId: existingUser._id
          });
          results.totalProcessed++;
          continue;
        }

        // If dry run, don't actually create/update
        if (dryRun) {
          results.successful.push({
            row: rowNumber,
            data: row,
            action: existingUser ? 'would_update' : 'would_create'
          });
          results.totalProcessed++;
          continue;
        }

        let user;
        let action;

        if (existingUser && updateExisting) {
          // Update existing user
          const updateData = buildUserDataFromCSV(row);
          Object.assign(existingUser, updateData);
          user = await existingUser.save();
          action = 'updated';
        } else {
          // Create new user
          const userData = buildUserDataFromCSV(row);
          userData.customerId = `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          user = new User(userData);
          await user.save();
          action = 'created';
        }

        results.successful.push({
          row: rowNumber,
          data: row,
          action,
          userId: user._id
        });

        // Log individual import
        await AuditLog.create({
          adminId,
          action: 'IMPORT_USER_CSV',
          resource: 'user',
          resourceId: user._id,
          changes: {
            importedData: row,
            action,
            rowNumber,
            bulkOperation: true
          },
          request: {
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('User-Agent') || 'import-operation'
          },
          severity: 'medium'
        });

      } catch (error) {
        results.failed.push({
          row: rowNumber,
          data: row,
          error: error.message
        });
      }
      
      results.totalProcessed++;
    }

    results.totalSuccessful = results.successful.length;
    results.totalFailed = results.failed.length;
    results.totalSkipped = results.skipped.length;

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to delete uploaded file:', err);
    });

    // Log import summary
    await AuditLog.create({
      adminId,
      action: 'IMPORT_USERS_CSV_SUMMARY',
      resource: 'user',
      resourceId: null,
      changes: {
        totalProcessed: results.totalProcessed,
        totalSuccessful: results.totalSuccessful,
        totalFailed: results.totalFailed,
        totalSkipped: results.totalSkipped,
        dryRun,
        updateExisting
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'import-operation'
      },
      severity: 'medium'
    });

    const statusCode = results.totalFailed > 0 ? 207 : 200;

    res.status(statusCode).json({
      success: results.totalFailed === 0,
      message: `Import completed. ${results.totalSuccessful} successful, ${results.totalFailed} failed, ${results.totalSkipped} skipped.`,
      data: results
    });

  } catch (error) {
    console.error('Import users CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import users',
      data: null,
      error: error.message
    });
  }
};

/**
 * Get CSV template for user import
 */
const getCSVTemplate = async (req, res) => {
  try {
    const templateData = [{
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      tags: 'premium,vip',
      source: 'csv_import'
    }];

    const csvHeaders = [
      { id: 'firstName', title: 'First Name' },
      { id: 'lastName', title: 'Last Name' },
      { id: 'email', title: 'Email' },
      { id: 'phone', title: 'Phone' },
      { id: 'dateOfBirth', title: 'Date of Birth' },
      { id: 'gender', title: 'Gender' },
      { id: 'address', title: 'Address' },
      { id: 'city', title: 'City' },
      { id: 'state', title: 'State' },
      { id: 'zipCode', title: 'Zip Code' },
      { id: 'country', title: 'Country' },
      { id: 'tags', title: 'Tags' },
      { id: 'source', title: 'Source' }
    ];

    const tempDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filename = 'user_import_template.csv';
    const filePath = path.join(tempDir, filename);

    const csvWriter = createCsvWriter({
      path: filePath,
      header: csvHeaders
    });

    await csvWriter.writeRecords(templateData);

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Template download error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to download template',
          error: err.message
        });
      }
      
      // Clean up file after download
      setTimeout(() => {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Failed to delete template file:', unlinkErr);
        });
      }, 5000);
    });

  } catch (error) {
    console.error('Get CSV template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
      error: error.message
    });
  }
};

// Helper functions
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

function formatCSVValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (Array.isArray(value)) return value.join(', ');
    return JSON.stringify(value);
  }
  return String(value);
}

function formatFieldTitle(field) {
  return field
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildUserDataFromCSV(row) {
  return {
    firstName: row.firstName?.trim(),
    lastName: row.lastName?.trim(),
    email: row.email?.toLowerCase().trim(),
    phone: row.phone?.trim(),
    dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
    gender: row.gender?.toLowerCase(),
    address: row.address?.trim(),
    city: row.city?.trim(),
    state: row.state?.trim(),
    zipCode: row.zipCode?.trim(),
    country: row.country?.trim(),
    tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
    source: row.source || 'csv_import'
  };
}

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  addUserFlag,
  resolveUserFlag,
  addUserNote,
  getUserActivity,
  getUserAnalytics,
  searchUsers,
  deleteUser,
  bulkUpdateUsers,
  bulkUpdateUserStatus,
  bulkDeleteUsers,
  exportUsersCSV,
  importUsersCSV,
  getCSVTemplate
};