import { User } from './types';

export type Permission = 
  | 'admin.tenants.read'
  | 'admin.tenants.write'
  | 'admin.users.read'
  | 'admin.users.write'
  | 'admin.forms.read'
  | 'admin.forms.write'
  | 'admin.workflows.read'
  | 'admin.workflows.write'
  | 'admin.processes.read'
  | 'admin.processes.write'
  | 'portal.tasks.read'
  | 'portal.tasks.write'
  | 'portal.processes.read';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  tenant_admin: [
    'admin.tenants.read',
    'admin.tenants.write',
    'admin.users.read',
    'admin.users.write',
    'admin.forms.read',
    'admin.forms.write',
    'admin.workflows.read',
    'admin.workflows.write',
    'admin.processes.read',
    'admin.processes.write',
    'portal.tasks.read',
    'portal.tasks.write',
    'portal.processes.read',
  ],
  designer: [
    'admin.forms.read',
    'admin.forms.write',
    'admin.workflows.read',
    'admin.workflows.write',
    'admin.processes.read',
    'portal.tasks.read',
    'portal.tasks.write',
    'portal.processes.read',
  ],
  approver: [
    'portal.tasks.read',
    'portal.tasks.write',
    'portal.processes.read',
  ],
  user: [
    'portal.tasks.read',
    'portal.processes.read',
  ],
};

export class RBACService {
  static hasPermission(user: User | null, permission: Permission): boolean {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  }

  static canAccessAdmin(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'tenant_admin' || user.role === 'designer';
  }

  static canAccessPortal(user: User | null): boolean {
    if (!user) return false;
    return ['tenant_admin', 'designer', 'approver', 'user'].includes(user.role);
  }

  static getAccessibleRoutes(user: User | null): string[] {
    if (!user) return [];

    const routes: string[] = [];

    // Admin routes
    if (this.canAccessAdmin(user)) {
      routes.push('/admin/dashboard');
      
      if (this.hasPermission(user, 'admin.forms.read')) {
        routes.push('/admin/forms');
      }
      
      if (this.hasPermission(user, 'admin.workflows.read')) {
        routes.push('/admin/workflows');
      }
      
      if (this.hasPermission(user, 'admin.processes.read')) {
        routes.push('/admin/processes');
      }
      
      if (this.hasPermission(user, 'admin.tenants.read')) {
        routes.push('/admin/tenants');
      }
      
      if (this.hasPermission(user, 'admin.users.read')) {
        routes.push('/admin/users');
      }
    }

    // Portal routes
    if (this.canAccessPortal(user)) {
      if (this.hasPermission(user, 'portal.tasks.read')) {
        routes.push('/portal/tasks');
      }
      
      if (this.hasPermission(user, 'portal.processes.read')) {
        routes.push('/portal/my-processes');
      }
      
      routes.push('/portal/profile');
    }

    return routes;
  }
}