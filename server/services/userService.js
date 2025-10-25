const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');

class UserService {
  
  // Get users with advanced filtering and pagination
  async getUsers(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search = ''
      } = options;

      // Build query object
      const query = {};

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (Array.isArray(filters.status)) {
          query.status = { $in: filters.status };
        } else {
          query.status = filters.status;
        }
      }

      // Date range filters
      if (filters.registrationDateFrom || filters.registrationDateTo) {
        query.registrationDate = {};
        if (filters.registrationDateFrom) {
          query.registrationDate.$gte = new Date(filters.registrationDateFrom);
        }
        if (filters.registrationDateTo) {
          query.registrationDate.$lte = new Date(filters.registrationDateTo);
        }
      }

      // Order count filters
      if (filters.minOrders !== undefined) {
        query.totalOrders = { ...query.totalOrders, $gte: parseInt(filters.minOrders) };
      }
      if (filters.maxOrders !== undefined) {
        query.totalOrders = { ...query.totalOrders, $lte: parseInt(filters.maxOrders) };
      }

      // Spending filters
      if (filters.minSpent !== undefined) {
        query.totalSpent = { ...query.totalSpent, $gte: parseFloat(filters.minSpent) };
      }
      if (filters.maxSpent !== undefined) {
        query.totalSpent = { ...query.totalSpent, $lte: parseFloat(filters.maxSpent) };
      }

      // Location filters
      if (filters.city) {
        query['addresses.city'] = new RegExp(filters.city, 'i');
      }
      if (filters.state) {
        query['addresses.state'] = new RegExp(filters.state, 'i');
      }

      // Search functionality
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { customerId: searchRegex }
        ];
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      
      const [users, totalCount] = await Promise.all([
        Customer.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Customer.countDocuments(query)
      ]);

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to retrieve users: ${error.message}`);
    }
  }

  // Get single user by ID
  async getUserById(userId) {
    try {
      const user = await Customer.findById(userId).lean();
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  // Create new user
  async createUser(userData, adminId) {
    try {
      // Generate unique customer ID
      const customerId = await this.generateCustomerId();
      
      const user = new Customer({
        ...userData,
        customerId,
        registrationDate: new Date()
      });

      await user.save();

      // Log user creation
      await AuditLog.logAction(
        adminId,
        'create',
        'users',
        {
          resourceId: user._id.toString(),
          changes: userData,
          ipAddress: 'admin-panel',
          userAgent: 'admin-panel',
          severity: 'medium',
          description: `User created: ${user.email}`
        }
      );

      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Update user
  async updateUser(userId, updateData, adminId) {
    try {
      const existingUser = await Customer.findById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Store previous values for audit
      const previousValues = {
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        phone: existingUser.phone,
        status: existingUser.status
      };

      // Update user
      const updatedUser = await Customer.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      // Log user update
      await AuditLog.logAction(
        adminId,
        'update',
        'users',
        {
          resourceId: userId,
          changes: updateData,
          previousValues,
          ipAddress: 'admin-panel',
          userAgent: 'admin-panel',
          severity: 'medium',
          description: `User updated: ${updatedUser.email}`
        }
      );

      return updatedUser;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user (soft delete by setting status to inactive)
  async deleteUser(userId, adminId, hardDelete = false) {
    try {
      const user = await Customer.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let result;
      if (hardDelete) {
        result = await Customer.findByIdAndDelete(userId);
        await AuditLog.logAction(
          adminId,
          'delete',
          'users',
          {
            resourceId: userId,
            previousValues: user.toObject(),
            ipAddress: 'admin-panel',
            userAgent: 'admin-panel',
            severity: 'high',
            description: `User permanently deleted: ${user.email}`
          }
        );
      } else {
        result = await Customer.findByIdAndUpdate(
          userId,
          { status: 'inactive' },
          { new: true }
        );
        await AuditLog.logAction(
          adminId,
          'suspend',
          'users',
          {
            resourceId: userId,
            changes: { status: 'inactive' },
            previousValues: { status: user.status },
            ipAddress: 'admin-panel',
            userAgent: 'admin-panel',
            severity: 'medium',
            description: `User deactivated: ${user.email}`
          }
        );
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Suspend user
  async suspendUser(userId, adminId, reason = '') {
    try {
      const user = await Customer.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser = await Customer.findByIdAndUpdate(
        userId,
        { status: 'blocked' },
        { new: true }
      );

      await AuditLog.logAction(
        adminId,
        'suspend',
        'users',
        {
          resourceId: userId,
          changes: { status: 'blocked' },
          previousValues: { status: user.status },
          ipAddress: 'admin-panel',
          userAgent: 'admin-panel',
          severity: 'high',
          description: `User suspended: ${user.email}${reason ? ` - Reason: ${reason}` : ''}`,
          metadata: { reason }
        }
      );

      return updatedUser;
    } catch (error) {
      throw new Error(`Failed to suspend user: ${error.message}`);
    }
  }

  // Activate user
  async activateUser(userId, adminId) {
    try {
      const user = await Customer.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser = await Customer.findByIdAndUpdate(
        userId,
        { status: 'active' },
        { new: true }
      );

      await AuditLog.logAction(
        adminId,
        'activate',
        'users',
        {
          resourceId: userId,
          changes: { status: 'active' },
          previousValues: { status: user.status },
          ipAddress: 'admin-panel',
          userAgent: 'admin-panel',
          severity: 'medium',
          description: `User activated: ${user.email}`
        }
      );

      return updatedUser;
    } catch (error) {
      throw new Error(`Failed to activate user: ${error.message}`);
    }
  }

  // Get user statistics
  async getUserStatistics() {
    try {
      const pipeline = [
        {
          $facet: {
            statusStats: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            registrationStats: [
              {
                $group: {
                  _id: {
                    year: { $year: '$registrationDate' },
                    month: { $month: '$registrationDate' }
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { '_id.year': -1, '_id.month': -1 } },
              { $limit: 12 }
            ],
            spendingStats: [
              {
                $group: {
                  _id: null,
                  totalRevenue: { $sum: '$totalSpent' },
                  averageSpent: { $avg: '$totalSpent' },
                  totalOrders: { $sum: '$totalOrders' }
                }
              }
            ],
            topSpenders: [
              { $sort: { totalSpent: -1 } },
              { $limit: 10 },
              {
                $project: {
                  fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                  email: 1,
                  totalSpent: 1,
                  totalOrders: 1
                }
              }
            ]
          }
        }
      ];

      const [statistics] = await Customer.aggregate(pipeline);
      
      return statistics;
    } catch (error) {
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }
  }

  // Search users with advanced criteria
  async searchUsers(searchCriteria) {
    try {
      const {
        query = '',
        filters = {},
        limit = 20
      } = searchCriteria;

      const searchQuery = {};

      // Text search
      if (query) {
        const searchRegex = new RegExp(query, 'i');
        searchQuery.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { customerId: searchRegex }
        ];
      }

      // Apply additional filters
      if (filters.status) {
        searchQuery.status = filters.status;
      }

      const users = await Customer.find(searchQuery)
        .select('customerId firstName lastName email phone status totalOrders totalSpent')
        .limit(limit)
        .lean();

      return users;
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  // Generate unique customer ID
  async generateCustomerId() {
    const prefix = 'CUST';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    let customerId = `${prefix}${timestamp}${random}`;
    
    // Ensure uniqueness
    const existing = await Customer.findOne({ customerId });
    if (existing) {
      return this.generateCustomerId(); // Recursive call if collision
    }
    
    return customerId;
  }

  // Get user activity summary
  async getUserActivity(userId, days = 30) {
    try {
      const user = await Customer.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get orders for this user (assuming Order model exists)
      // This would need to be implemented based on your Order model
      const activity = {
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email,
          status: user.status,
          registrationDate: user.registrationDate,
          totalOrders: user.totalOrders,
          totalSpent: user.totalSpent,
          lastOrderDate: user.lastOrderDate
        },
        // Additional activity data would go here
        // orders: [], // Recent orders
        // loginHistory: [], // Login history if tracked
      };

      return activity;
    } catch (error) {
      throw new Error(`Failed to get user activity: ${error.message}`);
    }
  }

  // Bulk operations
  async bulkUpdateUsers(userIds, updateData, adminId) {
    try {
      const result = await Customer.updateMany(
        { _id: { $in: userIds } },
        { $set: updateData }
      );

      // Log bulk operation
      await AuditLog.logAction(
        adminId,
        'bulk_operation',
        'users',
        {
          ipAddress: 'admin-panel',
          userAgent: 'admin-panel',
          severity: 'high',
          description: `Bulk update performed on ${result.modifiedCount} users`,
          metadata: {
            userIds,
            updateData,
            modifiedCount: result.modifiedCount
          }
        }
      );

      return result;
    } catch (error) {
      throw new Error(`Failed to perform bulk update: ${error.message}`);
    }
  }

  // Export users to CSV
  async exportUsers(filters = {}) {
    try {
      const { users } = await this.getUsers(filters, { limit: 10000 });
      
      const csvHeaders = [
        'Customer ID',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Status',
        'Registration Date',
        'Total Orders',
        'Total Spent',
        'Last Order Date'
      ];

      const csvRows = [csvHeaders.join(',')];

      users.forEach(user => {
        const row = [
          user.customerId,
          user.firstName,
          user.lastName,
          user.email,
          user.phone || '',
          user.status,
          user.registrationDate.toISOString().split('T')[0],
          user.totalOrders,
          user.totalSpent,
          user.lastOrderDate ? user.lastOrderDate.toISOString().split('T')[0] : ''
        ];
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    } catch (error) {
      throw new Error(`Failed to export users: ${error.message}`);
    }
  }
}

module.exports = new UserService();