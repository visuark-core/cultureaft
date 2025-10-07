import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading: userLoading } = useAuth();
  const { admin, isAuthenticated: adminAuthenticated, loading: adminLoading } = useAdminAuth();
  const location = useLocation();

  // For admin routes, use admin authentication
  if (requireAdmin) {
    if (adminLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-gray-600">Loading admin panel...</span>
          </div>
        </div>
      );
    }

    if (!adminAuthenticated || !admin) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
  }

  // For regular user routes, use user authentication
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
