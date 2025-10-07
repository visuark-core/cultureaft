import React, { useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { AlertTriangle, Wifi, WifiOff, Clock, User } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { admin, isAuthenticated, loading, sessionExpiry, extendSession } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [showSessionWarning, setShowSessionWarning] = React.useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/admin/login', { 
        state: { from: location },
        replace: true 
      });
    }
  }, [isAuthenticated, loading, navigate, location]);

  // Session expiry warning
  useEffect(() => {
    if (!sessionExpiry) return;

    const checkSessionExpiry = () => {
      const now = new Date();
      const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();
      
      // Show warning 5 minutes before expiry
      if (timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 0) {
        setShowSessionWarning(true);
      } else {
        setShowSessionWarning(false);
      }
    };

    const interval = setInterval(checkSessionExpiry, 30000); // Check every 30 seconds
    checkSessionExpiry(); // Check immediately

    return () => clearInterval(interval);
  }, [sessionExpiry]);

  const handleExtendSession = async () => {
    try {
      await extendSession();
      setShowSessionWarning(false);
    } catch (error) {
      console.error('Failed to extend session:', error);
      navigate('/admin/login');
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Session Info */}
              {sessionExpiry && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    Session expires: {sessionExpiry.toLocaleTimeString()}
                  </span>
                </div>
              )}

              {/* Admin Info */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>
                  {admin.profile.firstName} {admin.profile.lastName}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {admin.role.name}
                </span>
              </div>

              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Session Warning */}
        {showSessionWarning && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Your session will expire in less than 5 minutes. Would you like to extend it?
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExtendSession}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                >
                  Extend Session
                </button>
                <button
                  onClick={() => setShowSessionWarning(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;