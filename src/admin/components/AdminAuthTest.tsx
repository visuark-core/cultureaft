import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Shield, User, Key, CheckCircle, XCircle } from 'lucide-react';

const AdminAuthTest = () => {
  const { admin, isAuthenticated, login, logout, hasPermission } = useAdminAuth();
  const [testResults, setTestResults] = useState<Array<{ test: string; passed: boolean; message: string }>>([]);

  const runTests = async () => {
    const results = [];

    // Test 1: Check if admin context is available
    results.push({
      test: 'Admin Context Available',
      passed: !!admin,
      message: admin ? `Admin: ${admin.profile.firstName} ${admin.profile.lastName}` : 'No admin context'
    });

    // Test 2: Check authentication status
    results.push({
      test: 'Authentication Status',
      passed: isAuthenticated,
      message: isAuthenticated ? 'Authenticated' : 'Not authenticated'
    });

    // Test 3: Check permissions
    if (admin) {
      const hasAllPermissions = hasPermission('all');
      results.push({
        test: 'Permission Check',
        passed: hasAllPermissions,
        message: hasAllPermissions ? 'Has all permissions' : 'Limited permissions'
      });

      // Test 4: Check role information
      results.push({
        test: 'Role Information',
        passed: !!admin.role,
        message: admin.role ? `Role: ${admin.role.name} (Level ${admin.role.level})` : 'No role information'
      });
    }

    setTestResults(results);
  };

  const testLogin = async () => {
    try {
      // This would normally use real credentials
      // For testing, we'll just show what would happen
      console.log('Test login would be performed here');
      setTestResults([...testResults, {
        test: 'Login Test',
        passed: false,
        message: 'Login test requires real credentials'
      }]);
    } catch (error) {
      setTestResults([...testResults, {
        test: 'Login Test',
        passed: false,
        message: `Login failed: ${error}`
      }]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Authentication Test</h1>
        </div>

        {/* Current Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm">
                Admin: {admin ? `${admin.profile.firstName} ${admin.profile.lastName}` : 'Not logged in'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-gray-500" />
              <span className="text-sm">
                Status: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
              </span>
            </div>
            {admin && (
              <>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <span className="text-sm">Role: {admin.role.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-gray-500" />
                  <span className="text-sm">Active: {admin.isActive ? 'Yes' : 'No'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Test Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Test Actions</h2>
          <div className="flex space-x-4">
            <button
              onClick={runTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Run Authentication Tests
            </button>
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Test Login Flow
            </button>
            {isAuthenticated && (
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Test Logout
              </button>
            )}
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Test Results</h2>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {result.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <span className={`font-medium ${result.passed ? 'text-green-900' : 'text-red-900'}`}>
                      {result.test}
                    </span>
                    <p className={`text-sm ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Endpoints Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">API Endpoints</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• POST /api/auth/login - Admin login</p>
            <p>• POST /api/auth/logout - Admin logout</p>
            <p>• POST /api/auth/refresh - Refresh access token</p>
            <p>• GET /api/auth/me - Get current admin profile</p>
            <p>• GET /api/auth/verify - Verify token validity</p>
            <p>• POST /api/auth/change-password - Change password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthTest;