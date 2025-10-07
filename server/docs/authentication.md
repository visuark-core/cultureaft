# Admin Authentication System

## Overview

The admin authentication system provides secure JWT-based authentication with refresh tokens, role-based access control, and comprehensive security features for the admin panel.

## Features

### 🔐 Authentication
- JWT-based access tokens (15-minute expiry)
- Refresh tokens for session management (7-day expiry)
- Secure password hashing with bcrypt
- Account lockout after failed login attempts
- Session management with Redis support (optional)

### 🛡️ Security
- Password strength validation
- Rate limiting on authentication endpoints
- IP-based access control (optional)
- Comprehensive audit logging
- CSRF protection with httpOnly cookies
- Security headers (helmet.js)

### 👥 Authorization
- Role-based access control (RBAC)
- Hierarchical permission system
- Resource and action-based permissions
- Multi-level admin hierarchy

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/login`
Authenticate admin with email and password.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "...",
      "email": "admin@example.com",
      "profile": { ... },
      "role": { ... }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m"
  }
}
```

#### POST `/refresh`
Refresh access token using refresh token.

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m"
  }
}
```

#### POST `/logout`
Logout and invalidate refresh token.

#### POST `/logout-all`
Logout from all devices (invalidate all refresh tokens).

#### POST `/change-password`
Change admin password.

**Request:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

#### GET `/me`
Get current admin profile.

#### GET `/verify`
Verify if access token is valid.

## Middleware

### Authentication Middleware
- `authenticateToken`: Validates JWT access token
- `validateSession`: Ensures session is still active

### Authorization Middleware
- `requireRole(level)`: Requires minimum role level
- `requirePermission(resource, action)`: Requires specific permission
- `requireSuperAdmin`: Super admin only access
- `requireAdmin`: Admin or higher access
- `requireModerator`: Moderator or higher access

### Security Middleware
- `authRateLimit`: Rate limiting for auth routes
- `strictAuthRateLimit`: Strict rate limiting for failed attempts
- `auditLogger`: Logs admin actions for audit trail
- `ipWhitelist`: IP-based access control

## Usage Examples

### Protecting Routes
```javascript
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Require authentication
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ admin: req.admin });
});

// Require specific permission
router.post('/users', 
  authenticateToken,
  requirePermission('users', 'create'),
  (req, res) => {
    // Create user logic
  }
);

// Require admin role or higher
router.delete('/users/:id',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    // Delete user logic
  }
);
```

### Frontend Integration
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Include cookies
  body: JSON.stringify({ email, password })
});

// Make authenticated requests
const apiResponse = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
});

// Handle token refresh
if (apiResponse.status === 401) {
  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  
  if (refreshResponse.ok) {
    const { accessToken } = await refreshResponse.json();
    // Retry original request with new token
  }
}
```

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Client Configuration
CLIENT_URL=http://localhost:3000

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379
```

## Security Best Practices

1. **Strong JWT Secrets**: Use cryptographically secure random strings (min 32 characters)
2. **HTTPS Only**: Always use HTTPS in production
3. **Secure Cookies**: Refresh tokens stored in httpOnly, secure cookies
4. **Rate Limiting**: Implemented on authentication endpoints
5. **Account Lockout**: Automatic lockout after 5 failed attempts
6. **Audit Logging**: All admin actions are logged
7. **Token Rotation**: Refresh tokens are rotated on use
8. **Session Management**: Optional Redis integration for scalability

## Error Handling

The system provides comprehensive error handling with appropriate HTTP status codes:

- `400`: Validation errors, malformed requests
- `401`: Authentication required, invalid credentials
- `403`: Insufficient permissions
- `423`: Account locked
- `429`: Rate limit exceeded
- `500`: Internal server errors

## Testing

Run authentication tests:
```bash
npm test -- --testPathPattern=auth.test.js
```

The test suite covers:
- Password validation
- JWT token generation and verification
- Authentication flows
- Authorization checks
- Security features
- API endpoints

## Monitoring

The system provides comprehensive logging and monitoring:

- Security events logged to audit trail
- Failed login attempts tracked
- Rate limiting metrics
- Session management statistics
- Performance monitoring integration ready

## Future Enhancements

- Multi-factor authentication (MFA)
- OAuth integration
- Advanced threat detection
- Biometric authentication
- Single sign-on (SSO)