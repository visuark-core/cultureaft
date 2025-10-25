import React, { createContext, useContext, useState, useEffect } from 'react';
import UserDataService from '../services/userDataService';
import adminAuthService from '../services/adminAuthService';
import tokenService from '../services/tokenService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userDataService = new UserDataService();

  // Session persistence with proper error handling and expiration logic
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check if we have valid tokens
        const accessToken = await tokenService.getValidAccessToken();
        if (accessToken) {
          // Try to get current user info from backend
          try {
            const response = await adminAuthService.getCurrentUser();
            if (response.success && response.data) {
              const adminUser = response.data;
              const fullName = adminUser.fullName || adminUser.email.split('@')[0];
              
              const user: User = {
                id: adminUser.id,
                name: fullName,
                email: adminUser.email,
                role: 'admin',
                fullName: fullName
              };
              setUser(user);
            }
          } catch (error) {
            console.error('Failed to restore admin session:', error);
            tokenService.clearTokens();
          }
        } else {
          // Check for legacy session data
          const storedUser = localStorage.getItem('user');
          const sessionExpiry = localStorage.getItem('sessionExpiry');
          const rememberMe = localStorage.getItem('rememberMe') === 'true';
          
          if (storedUser && sessionExpiry) {
            const expiryTime = parseInt(sessionExpiry, 10);
            const currentTime = Date.now();
            
            // Check if session has expired
            if (currentTime > expiryTime) {
              // Session expired, clear storage
              localStorage.removeItem('user');
              localStorage.removeItem('sessionExpiry');
              localStorage.removeItem('rememberMe');
              setUser(null);
            } else {
              // Session is valid, restore user
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              
              // If not remember me, extend session for current browser session only
              if (!rememberMe) {
                // Set expiry to end of browser session (24 hours from now)
                const newExpiry = currentTime + (24 * 60 * 60 * 1000);
                localStorage.setItem('sessionExpiry', newExpiry.toString());
              }
            }
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('sessionExpiry');
        localStorage.removeItem('rememberMe');
        tokenService.clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Fixed admin email for backward compatibility
  const ADMIN_EMAIL = 'admin@cultureaft.com';

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<User> => {
    try {
      // Check if this is an admin login attempt
      const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      
      if (isAdminEmail) {
        // Use real admin authentication
        const response = await adminAuthService.login({ email, password });
        
        console.log('🔍 AuthContext login response:', response);
        
        if (response.success && response.data && response.data.admin) {
          console.log('🔍 AuthContext response.data:', response.data);
          const adminUser = response.data.admin;
          console.log('🔍 AuthContext adminUser:', adminUser);
          
          if (!adminUser || !adminUser.id) {
            throw new Error('Invalid admin user data received from server');
          }
          
          const fullName = adminUser.profile?.firstName && adminUser.profile?.lastName 
            ? `${adminUser.profile.firstName} ${adminUser.profile.lastName}`
            : adminUser.email?.split('@')[0] || 'Admin User';
          
          const user: User = {
            id: adminUser.id,
            name: fullName,
            email: adminUser.email,
            role: 'admin',
            fullName: fullName
          };
          
          setUser(user);
          
          // Clear legacy session data
          localStorage.removeItem('user');
          localStorage.removeItem('sessionExpiry');
          localStorage.removeItem('rememberMe');
          
          return user;
        } else {
          throw new Error(response.message || 'Admin login failed');
        }
      } else {
        // Regular user login (mock for now)
        const mockUser: User = {
          id: Date.now().toString(),
          name: email.split('@')[0],
          email,
          role: 'user' as const,
        };
        
        setUser(mockUser);
        
        // Set session expiration based on remember me preference
        const currentTime = Date.now();
        let sessionExpiry: number;
        
        if (rememberMe) {
          // Remember me: 30 days
          sessionExpiry = currentTime + (30 * 24 * 60 * 60 * 1000);
        } else {
          // Regular session: 24 hours
          sessionExpiry = currentTime + (24 * 60 * 60 * 1000);
        }
        
        // Store user data and session info
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('sessionExpiry', sessionExpiry.toString());
        localStorage.setItem('rememberMe', rememberMe.toString());
        
        // Update last login date in user data service
        try {
          await userDataService.updateLastLogin(email);
        } catch (error) {
          console.error('Failed to update last login:', error);
          // Don't fail the login process if this fails
        }
        
        return mockUser;
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Invalid credentials');
    }
  };

  const logout = async () => {
    try {
      // If admin user, call admin logout
      if (user?.role === 'admin') {
        await adminAuthService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all session data
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('sessionExpiry');
      localStorage.removeItem('rememberMe');
      tokenService.clearTokens();
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};