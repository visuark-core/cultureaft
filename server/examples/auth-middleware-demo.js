/**
 * Enhanced Auth Middleware Demonstration
 * 
 * This script demonstrates the key features of the enhanced role-based access control middleware:
 * 1. Hierarchical permission inheritance
 * 2. Conditional permission checking
 * 3. Resource-specific access control
 * 4. Comprehensive audit logging
 * 5. Security event monitoring
 */

const express = require('express');
const {
  authenticateToken,
  requireRole,
  requirePermission,
  auditLogger,
  enforceHierarchy,
  bulkOperationProtection,
  timeBasedAccess,
  checkResourceOwnership
} = require('../middleware/auth');

const app = express();
app.use(express.json());

// Example 1: Basic Role-based Access Control
app.get('/admin/dashboard', 
  authenticateToken,
  requireRole(2), // Admin level or higher
  auditLogger('dashboard_access', 'system'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome to admin dashboard',
      admin: {
        name: req.admin.profile.fullName,
        role: req.adminRole.name,
        level: req.adminRole.level
      }
    });
  }
);

// Example 2: Permission-based Access Control with Hierarchical Inheritance
app.post('/api/users',
  authenticateToken,
  requirePermission('users', 'create'),
  auditLogger('user_create', 'users'),
  (req, res) => {
    res.json({
      success: true,
      message: 'User created successfully',
      data: { id: 'user123', ...req.body }
    });
  }
);

// Example 3: Hierarchy Enforcement
app.put('/api/admin/:id',
  authenticateToken,
  requirePermission('admin', 'update'),
  enforceHierarchy('body.roleLevel'),
  auditLogger('admin_update', 'admin'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: { id: req.params.id, ...req.body }
    });
  }
);

// Example 4: Bulk Operation Protection
app.post('/api/users/bulk-update',
  authenticateToken,
  requirePermission('users', 'update'),
  bulkOperationProtection(100), // Max 100 items
  auditLogger('user_bulk_update', 'users', { bulkOperation: true }),
  (req, res) => {
    const itemCount = req.body.items?.length || 0;
    res.json({
      success: true,
      message: `Bulk update completed for ${itemCount} users`,
      data: { processedCount: itemCount }
    });
  }
);

// Example 5: Time-based Access Control
app.get('/api/sensitive-reports',
  authenticateToken,
  requirePermission('reports', 'read'),
  timeBasedAccess({
    startHour: 9,
    endHour: 17,
    allowedDays: [1, 2, 3, 4, 5] // Monday to Friday
  }),
  auditLogger('sensitive_report_access', 'reports'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Sensitive report accessed during business hours',
      data: { reportType: 'financial', accessTime: new Date() }
    });
  }
);

// Example 6: Resource Ownership Check
app.delete('/api/content/:id',
  authenticateToken,
  requirePermission('content', 'delete'),
  checkResourceOwnership('createdBy'),
  auditLogger('content_delete', 'content'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Content deleted successfully',
      data: { id: req.params.id }
    });
  }
);

// Example 7: Conditional Permissions
app.get('/api/users/department/:dept',
  authenticateToken,
  requirePermission('users', 'read', {
    conditions: {
      department: req => req.params.dept
    }
  }),
  auditLogger('user_department_access', 'users'),
  (req, res) => {
    res.json({
      success: true,
      message: `Users from ${req.params.dept} department`,
      data: { department: req.params.dept, users: [] }
    });
  }
);

// Example 8: Advanced Audit Logging with Context
app.post('/api/products/:id/price-update',
  authenticateToken,
  requirePermission('products', 'update'),
  auditLogger('product_price_update', 'products', {
    captureOldValues: true,
    logAccess: true
  }),
  async (req, res) => {
    // Simulate capturing old values for audit
    req.originalData = { oldPrice: 99.99, oldCurrency: 'USD' };
    
    res.json({
      success: true,
      message: 'Product price updated',
      data: {
        id: req.params.id,
        oldPrice: 99.99,
        newPrice: req.body.price,
        updatedBy: req.admin.profile.fullName
      }
    });
  }
);

// Security Monitoring Endpoint
app.get('/api/security/events',
  authenticateToken,
  requireRole(1), // Super Admin only
  async (req, res) => {
    try {
      const AuditLog = require('../models/AuditLog');
      
      const securityEvents = await AuditLog.getSecurityEvents(7);
      const securityReport = await AuditLog.generateSecurityReport(7);
      
      res.json({
        success: true,
        data: {
          recentEvents: securityEvents,
          weeklyReport: securityReport
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch security events',
        error: error.message
      });
    }
  }
);

// Permission Violation Monitoring
app.get('/api/security/violations',
  authenticateToken,
  requireRole(1), // Super Admin only
  async (req, res) => {
    try {
      const AuditLog = require('../models/AuditLog');
      
      const violations = await AuditLog.getPermissionViolations(30);
      
      res.json({
        success: true,
        data: {
          violations,
          summary: {
            totalViolations: violations.length,
            period: '30 days'
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permission violations',
        error: error.message
      });
    }
  }
);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Middleware error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

console.log(`
Enhanced Auth Middleware Demo Routes:

1. Basic Role Access:
   GET /admin/dashboard (Admin+ required)

2. Permission-based Access:
   POST /api/users (users:create permission)

3. Hierarchy Enforcement:
   PUT /api/admin/:id (prevents managing equal/higher level admins)

4. Bulk Operation Protection:
   POST /api/users/bulk-update (max 100 items)

5. Time-based Access:
   GET /api/sensitive-reports (business hours only)

6. Resource Ownership:
   DELETE /api/content/:id (owner or super admin only)

7. Conditional Permissions:
   GET /api/users/department/:dept (department-specific access)

8. Advanced Audit Logging:
   POST /api/products/:id/price-update (captures old/new values)

9. Security Monitoring:
   GET /api/security/events (Super Admin only)
   GET /api/security/violations (Super Admin only)

Key Features Demonstrated:
✓ Hierarchical role inheritance
✓ Granular permission checking
✓ Conditional access control
✓ Resource ownership validation
✓ Time-based restrictions
✓ Bulk operation limits
✓ Comprehensive audit logging
✓ Security event monitoring
✓ Permission violation tracking
`);

module.exports = app;