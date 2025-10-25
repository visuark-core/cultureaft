import React from 'react';
import SystemDashboard from '../components/SystemDashboard';

const SystemMonitoring: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="mt-2 text-gray-600">
            Monitor system health, performance, and maintenance status
          </p>
        </div>
        
        <SystemDashboard showDetails={true} />
      </div>
    </div>
  );
};

export default SystemMonitoring;