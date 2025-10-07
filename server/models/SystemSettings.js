const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'general',
      'security',
      'payment',
      'email',
      'storage',
      'performance',
      'backup',
      'integration',
      'notification',
      'maintenance'
    ]
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false // Whether this setting can be accessed by non-admin users
  },
  isEditable: {
    type: Boolean,
    default: true // Whether this setting can be modified
  },
  validation: {
    required: Boolean,
    min: Number,
    max: Number,
    pattern: String,
    options: [String] // For enum-like values
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  history: [{
    value: mongoose.Schema.Types.Mixed,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]
}, {
  timestamps: true
});

// Compound index for category and key
SystemSettingsSchema.index({ category: 1, key: 1 }, { unique: true });
SystemSettingsSchema.index({ lastModifiedBy: 1, updatedAt: -1 });
SystemSettingsSchema.index({ isPublic: 1 });

// Static method to get settings by category
SystemSettingsSchema.statics.getByCategory = function(category, includePrivate = false) {
  const query = { category };
  if (!includePrivate) {
    query.isPublic = true;
  }
  return this.find(query).sort({ key: 1 });
};

// Static method to get a specific setting
SystemSettingsSchema.statics.getSetting = function(category, key) {
  return this.findOne({ category, key });
};

// Static method to update a setting with history tracking
SystemSettingsSchema.statics.updateSetting = async function(category, key, value, adminId, reason = '') {
  const setting = await this.findOne({ category, key });
  
  if (!setting) {
    throw new Error(`Setting ${category}.${key} not found`);
  }

  if (!setting.isEditable) {
    throw new Error(`Setting ${category}.${key} is not editable`);
  }

  // Add to history
  setting.history.push({
    value: setting.value,
    modifiedBy: setting.lastModifiedBy,
    modifiedAt: setting.updatedAt,
    reason: reason
  });

  // Update current values
  setting.value = value;
  setting.lastModifiedBy = adminId;
  setting.version += 1;

  return await setting.save();
};

// Static method to create default settings
SystemSettingsSchema.statics.createDefaults = async function(adminId) {
  const defaultSettings = [
    // General Settings
    {
      category: 'general',
      key: 'site_name',
      value: 'Admin Dashboard',
      dataType: 'string',
      description: 'Name of the application',
      isPublic: true,
      lastModifiedBy: adminId
    },
    {
      category: 'general',
      key: 'site_description',
      value: 'Comprehensive admin management system',
      dataType: 'string',
      description: 'Description of the application',
      isPublic: true,
      lastModifiedBy: adminId
    },
    {
      category: 'general',
      key: 'maintenance_mode',
      value: false,
      dataType: 'boolean',
      description: 'Enable maintenance mode',
      isPublic: false,
      lastModifiedBy: adminId
    },

    // Security Settings
    {
      category: 'security',
      key: 'session_timeout',
      value: 3600,
      dataType: 'number',
      description: 'Session timeout in seconds',
      isPublic: false,
      validation: { min: 300, max: 86400 },
      lastModifiedBy: adminId
    },
    {
      category: 'security',
      key: 'max_login_attempts',
      value: 5,
      dataType: 'number',
      description: 'Maximum login attempts before account lockout',
      isPublic: false,
      validation: { min: 3, max: 10 },
      lastModifiedBy: adminId
    },
    {
      category: 'security',
      key: 'lockout_duration',
      value: 900,
      dataType: 'number',
      description: 'Account lockout duration in seconds',
      isPublic: false,
      validation: { min: 300, max: 3600 },
      lastModifiedBy: adminId
    },
    {
      category: 'security',
      key: 'require_mfa',
      value: false,
      dataType: 'boolean',
      description: 'Require multi-factor authentication for all admins',
      isPublic: false,
      lastModifiedBy: adminId
    },

    // Performance Settings
    {
      category: 'performance',
      key: 'cache_ttl',
      value: 300,
      dataType: 'number',
      description: 'Default cache TTL in seconds',
      isPublic: false,
      validation: { min: 60, max: 3600 },
      lastModifiedBy: adminId
    },
    {
      category: 'performance',
      key: 'max_concurrent_requests',
      value: 100,
      dataType: 'number',
      description: 'Maximum concurrent requests per IP',
      isPublic: false,
      validation: { min: 10, max: 1000 },
      lastModifiedBy: adminId
    },

    // Backup Settings
    {
      category: 'backup',
      key: 'auto_backup_enabled',
      value: true,
      dataType: 'boolean',
      description: 'Enable automatic backups',
      isPublic: false,
      lastModifiedBy: adminId
    },
    {
      category: 'backup',
      key: 'backup_frequency',
      value: 'daily',
      dataType: 'string',
      description: 'Backup frequency',
      isPublic: false,
      validation: { options: ['hourly', 'daily', 'weekly', 'monthly'] },
      lastModifiedBy: adminId
    },
    {
      category: 'backup',
      key: 'backup_retention_days',
      value: 30,
      dataType: 'number',
      description: 'Number of days to retain backups',
      isPublic: false,
      validation: { min: 7, max: 365 },
      lastModifiedBy: adminId
    }
  ];

  // Only create settings that don't already exist
  for (const setting of defaultSettings) {
    const existing = await this.findOne({ 
      category: setting.category, 
      key: setting.key 
    });
    
    if (!existing) {
      await this.create(setting);
    }
  }
};

const SystemSettings = mongoose.model('SystemSettings', SystemSettingsSchema);

module.exports = SystemSettings;