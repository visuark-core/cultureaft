import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
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
  // We no longer need a loading state for checking storage, so we can set it to false.
  const [loading, setLoading] = useState(false);

  /*
    THE FIX: The following 'useEffect' block has been commented out.
    This stops the app from automatically logging you in from a saved session,
    forcing a new login every time the page is loaded.
  */
  // useEffect(() => {
  //   // Check if user is logged in (check localStorage or session)
  //   const storedUser = localStorage.getItem('user');
  //   if (storedUser) {
  //     setUser(JSON.parse(storedUser));
  //   }
  //   setLoading(false);
  // }, []);

  // Fixed admin email
  const ADMIN_EMAIL = 'admin@cultureaft.com';

  const login = async (email: string, password: string): Promise<User> => {
    try {
      // This is a mock login - replace with actual API call
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      
      const mockUser: User = {
        id: '1',
        name: isAdmin ? 'Admin User' : email.split('@')[0],
        email,
        role: isAdmin ? 'admin' as const : 'user' as const,
      };
      setUser(mockUser);
      // We still save to localStorage so you stay logged in while navigating the site.
      localStorage.setItem('user', JSON.stringify(mockUser));
      return mockUser;
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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