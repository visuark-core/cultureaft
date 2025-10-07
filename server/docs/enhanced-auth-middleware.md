# Enhanced Role-Based Access Control Middleware

## Overview

The enhanced authentication middleware provides comprehensive role-based access control with hierarchical permission inheritance, conditional access, resource ownership validation, and detailed audit logging for the admin user management system.

## Key Features

### 1. Hierarchical Role System
- **Super Admin (Level 1)**: Full system access
- **Admin (Level 2)**: Administrative access with some restrictions
- **Moderator (Level 3)**: Limited management access
- **Support (Level 4)**: Basic support operations

### 2. Permission Inheritance
- Higher-level roles automatically inherit permissions from lower levels
- Configurable restrictions for sensitive operations
- Dynamic permission evaluation based on role hierarchy

### 3. Comprehensive Audit Logging
- All admin actions are logged with detailed context
- Security events are tracked and categorized by severity
- Automated suspicious activity detection
- Comprehensive reporting and analytics

### 4. Advanced Security Features
- IP-based access control
- Time-based access restrictions
- Bulk operation protection
- Resource ownership validation
- Session validation and management

## Middleware Functions

### Core Authentication

#### `authenticateToken(req, res, next)`
Validates JWT tokens and attaches admin user information to the request.

```javascript
app.use('/api/admin', authenticateToken);
```

#### `validateSession(req, res, next)`
Ensures admin session is still valid and updates user information.

```javascript
app.use('/api/admin', authenticateToken, validateSession);
```

### Role-Based Access Control

#### `requireRole(minLevel)`
Restricts access based on minimum role level required.

```javascript
// Super Admin only (level 1)
app.get('/api/system/config', authenticateToken, requireRole(1), handler);

// Admin or higher (level 2+)
app.get('/api/admin/dashboard', authenticateToken, requireRole(2), handler);
```

#### `requireSuperAdmin`, `requireAdmin`, `requireModerator`
Convenience functions for common role requirements.

```javascript
app.delete('/api/system/reset', authenticateToken, requireSuperAdmin, handler);
```

### Permission-Based Access Control

#### `requirePermission(resource, action, options)`
Checks specific permissions with optional conditions and resource validation.

```javascript
// Basic permission check
app.post('/api/users', 
  authenticateToken, 
  requirePermission('users', 'create'), 
  handler
);

// With resource-specific validation
app.put('/api/users/:id', 
  authenticateToken, 
  requirePermission('users', 'update', { resourceId: 'params.id' }), 
  handler
);

// With conditional permissions
app.get('/api/users/department/:dept', 
  authenticateToken, 
  requirePermission('users', 'read', {
    conditions: { department: 'params.dept' }
  }), 
  handler
);
```

### Security Enforcement

#### `enforceHierarchy(targetRoleField)`
Prevents admins from managing users of equal or higher hierarchy levels.

```javascript
app.put('/api/admin/:id', 
  authenticateToken, 
  enforceHierarchy('body.roleLevel'), 
  handler
);
```

#### `checkResourceOwnership(ownerField)`
Ensures admins can only access resources they own (unless super admin).

```javascript
app.delete('/api/content/:id', 
  authenticateToken, 
  checkResourceOwnership('createdBy'), 
  handler
);
```

#### `bulkOperationProtection(maxItems)`
Limits bulk operations and requires higher permissions for large operations.

```javascript
app.post('/api/users/bulk-update', 
  authenticateToken, 
  bulkOperationProtection(100), 
  handler
);
```

#### `timeBasedAccess(timeWindow)`
Restricts access to specific time windows.

```javascript
app.get('/api/sensitive-reports', 
  authenticateToken, 
  timeBasedAccess({
    startHour: 9,
    endHour: 17,
    allowedDays: [1, 2, 3, 4, 5] // Monday to Friday
  }), 
  handler
);
```

#### `ipWhitelist(allowedIPs)`
Restricts access to specific IP addresses.

```javascript
app.post('/api/system/maintenance', 
  authenticateToken, 
  ipWhitelist(['192.168.1.100', '10.0.0.50']), 
  handler
);
```

### Audit Logging

#### `auditLogger(action, resource, options)`
Logs admin actions with comprehensive details.

```javascript
app.post('/api/products', 
  authenticateToken, 
  auditLogger('product_create', 'products', {
    captureOldValues: true,
    logAccess: true
  }), 
  handler
);
```

**Options:**
- `captureOldValues`: Store original data for comparison
- `logAccess`: Log successful access attempts
- `bulkOperation`: Mark as bulk operation

### Rate Limiting

#### `authRateLimit`
Standard rate limiting for authentication routes.

#### `strictAuthRateLimit`
Strict rate limiting for failed authentication attempts.

```javascript
app.post('/api/auth/login', authRateLimit, loginHandler);
app.post('/api/auth/reset-password', strictAuthRateLimit, resetHandler);
```

## Permission System

### Resource Types
- `users`: User management operations
- `products`: Product and inventory management
- `orders`: Order processing and management
- `payments`: Payment and financial operations
- `analytics`: Analytics and reporting
- `content`: Content and communication management
- `system`: System configuration and settings
- `admin`: Admin user management
- `reports`: Report generation and access

### Action Types
- `create`: Create new resources
- `read`: View and access resources
- `update`: Modify existing resources
- `delete`: Remove resources
- `approve`: Approve pending items
- `moderate`: Content moderation actions
- `export`: Export data
- `import`: Import data

### Hierarchical Permission Inheritance

#### Super Admin (Level 1)
- **Full Access**: All resources and actions
- **No Restrictions**: Bypasses all security checks
- **System Control**: Can modify system settings and create other admins

#### Admin (Level 2)
- **Inherited Permissions**: Most operations on users, products, orders, content
- **Restrictions**: Cannot delete system resources or manage equal/higher level admins
- **Bulk Operations**: Can perform large bulk operations

#### Moderator (Level 3)
- **Limited Access**: Read access to users, limited product management
- **Content Focus**: Full content moderation capabilities
- **Restrictions**: Cannot perform bulk operations over 100 items

#### Support (Level 4)
- **Minimal Access**: Read-only user access, order updates
- **Customer Focus**: Designed for customer support operations
- **Heavy Restrictions**: Very limited bulk operation capabilities

## Audit Logging System

### Log Categories

#### Security Events
- `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGIN_BLOCKED`
- `PERMISSION_DENIED`, `HIERARCHY_VIOLATION`
- `UNAUTHORIZED_ACCESS`, `SUSPICIOUS_ACTIVITY`

#### Administrative Actions
- `user_create`, `user_update`, `user_delete`
- `admin_create`, `admin_update`, `role_update`
- `system_config_update`

#### Business Operations
- `product_create`, `order_update`, `payment_refund`
- `content_moderate`, `bulk_operation`

### Severity Levels
- **Critical**: System-level changes, security breaches
- **High**: Admin management, sensitive operations
- **Medium**: Permission violations, failed operations
- **Low**: Routine operations, successful access

### Audit Log Features

#### Automatic Logging
```javascript
// All admin actions are automatically logged
app.use('/api/admin', authenticateToken, auditLogger('admin_action', 'admin'));
```

#### Security Monitoring
```javascript
// Get recent security events
const securityEvents = await AuditLog.getSecurityEvents(7);

// Generate security report
const report = await AuditLog.generateSecurityReport(30);
```

#### Suspicious Activity Detection
```javascript
// Detect patterns indicating suspicious activity
const suspicious = await AuditLog.detectSuspiciousActivity(adminId, 60);
```

## Configuration Examples

### Basic Setup
```javascript
const express = require('express');
const { 
  authenticateToken, 
  requirePermission, 
  auditLogger 
} = require('./middleware/auth');

const app = express();

// Protect all admin routes
app.use('/api/admin', authenticateToken);

// User management with audit logging
app.post('/api/admin/users', 
  requirePermission('users', 'create'),
  auditLogger('user_create', 'users'),
  createUserHandler
);
```

### Advanced Security Setup
```javascript
// High-security admin route
app.delete('/api/admin/system/reset',
  authenticateToken,
  validateSession,
  requireSuperAdmin,
  ipWhitelist(['192.168.1.100']),
  timeBasedAccess({ startHour: 9, endHour: 17 }),
  auditLogger('system_reset', 'system', { logAccess: true }),
  systemResetHandler
);
```

### Bulk Operation Protection
```javascript
// Protected bulk operation
app.post('/api/admin/users/bulk-update',
  authenticateToken,
  requirePermission('users', 'update'),
  bulkOperationProtection(500),
  auditLogger('user_bulk_update', 'users', { bulkOperation: true }),
  bulkUpdateHandler
);
```

## Security Best Practices

### 1. Layered Security
Always combine multiple middleware functions for sensitive operations:
```javascript
app.delete('/api/admin/users/:id',
  authenticateToken,           // Verify identity
  validateSession,             // Ensure session validity
  requirePermission('users', 'delete'), // Check permissions
  enforceHierarchy('params.id'), // Prevent hierarchy violations
  auditLogger('user_delete', 'users'), // Log the action
  deleteUserHandler
);
```

### 2. Principle of Least Privilege
Grant minimum necessary permissions:
```javascript
// Support staff - minimal permissions
const supportRole = {
  level: 4,
  permissions: [
    { resource: 'users', actions: ['read'] },
    { resource: 'orders', actions: ['read', 'update'] }
  ]
};
```

### 3. Regular Security Monitoring
Implement automated security monitoring:
```javascript
// Daily security report
cron.schedule('0 9 * * *', async () => {
  const report = await AuditLog.generateSecurityReport(1);
  if (report.summary.securityEvents > 10) {
    await notifySecurityTeam(report);
  }
});
```

### 4. Session Management
Implement proper session validation:
```javascript
// Validate sessions on sensitive operations
app.use('/api/admin/sensitive', authenticateToken, validateSession);
```

## Error Handling

The middleware provides structured error responses:

```javascript
// Permission denied
{
  "success": false,
  "message": "Permission denied: delete access to users",
  "data": null
}

// Hierarchy violation
{
  "success": false,
  "message": "Cannot manage users of equal or higher hierarchy level",
  "data": null
}

// Time restriction
{
  "success": false,
  "message": "Access denied: outside allowed time window",
  "data": null
}
```

## Testing

The middleware includes comprehensive test coverage:

```bash
# Run middleware tests
npm test -- --testPathPattern=middleware/auth

# Run specific test suites
npm test -- --testPathPattern=auth-simple.test.js
```

## Performance Considerations

### 1. Caching
- Role and permission data is cached in JWT tokens
- Session validation uses efficient database queries
- Audit logging is asynchronous to avoid blocking requests

### 2. Database Optimization
- Proper indexing on audit log collections
- Efficient queries for permission checking
- Automatic log cleanup and archiving

### 3. Rate Limiting
- Prevents abuse and DoS attacks
- Configurable limits based on operation sensitivity
- IP-based and user-based rate limiting

## Migration Guide

### From Basic Auth to Enhanced Auth

1. **Update Imports**
```javascript
// Old
const { authenticateToken } = require('./middleware/auth');

// New
const { 
  authenticateToken, 
  requirePermission, 
  auditLogger 
} = require('./middleware/auth');
```

2. **Add Permission Checks**
```javascript
// Old
app.post('/api/users', authenticateToken, handler);

// New
app.post('/api/users', 
  authenticateToken, 
  requirePermission('users', 'create'),
  auditLogger('user_create', 'users'),
  handler
);
```

3. **Update Role Definitions**
```javascript
// Ensure roles include new permission structure
const adminRole = {
  name: 'Admin',
  level: 2,
  permissions: [
    { resource: 'users', actions: ['create', 'read', 'update'] },
    { resource: 'products', actions: ['create', 'read', 'update', 'delete'] }
  ]
};
```

This enhanced middleware provides enterprise-grade security and audit capabilities while maintaining ease of use and performance.