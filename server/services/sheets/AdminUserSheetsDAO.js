const googleSheetsService = require('../googleSheetsService');
const bcrypt = require('bcrypt');

class AdminUserSheetsDAO {
  constructor() {
    this.sheetName = 'AdminUsers';
    this.headers = [
      'id',
      'email',
      'passwordHash',
      'role.name',
      'role.level',
      'role.permissions',
      'role.canCreateSubAdmins',
      'role.description',
      'profile.firstName',
      'profile.lastName',
      'profile.avatar',
      'profile.phone',
      'security.lastLogin',
      'security.loginAttempts',
      'security.lockedUntil',
      'security.mfaEnabled',
      'security.passwordChangedAt',
      'audit.createdBy',
      'audit.createdAt',
      'audit.updatedAt',
      'audit.lastActivity',
      'isActive',
      'metadata.ipAddresses',
      'metadata.userAgents'
    ];
  }

  async initializeSheet() {
    try {
      await googleSheetsService.readSheet(this.sheetName, 'A1:X1');
    } catch (error) {
      if (error.code === 400) {
        await googleSheetsService.createSheet(this.sheetName);
        await googleSheetsService.writeSheet(this.sheetName, 'A1:X1', [this.headers]);
      } else {
        throw error;
      }
    }
  }

  async findAll() {
    await this.initializeSheet();
    const data = await googleSheetsService.readSheet(this.sheetName);
    const admins = googleSheetsService.sheetDataToObjects(data);
    
    // Parse complex fields
    return admins.map(admin => this.parseAdminData(admin));
  }

  async findById(id) {
    const admins = await this.findAll();
    return admins.find(admin => admin.id === id);
  }

  async findByEmail(email) {
    const admins = await this.findAll();
    return admins.find(admin => admin.email === email);
  }

  async create(adminData) {
    await this.initializeSheet();
    
    // Generate ID if not provided
    if (!adminData.id) {
      adminData.id = `ADMIN_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // Hash password if provided
    if (adminData.password) {
      const salt = await bcrypt.genSalt(12);
      adminData.passwordHash = await bcrypt.hash(adminData.password, salt);
      delete adminData.password;
    }

    // Set timestamps
    adminData.audit = adminData.audit || {};
    adminData.audit.createdAt = new Date().toISOString();
    adminData.audit.updatedAt = new Date().toISOString();
    adminData.security = adminData.security || {};
    adminData.security.passwordChangedAt = new Date().toISOString();
    adminData.security.loginAttempts = 0;
    adminData.isActive = adminData.isActive !== undefined ? adminData.isActive : true;

    // Serialize complex fields
    const serializedAdmin = this.serializeAdminData(adminData);
    
    const rowData = this.headers.map(header => {
      const value = googleSheetsService.getNestedValue(serializedAdmin, header);
      return value !== undefined && value !== null ? String(value) : '';
    });

    await googleSheetsService.appendToSheet(this.sheetName, [rowData]);
    return this.parseAdminData(serializedAdmin);
  }

  async update(id, updateData) {
    await this.initializeSheet();
    
    const data = await googleSheetsService.readSheet(this.sheetName);
    const admins = googleSheetsService.sheetDataToObjects(data);
    
    const adminIndex = admins.findIndex(admin => admin.id === id);
    if (adminIndex === -1) {
      throw new Error('Admin user not found');
    }

    // Parse existing admin data
    const existingAdmin = this.parseAdminData(admins[adminIndex]);
    
    // Hash password if being updated
    if (updateData.password) {
      const salt = await bcrypt.genSalt(12);
      updateData.passwordHash = await bcrypt.hash(updateData.password, salt);
      updateData.security = updateData.security || existingAdmin.security || {};
      updateData.security.passwordChangedAt = new Date().toISOString();
      delete updateData.password;
    }

    // Update timestamps
    updateData.audit = updateData.audit || existingAdmin.audit || {};
    updateData.audit.updatedAt = new Date().toISOString();

    // Merge with existing data
    const updatedAdmin = { ...existingAdmin, ...updateData };
    
    // Serialize complex fields
    const serializedAdmin = this.serializeAdminData(updatedAdmin);

    // Update the row in the sheet
    const rowNumber = adminIndex + 2;
    const rowData = this.headers.map(header => {
      const value = googleSheetsService.getNestedValue(serializedAdmin, header);
      return value !== undefined && value !== null ? String(value) : '';
    });

    await googleSheetsService.writeSheet(this.sheetName, `A${rowNumber}:X${rowNumber}`, [rowData]);
    return this.parseAdminData(serializedAdmin);
  }

  async delete(id) {
    // Mark as inactive instead of deleting
    return await this.update(id, { isActive: false });
  }

  async comparePassword(admin, candidatePassword) {
    return bcrypt.compare(candidatePassword, admin.passwordHash);
  }

  async incrementLoginAttempts(id) {
    const admin = await this.findById(id);
    if (!admin) {
      throw new Error('Admin user not found');
    }

    const security = admin.security || {};
    const loginAttempts = (parseInt(security.loginAttempts) || 0) + 1;
    
    const updateData = {
      security: {
        ...security,
        loginAttempts
      }
    };

    // Lock account after 5 failed attempts for 2 hours
    if (loginAttempts >= 5) {
      updateData.security.lockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    }

    return await this.update(id, updateData);
  }

  async resetLoginAttempts(id) {
    const admin = await this.findById(id);
    if (!admin) {
      throw new Error('Admin user not found');
    }

    const security = admin.security || {};
    delete security.loginAttempts;
    delete security.lockedUntil;

    return await this.update(id, { security });
  }

  async updateLastActivity(id) {
    const updateData = {
      audit: {
        lastActivity: new Date().toISOString()
      },
      security: {
        lastLogin: new Date().toISOString()
      }
    };

    return await this.update(id, updateData);
  }

  async addLoginHistory(id, ipAddress, userAgent, success = true) {
    const admin = await this.findById(id);
    if (!admin) {
      throw new Error('Admin user not found');
    }

    const metadata = admin.metadata || { ipAddresses: [], userAgents: [] };
    
    // Add IP address if not already present
    if (ipAddress && !metadata.ipAddresses.includes(ipAddress)) {
      metadata.ipAddresses.push(ipAddress);
    }
    
    // Add user agent if not already present
    if (userAgent && !metadata.userAgents.includes(userAgent)) {
      metadata.userAgents.push(userAgent);
    }

    return await this.update(id, { metadata });
  }

  // Helper methods for serialization/deserialization
  serializeAdminData(admin) {
    const serialized = { ...admin };
    
    // Serialize role permissions
    if (serialized.role && serialized.role.permissions) {
      serialized['role.permissions'] = JSON.stringify(serialized.role.permissions);
    }
    
    // Serialize metadata arrays
    if (serialized.metadata) {
      if (serialized.metadata.ipAddresses) {
        serialized['metadata.ipAddresses'] = JSON.stringify(serialized.metadata.ipAddresses);
      }
      if (serialized.metadata.userAgents) {
        serialized['metadata.userAgents'] = JSON.stringify(serialized.metadata.userAgents);
      }
    }

    return serialized;
  }

  parseAdminData(admin) {
    const parsed = { ...admin };
    
    // Parse role permissions
    if (parsed['role.permissions']) {
      try {
        if (!parsed.role) parsed.role = {};
        parsed.role.permissions = JSON.parse(parsed['role.permissions']);
      } catch (error) {
        parsed.role.permissions = [];
      }
    }
    
    // Parse metadata arrays
    if (parsed['metadata.ipAddresses']) {
      try {
        if (!parsed.metadata) parsed.metadata = {};
        parsed.metadata.ipAddresses = JSON.parse(parsed['metadata.ipAddresses']);
      } catch (error) {
        if (!parsed.metadata) parsed.metadata = {};
        parsed.metadata.ipAddresses = [];
      }
    }
    
    if (parsed['metadata.userAgents']) {
      try {
        if (!parsed.metadata) parsed.metadata = {};
        parsed.metadata.userAgents = JSON.parse(parsed['metadata.userAgents']);
      } catch (error) {
        if (!parsed.metadata) parsed.metadata = {};
        parsed.metadata.userAgents = [];
      }
    }

    // Ensure nested objects exist
    if (!parsed.role) parsed.role = {};
    if (!parsed.profile) parsed.profile = {};
    if (!parsed.security) parsed.security = {};
    if (!parsed.audit) parsed.audit = {};
    if (!parsed.metadata) parsed.metadata = {};

    return parsed;
  }

  // Check if user has permission
  hasPermission(admin, resource, action) {
    if (!admin.isActive) return false;
    
    const permissions = admin.role?.permissions || [];
    const permission = permissions.find(p => p.resource === resource);
    if (!permission) return false;
    
    return permission.actions?.includes(action) || false;
  }

  // Check if account is locked
  isLocked(admin) {
    const lockedUntil = admin.security?.lockedUntil;
    return !!(lockedUntil && new Date(lockedUntil) > new Date());
  }

  // Get default roles
  getDefaultRoles() {
    return {
      super_admin: {
        name: 'super_admin',
        level: 1,
        canCreateSubAdmins: true,
        description: 'Full system access with all permissions',
        permissions: [
          { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'suspend', 'export', 'import'] },
          { resource: 'products', actions: ['create', 'read', 'update', 'delete', 'approve', 'export', 'import'] },
          { resource: 'orders', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
          { resource: 'payments', actions: ['read', 'update', 'approve', 'export'] },
          { resource: 'analytics', actions: ['read', 'export'] },
          { resource: 'content', actions: ['create', 'read', 'update', 'delete', 'approve'] },
          { resource: 'system', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'admins', actions: ['create', 'read', 'update', 'delete', 'suspend'] }
        ]
      },
      admin: {
        name: 'admin',
        level: 2,
        canCreateSubAdmins: true,
        description: 'Administrative access with most permissions',
        permissions: [
          { resource: 'users', actions: ['create', 'read', 'update', 'suspend', 'export'] },
          { resource: 'products', actions: ['create', 'read', 'update', 'delete', 'approve', 'export', 'import'] },
          { resource: 'orders', actions: ['read', 'update', 'approve', 'export'] },
          { resource: 'payments', actions: ['read', 'export'] },
          { resource: 'analytics', actions: ['read', 'export'] },
          { resource: 'content', actions: ['create', 'read', 'update', 'approve'] },
          { resource: 'admins', actions: ['read'] }
        ]
      }
    };
  }
}

module.exports = new AdminUserSheetsDAO();