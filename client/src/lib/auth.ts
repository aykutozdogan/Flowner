import { User } from '@shared/schema';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface AuthUser extends Omit<User, 'password'> {
  tenant: {
    id: string;
    name: string;
    domain: string;
  };
}

export class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user';
  private static readonly TENANT_ID_KEY = 'tenant_id';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getTenantId(): string | null {
    return localStorage.getItem(this.TENANT_ID_KEY);
  }

  static getUser(): AuthUser | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static setAuthData(tokens: AuthTokens, user: AuthUser): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.TENANT_ID_KEY, user.tenant_id);
  }

  static clearAuthData(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TENANT_ID_KEY);
  }

  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getUser();
    const tenantId = this.getTenantId();
    
    return !!(token && user && tenantId);
  }

  static getAuthHeaders(): HeadersInit {
    const token = this.getAccessToken();
    const tenantId = this.getTenantId();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }
    
    return headers;
  }

  static async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.clearAuthData();
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, data.data.access_token);
        return true;
      } else {
        throw new Error(data.detail || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuthData();
      return false;
    }
  }

  static logout(): void {
    this.clearAuthData();
    window.location.href = '/login';
  }
}

// Auth hook for React components
export const useAuth = () => {
  const isAuthenticated = AuthService.isAuthenticated();
  const user = AuthService.getUser();
  const tenantId = AuthService.getTenantId();

  return {
    isAuthenticated,
    user,
    tenantId,
    login: AuthService.setAuthData.bind(AuthService),
    logout: AuthService.logout.bind(AuthService),
    refresh: AuthService.refreshAccessToken.bind(AuthService),
  };
};
