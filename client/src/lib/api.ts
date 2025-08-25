import { AuthService } from './auth';

class APIError extends Error {
  public status: number;
  public type: string;
  public details?: any;

  constructor(status: number, message: string, type: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.type = type;
    this.details = details;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: res.statusText };
    }

    throw new APIError(
      res.status,
      errorData.detail || errorData.message || res.statusText,
      errorData.type || '/api/errors/unknown',
      errorData
    );
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: RequestInit = {}
): Promise<Response> {
  // Ensure URL starts with /
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  
  const config: RequestInit = {
    method,
    ...options,
    headers: {
      ...AuthService.getAuthHeaders(),
      ...options.headers,
    },
  };

  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    config.body = JSON.stringify(data);
  }

  let response = await fetch(normalizedUrl, config);

  // Handle token refresh for 401 errors on protected routes
  if (response.status === 401 && normalizedUrl !== '/api/auth/login' && normalizedUrl !== '/api/auth/refresh') {
    const refreshSuccess = await AuthService.refreshAccessToken();
    
    if (refreshSuccess) {
      // Retry request with new token
      config.headers = {
        ...AuthService.getAuthHeaders(),
        ...options.headers,
      };
      response = await fetch(normalizedUrl, config);
    } else {
      // Refresh failed, redirect to login
      AuthService.logout();
      return response;
    }
  }

  await throwIfResNotOk(response);
  return response;
}

// Specific API methods
export const api = {
  // Auth
  login: async (email: string, password: string, tenantId: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenantId,
      },
      body: JSON.stringify({ email, password }),
    });
    
    await throwIfResNotOk(response);
    return response.json();
  },

  refresh: async (refreshToken: string) => {
    const response = await apiRequest('POST', '/api/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.json();
  },

  me: async () => {
    const response = await apiRequest('GET', '/api/auth/me');
    return response.json();
  },

  // Analytics
  getDashboardAnalytics: async () => {
    const response = await apiRequest('GET', '/api/analytics/dashboard');
    return response.json();
  },

  // Forms
  getForms: async (filters?: { status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await apiRequest('GET', `/api/forms${params.toString() ? '?' + params.toString() : ''}`);
    return response.json();
  },

  getForm: async (id: string) => {
    const response = await apiRequest('GET', `/api/forms/${id}`);
    return response.json();
  },

  createForm: async (form: any) => {
    const response = await apiRequest('POST', '/api/forms', form);
    return response.json();
  },

  updateForm: async (id: string, form: any) => {
    const response = await apiRequest('PUT', `/api/forms/${id}`, form);
    return response.json();
  },

  deleteForm: async (id: string) => {
    const response = await apiRequest('DELETE', `/api/forms/${id}`);
    return response.json();
  },

  // Tasks
  getTaskInbox: async (filters?: { status?: string; assigned_to?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
    
    const response = await apiRequest('GET', `/api/tasks/inbox${params.toString() ? '?' + params.toString() : ''}`);
    return response.json();
  },

  getTask: async (id: string) => {
    const response = await apiRequest('GET', `/api/tasks/${id}`);
    return response.json();
  },

  completeTask: async (id: string, outcome: string, formData: any) => {
    const response = await apiRequest('POST', `/api/tasks/${id}/complete`, {
      outcome,
      form_data: formData,
    });
    return response.json();
  },
};

export { APIError };
