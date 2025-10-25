import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import dataService, { DataSourceStatus } from '../services/dataService';

const DataSourceStatus: React.FC = () => {
  const [status, setStatus] = useState<DataSourceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await dataService.getDataSourceStatus();
      if (response.success) {
        setStatus(response.data);
      } else {
        setError(response.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isActive: boolean, isAvailable: boolean) => {
    if (isActive && isAvailable) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (isAvailable) {
      return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    } else {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (isActive: boolean, isAvailable: boolean) => {
    if (isActive && isAvailable) {
      return 'Active';
    } else if (isAvailable) {
      return 'Available';
    } else {
      return 'Unavailable';
    }
  };

  const getStatusColor = (isActive: boolean, isAvailable: boolean) => {
    if (isActive && isAvailable) {
      return 'text-green-700 bg-green-50 border-green-200';
    } else if (isAvailable) {
      return 'text-blue-700 bg-blue-50 border-blue-200';
    } else {
      return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Data Source Status</h3>
        </div>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">Error: {error}</p>
        </div>
        <button
          onClick={fetchStatus}
          className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const isGoogleSheetsActive = status.primaryDataSource === 'Google Sheets';
  const isMongoActive = status.primaryDataSource === 'MongoDB';

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Data Source Status</h3>
        <button
          onClick={fetchStatus}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {/* Primary Data Source */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center">
            <div className="mr-3">
              {status.primaryDataSource === 'Google Sheets' ? (
                getStatusIcon(true, status.googleSheetsEnabled)
              ) : status.primaryDataSource === 'MongoDB' ? (
                getStatusIcon(true, status.mongoDbAvailable)
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Primary Data Source</p>
              <p className="text-sm text-gray-500">{status.primaryDataSource}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            status.primaryDataSource === 'Google Sheets' 
              ? getStatusColor(true, status.googleSheetsEnabled)
              : status.primaryDataSource === 'MongoDB'
              ? getStatusColor(true, status.mongoDbAvailable)
              : 'text-yellow-700 bg-yellow-50 border-yellow-200'
          }`}>
            {status.primaryDataSource === 'Google Sheets' 
              ? getStatusText(true, status.googleSheetsEnabled)
              : status.primaryDataSource === 'MongoDB'
              ? getStatusText(true, status.mongoDbAvailable)
              : 'Unknown'
            }
          </span>
        </div>

        {/* Google Sheets Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center">
            <div className="mr-3">
              {getStatusIcon(isGoogleSheetsActive, status.googleSheetsEnabled)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Google Sheets</p>
              <p className="text-sm text-gray-500">
                {status.spreadsheetId ? `ID: ${status.spreadsheetId.substring(0, 20)}...` : 'Not configured'}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            getStatusColor(isGoogleSheetsActive, status.googleSheetsEnabled)
          }`}>
            {getStatusText(isGoogleSheetsActive, status.googleSheetsEnabled)}
          </span>
        </div>

        {/* MongoDB Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center">
            <div className="mr-3">
              {getStatusIcon(isMongoActive, status.mongoDbAvailable)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">MongoDB</p>
              <p className="text-sm text-gray-500">
                {status.fallbackEnabled ? 'Fallback enabled' : 'Fallback disabled'}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            getStatusColor(isMongoActive, status.mongoDbAvailable)
          }`}>
            {getStatusText(isMongoActive, status.mongoDbAvailable)}
          </span>
        </div>

        {/* Configuration Info */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Configuration</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Fallback to MongoDB: {status.fallbackEnabled ? 'Enabled' : 'Disabled'}</p>
            <p>• Google Sheets Integration: {status.googleSheetsEnabled ? 'Enabled' : 'Disabled'}</p>
            {status.spreadsheetId && (
              <p>• Spreadsheet URL: 
                <a 
                  href={`https://docs.google.com/spreadsheets/d/${status.spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-600 hover:text-blue-800 underline"
                >
                  Open in Google Sheets
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Setup Instructions */}
        {!status.googleSheetsEnabled && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Google Sheets</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>To enable Google Sheets integration:</p>
              <ol className="list-decimal list-inside ml-2 space-y-1">
                <li>Run <code className="bg-blue-100 px-1 rounded">npm run setup-sheets create</code> to create a new spreadsheet</li>
                <li>Add your Google Service Account credentials</li>
                <li>Set the GOOGLE_SHEETS_SPREADSHEET_ID in your environment</li>
                <li>Run <code className="bg-blue-100 px-1 rounded">npm run migrate-to-sheets</code> to migrate existing data</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourceStatus;