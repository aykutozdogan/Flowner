
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  displayName?: string;
  roles: string[];
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, navigate] = useLocation();

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);

      // Role-based redirect
      const searchParams = new URLSearchParams(location.search);
      const redirectTo = searchParams.get('redirectTo');
      
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        // Default role-based redirect
        const roles = data.user.roles || [];
        if (roles.includes('tenant_admin') || roles.includes('designer')) {
          navigate('/admin/dashboard');
        } else if (roles.includes('user') || roles.includes('approver')) {
          navigate('/portal/tasks');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) || false;
  };

  const isAdmin = hasRole('tenant_admin') || hasRole('designer');
  const isUser = hasRole('user') || hasRole('approver');

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      hasRole,
      isAdmin,
      isUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
