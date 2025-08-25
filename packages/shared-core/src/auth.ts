import { User, AuthResponse } from './types';

export class AuthService {
  private baseUrl: string;
  private tenantId: string;

  constructor(baseUrl: string, tenantId: string) {
    this.baseUrl = baseUrl;
    this.tenantId = tenantId;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': this.tenantId,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  async me(token: string): Promise<{ success: boolean; data: User }> {
    const response = await fetch(`${this.baseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id': this.tenantId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  async logout(token: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id': this.tenantId,
      },
    });
  }

  // Storage helpers
  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  static setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  static removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  static getUser(): User | null {
    const userData = localStorage.getItem('auth_user');
    return userData ? JSON.parse(userData) : null;
  }

  static setUser(user: User): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  static removeUser(): void {
    localStorage.removeItem('auth_user');
  }

  // Role-based routing
  static getDefaultRoute(role: string): string {
    if (role === 'tenant_admin' || role === 'designer') {
      return '/admin/dashboard';
    }
    return '/portal/tasks';
  }

  static isAdminRole(role: string): boolean {
    return role === 'tenant_admin' || role === 'designer';
  }
}