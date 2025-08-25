import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'tenant_admin' | 'designer' | 'approver' | 'user';
  tenant_id: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  tenantId: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  hasAdminAccess: () => boolean;
  hasPortalAccess: () => boolean;
  getDefaultRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    // Local storage'dan auth bilgilerini yükle
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    const storedTenantId = localStorage.getItem('tenant_id');

    if (storedToken && storedUser && storedTenantId) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        setTenantId(storedTenantId);
      } catch (error) {
        console.error('Auth verileri parse edilemedi:', error);
        logout();
      }
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setTenantId(userData.tenant_id);
    
    localStorage.setItem('access_token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('tenant_id', userData.tenant_id);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setTenantId(null);
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant_id');
  };

  const hasAdminAccess = () => {
    return user?.role === 'tenant_admin' || user?.role === 'designer';
  };

  const hasPortalAccess = () => {
    return user?.role === 'approver' || user?.role === 'user';
  };

  const getDefaultRoute = () => {
    if (!user) return '/login';
    
    if (hasAdminAccess()) {
      return '/admin/dashboard';
    } else if (hasPortalAccess()) {
      return '/portal/tasks';
    }
    
    return '/login';
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    isAuthenticated,
    token,
    tenantId,
    login,
    logout,
    hasAdminAccess,
    hasPortalAccess,
    getDefaultRoute
  };

  return (
    <AuthContext.Provider value={value}>
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