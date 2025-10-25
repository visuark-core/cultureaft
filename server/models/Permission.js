const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  resource: {
    type: String,
    required: true,
    enum: ['users', 'products', 'orders', 'payments', 'analytics', 'content', 'system', 'admins']
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'approve', 'suspend', 'export', 'import']
  },
  description: {
    type: String,
    required: true
  },
  conditions: [{
    field: {
      type: String,
      required: true
    },
    operator: {
      type: String,
      required: true,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in']
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
PermissionSchema.index({ name: 1 }, { unique: true });
PermissionSchema.index({ resource: 1, action: 1 });
PermissionSchema.index({ isActive: 1 });
PermissionSchema.index({ createdAt: -1 });

// Compound index for efficient permission lookups
PermissionSchema.index({ resource: 1, action: 1, isActive: 1 });

// Virtual for full permission identifier
PermissionSchema.virtual('identifier').get(function() {
  return `${this.resource}:${this.action}`;
});

// Static method to get default permissions
PermissionSchema.statics.getDefaultPermissions = function() {
  return [
    // User permissions
    { name: 'users:create', resource: 'users', action: 'create', description: 'Create new users' },
    { name: 'users:read', resource: 'users', action: 'read', description: 'View user information' },
    { name: 'users:update', resource: 'users', action: 'update', description: 'Update user information' },
    { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
    { name: 'users:suspend', resource: 'users', action: 'suspend', description: 'Suspend/unsuspend users' },
    { name: 'users:export', resource: 'users', action: 'export', description: 'Export user data' },
    { name: 'users:import', resource: 'users', action: 'import', description: 'Import user data' },

    // Product permissions
    { name: 'products:create', resource: 'products', action: 'create', description: 'Create new products' },
    { name: 'products:read', resource: 'products', action: 'read', description: 'View product information' },
    { name: 'products:update', resource: 'products', action: 'update', description: 'Update product information' },
    { name: 'products:delete', resource: 'products', action: 'delete', description: 'Delete products' },
    { name: 'products:approve', resource: 'products', action: 'approve', description: 'Approve/reject products' },
    { name: 'products:export', resource: 'products', action: 'export', description: 'Export product data' },
    { name: 'products:import', resource: 'products', action: 'import', description: 'Import product data' },

    // Order permissions
    { name: 'orders:create', resource: 'orders', action: 'create', description: 'Create new orders' },
    { name: 'orders:read', resource: 'orders', action: 'read', description: 'View order information' },
    { name: 'orders:update', resource: 'orders', action: 'update', description: 'Update order information' },
    { name: 'orders:delete', resource: 'orders', action: 'delete', description: 'Delete orders' },
    { name: 'orders:approve', resource: 'orders', action: 'approve', description: 'Approve/process orders' },
    { name: 'orders:export', resource: 'orders', action: 'export', description: 'Export order data' },

    // Payment permissions
    { name: 'payments:read', resource: 'payments', action: 'read', description: 'View payment information' },
    { name: 'payments:update', resource: 'payments', action: 'update', description: 'Update payment status' },
    { name: 'payments:approve', resource: 'payments', action: 'approve', description: 'Approve refunds and adjustments' },
    { name: 'payments:export', resource: 'payments', action: 'export', description: 'Export payment data' },

    // Analytics permissions
    { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'View analytics and reports' },
    { name: 'analytics:export', resource: 'analytics', action: 'export', description: 'Export analytics data' },

    // Content permissions
    { name: 'content:create', resource: 'content', action: 'create', description: 'Create content' },
    { name: 'content:read', resource: 'content', action: 'read', description: 'View content' },
    { name: 'content:update', resource: 'content', action: 'update', description: 'Update content' },
    { name: 'content:delete', resource: 'content', action: 'delete', description: 'Delete content' },
    { name: 'content:approve', resource: 'content', action: 'approve', description: 'Approve/moderate content' },

    // System permissions
    { name: 'system:create', resource: 'system', action: 'create', description: 'Create system configurations' },
    { name: 'system:read', resource: 'system', action: 'read', description: 'View system information' },
    { name: 'system:update', resource: 'system', action: 'update', description: 'Update system settings' },
    { name: 'system:delete', resource: 'system', action: 'delete', description: 'Delete system configurations' },

    // Admin permissions
    { name: 'admins:create', resource: 'admins', action: 'create', description: 'Create admin accounts' },
    { name: 'admins:read', resource: 'admins', action: 'read', description: 'View admin information' },
    { name: 'admins:update', resource: 'admins', action: 'update', description: 'Update admin accounts' },
    { name: 'admins:delete', resource: 'admins', action: 'delete', description: 'Delete admin accounts' },
    { name: 'admins:suspend', resource: 'admins', action: 'suspend', description: 'Suspend/unsuspend admin accounts' }
  ];
};

// Method to check if permission matches criteria
PermissionSchema.methods.matches = function(resource, action) {
  return this.resource === resource && this.action === action && this.isActive;
};

// Method to evaluate conditions
PermissionSchema.methods.evaluateConditions = function(context = {}) {
  if (!this.conditions || this.conditions.length === 0) {
    return true;
  }

  return this.conditions.every(condition => {
    const fieldValue = context[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  });
};

module.exports = mongoose.model('Permission', PermissionSchema);