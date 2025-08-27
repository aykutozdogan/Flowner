import { 
  Home, 
  FileText, 
  GitBranch, 
  Play, 
  Building, 
  Users, 
  Settings,
  BarChart3
} from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { 
    icon: Home, 
    label: 'Dashboard', 
    href: '/admin/dashboard',
    roles: ['tenant_admin', 'designer']
  },
  { 
    icon: FileText, 
    label: 'Forms', 
    href: '/admin/forms',
    roles: ['tenant_admin', 'designer']
  },
  { 
    icon: GitBranch, 
    label: 'Workflows', 
    href: '/admin/workflows',
    roles: ['tenant_admin', 'designer']
  },
  { 
    icon: Play, 
    label: 'Processes', 
    href: '/admin/processes',
    roles: ['tenant_admin', 'designer']
  },
  { 
    icon: Building, 
    label: 'Tenants', 
    href: '/admin/tenants',
    roles: ['tenant_admin']
  },
  { 
    icon: Users, 
    label: 'Users', 
    href: '/admin/users',
    roles: ['tenant_admin']
  },
  { 
    icon: BarChart3, 
    label: 'Analytics', 
    href: '/admin/analytics',
    roles: ['tenant_admin', 'designer']
  },
  { 
    icon: Settings, 
    label: 'Settings', 
    href: '/admin/settings',
    roles: ['tenant_admin']
  }
];

const AdminSidebar = () => {
  const [location] = useLocation();
  const { hasRole } = useAuth();

  const visibleItems = menuItems.filter(item => 
    item.roles.some(role => hasRole(role))
  );

  return (
    <div className="w-64 bg-background border-r border-border h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground">Flowner Admin</h2>
      </div>

      <nav className="px-4 space-y-2">
        {visibleItems.map((item) => {
          const isActive = location === item.href || 
                          (item.href !== '/admin/dashboard' && location.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;