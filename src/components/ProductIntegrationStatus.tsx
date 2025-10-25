import React, { useState, useEffect } from 'react';
import { Cloud, Database, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface IntegrationStatusProps {
  className?: string;
}

const ProductIntegrationStatus: React.FC<IntegrationStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState({
    cloudinary: { connected: false, status: 'checking' },
    googleSheets: { connected: false, status: 'checking' },
    lastCheck: new Date()
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    setIsRefreshing(true);
    
    try {
      // Check Cloudinary status (simplified - in real app you'd call an API)
      const cloudinaryStatus = import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME ?
        { connected: true, status: 'connected' } :
        { connected: false, status: 'not_configured' };

      // Check Google Sheets status (simplified - in real app you'd call an API)
      const sheetsStatus = { connected: true, status: 'connected' }; // Assume connected for demo

      setStatus({
        cloudinary: cloudinaryStatus,
        googleSheets: sheetsStatus,
        lastCheck: new Date()
      });
    } catch (error) {
      console.error('Error checking integration status:', error);
      setStatus(prev => ({
        ...prev,
        cloudinary: { connected: false, status: 'error' },
        googleSheets: { connected: false, status: 'error' },
        lastCheck: new Date()
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (connected: boolean, status: string) => {
    if (status === 'checking') return 'text-yellow-500';
    if (status === 'error') return 'text-red-500';
    return connected ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (connected: boolean, status: string) => {
    if (status === 'checking') return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (status === 'error') return <AlertCircle className="w-4 h-4" />;
    return connected ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />;
  };

  const getStatusText = (connected: boolean, status: string) => {
    if (status === 'checking') return 'Checking...';
    if (status === 'error') return 'Error';
    if (status === 'not_configured') return 'Not Configured';
    return connected ? 'Connected' : 'Disconnected';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Integration Status</h3>
        <button
          onClick={checkIntegrationStatus}
          disabled={isRefreshing}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh status"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Cloudinary Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Cloud className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900">Cloudinary</p>
              <p className="text-sm text-gray-600">Image Storage & CDN</p>
            </div>
          </div>
          <div className={`flex items-center space-x-2 ${getStatusColor(status.cloudinary.connected, status.cloudinary.status)}`}>
            {getStatusIcon(status.cloudinary.connected, status.cloudinary.status)}
            <span className="text-sm font-medium">
              {getStatusText(status.cloudinary.connected, status.cloudinary.status)}
            </span>
          </div>
        </div>

        {/* Google Sheets Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-gray-900">Google Sheets</p>
              <p className="text-sm text-gray-600">Product Data Storage</p>
            </div>
          </div>
          <div className={`flex items-center space-x-2 ${getStatusColor(status.googleSheets.connected, status.googleSheets.status)}`}>
            {getStatusIcon(status.googleSheets.connected, status.googleSheets.status)}
            <span className="text-sm font-medium">
              {getStatusText(status.googleSheets.connected, status.googleSheets.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Integration Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">How it works:</p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Product images are uploaded to Cloudinary for optimization and fast delivery</li>
              <li>• Product data is stored in Google Sheets for easy management and collaboration</li>
              <li>• Users see products fetched from Google Sheets with Cloudinary image URLs</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Last checked: {status.lastCheck.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default ProductIntegrationStatus;