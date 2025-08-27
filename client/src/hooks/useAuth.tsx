
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';

interface AuthUser extends Omit<User, 'password'> {
  tenant_id: string;
}

interface AuthContextType {
  user: AuthUser | null | undefined;
  isAuthenticated: boolean;
  login: (userData: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  hasAdminAccess: () => boolean;
  hasPortalAccess: () => boolean;
  hasRole: (role: string) => boolean;
  getDefaultRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('access_token');
        const tenantId = localStorage.getItem('tenant_id');

        if (storedUser && accessToken && tenantId) {
          const userData = JSON.parse(storedUser) as AuthUser;
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('tenant_id');
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: AuthUser, accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('tenant_id', userData.tenant_id);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant_id');
    setUser(null);
    window.location.href = '/login';
  };

  const hasAdminAccess = () => {
    return user?.role === 'tenant_admin' || user?.role === 'designer';
  };

  const hasPortalAccess = () => {
    return user?.role === 'approver' || user?.role === 'user';
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const getDefaultRoute = () => {
    if (!user) return '/login';
    
    if (user.role === 'tenant_admin' || user.role === 'designer') {
      return '/admin/dashboard';
    } else if (user.role === 'approver' || user.role === 'user') {
      return '/portal/inbox';
    }
    
    return '/login';
  };

  const isAuthenticated = !!user && !!localStorage.getItem('access_token');

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      hasAdminAccess,
      hasPortalAccess,
      hasRole,
      getDefaultRoute,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
