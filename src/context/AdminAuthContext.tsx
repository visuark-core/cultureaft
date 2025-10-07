import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminAuthService, AdminUser, LoginResponse } from '../services/adminAuthService';

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasMinimumRole: (level: number) => boolean;
  sessionExpiry: Date | null;
  extendSession: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Check if we have stored credentials
        const storedAdmin = adminAuthService.getStoredAdmin();
        const storedToken = adminAuthService.getStoredToken();
        
        if (storedAdmin && storedToken) {
          // Verify token is still valid
          const isValid = await adminAuthService.verifyToken();
          
          if (isValid) {
            setAdmin(storedAdmin);
            // Calculate session expiry (15 minutes from now as per backend)
            setSessionExpiry(new Date(Date.now() + 15 * 60 * 1000));
          } else {
            // Token invalid, clear storage
            await adminAuthService.logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await adminAuthService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!admin || !sessionExpiry) return;

    const refreshInterval = setInterval(async () => {
      const now = new Date();
      const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();
      
      // Refresh token 2 minutes before expiry
      if (timeUntilExpiry <= 2 * 60 * 1000 && timeUntilExpiry > 0) {
        try {
          await adminAuthService.refreshToken();
          setSessionExpiry(new Date(Date.now() + 15 * 60 * 1000));
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          await logout();
        }
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [admin, sessionExpiry]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    try {
      setLoading(true);
      const result = await adminAuthService.login(email, password);
      
      setAdmin(result.admin);
      setSessionExpiry(new Date(Date.now() + 15 * 60 * 1000));
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await adminAuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdmin(null);
      setSessionExpiry(null);
      setLoading(false);
    }
  }, []);

  const logoutAll = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await adminAuthService.logoutAll();
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      setAdmin(null);
      setSessionExpiry(null);
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const updatedAdmin = await adminAuthService.getCurrentAdmin();
      setAdmin(updatedAdmin);
    } catch (error) {
      console.error('Profile refresh error:', error);
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await adminAuthService.changePassword(currentPassword, newPassword);
      // Password change forces logout on backend, so logout locally too
      await logout();
    } catch (error) {
      throw error;
    }
  }, [logout]);

  const hasPermission = useCallback((permission: string): boolean => {
    return adminAuthService.hasPermission(permission);
  }, [admin]);

  const hasMinimumRole = useCallback((level: number): boolean => {
    return adminAuthService.hasMinimumRole(level);
  }, [admin]);

  const extendSession = useCallback(async (): Promise<void> => {
    try {
      await adminAuthService.refreshToken();
      setSessionExpiry(new Date(Date.now() + 15 * 60 * 1000));
    } catch (error) {
      console.error('Session extension failed:', error);
      throw error;
    }
  }, []);

  const value: AdminAuthContextType = {
    admin,
    loading,
    isAuthenticated: !!admin,
    login,
    logout,
    logoutAll,
    refreshProfile,
    changePassword,
    hasPermission,
    hasMinimumRole,
    sessionExpiry,
    extendSession,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthProvider;