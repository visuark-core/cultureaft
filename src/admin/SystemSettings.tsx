import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SystemSetting {
  _id: string;
  category: string;
  key: string;
  value: any;
  dataType: string;
  description: string;
  isPublic: boolean;
  isEditable: boolean;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  lastModifiedBy: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  updatedAt: string;
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categories = [
    { value: 'all', label: 'All Settings' },
    { value: 'general', label: 'General' },
    { value: 'security', label: 'Security' },
    { value: 'performance', label: 'Performance' },
    { value: 'backup', label: 'Backup' },
    { value: 'payment', label: 'Payment' },
    { value: 'email', label: 'Email' },
    { value: 'storage', label: 'Storage' },
    { value: 'integration', label: 'Integration' },
    { value: 'notification', label: 'Notification' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  useEffect(() => {
    fetchSettings();
  }, [selectedCategory]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const endpoint = selectedCategory === 'all' 
        ? '/api/system/settings' 
        : `/api/system/settings/${selectedCategory}`;
      
      const response = await fetch(endpoint, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data.data);
      
      // Initialize editing values
      const initialValues: Record<string, any> = {};
      data.data.forEach((setting: SystemSetting) => {
        initialValues[`${setting.category}.${setting.key}`] = setting.value;
      });
      setEditingValues(initialValues);
      
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (category: string, key: string, value: any) => {
    const settingKey = `${category}.${key}`;
    setEditingValues(prev => ({
      ...prev,
      [settingKey]: value
    }));
  };

  const saveSetting = async (category: string, key: string, reason: string = '') => {
    const settingKey = `${category}.${key}`;
    const value = editingValues[settingKey];
    
    try {
      setSaving(settingKey);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/system/settings/${category}/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ value, reason })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update setting');
      }
      
      setSuccess(`Setting ${category}.${key} updated successfully`);
      await fetchSettings(); // Refresh settings
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error updating setting:', error);
      setError(error instanceof Error ? error.message : 'Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const initializeSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system/settings/initialize', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize settings');
      }
      
      setSuccess('Default settings initialized successfully');
      await fetchSettings();
      
    } catch (error) {
      console.error('Error initializing settings:', error);
      setError('Failed to initialize default settings');
    } finally {
      setLoading(false);
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const settingKey = `${setting.category}.${setting.key}`;
    const currentValue = editingValues[settingKey];
    const hasChanged = currentValue !== setting.value;

    if (!setting.isEditable) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">{String(setting.value)}</span>
          <span className="text-xs text-gray-400">(Read-only)</span>
        </div>
      );
    }

    switch (setting.dataType) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={currentValue}
              onChange={(e) => handleValueChange(setting.category, setting.key, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              {currentValue ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleValueChange(setting.category, setting.key, Number(e.target.value))}
            min={setting.validation?.min}
            max={setting.validation?.max}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      
      case 'string':
        if (setting.validation?.options) {
          return (
            <select
              value={currentValue}
              onChange={(e) => handleValueChange(setting.category, setting.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {setting.validation.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        }
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleValueChange(setting.category, setting.key, e.target.value)}
            pattern={setting.validation?.pattern}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      
      default:
        return (
          <textarea
            value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleValueChange(setting.category, setting.key, parsed);
              } catch {
                handleValueChange(setting.category, setting.key, e.target.value);
              }
            }}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600">Configure system-wide settings and preferences</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={initializeSettings}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Initialize Defaults
          </button>
          <button
            onClick={fetchSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <div key={category} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {category} Settings
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {categorySettings.map(setting => {
              const settingKey = `${setting.category}.${setting.key}`;
              const hasChanged = editingValues[settingKey] !== setting.value;
              
              return (
                <div key={setting._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{setting.key}</h3>
                        {!setting.isPublic && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            Private
                          </span>
                        )}
                        {hasChanged && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            Modified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                      
                      <div className="mb-3">
                        {renderSettingInput(setting)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Last modified: {new Date(setting.updatedAt).toLocaleString()}</span>
                        </div>
                        <span>
                          by {setting.lastModifiedBy.profile.firstName} {setting.lastModifiedBy.profile.lastName}
                        </span>
                      </div>
                    </div>
                    
                    {setting.isEditable && hasChanged && (
                      <button
                        onClick={() => saveSetting(setting.category, setting.key)}
                        disabled={saving === settingKey}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
                      >
                        {saving === settingKey ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        <span>Save</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {settings.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Settings Found</h3>
          <p className="text-gray-600 mb-4">
            No system settings found for the selected category.
          </p>
          <button
            onClick={initializeSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Initialize Default Settings
          </button>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;