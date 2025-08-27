import { 
  Home, 
  FileText, 
  GitBranch, 
  Play, 
  Building, 
  Users, 
  Settings,
  BarChart3,
  FormInput,
  Workflow,
  FolderOpen,
  Route
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
    icon: FolderOpen, 
    label: 'Forms', 
    href: '/admin/forms',
    roles: ['tenant_admin', 'designer']
  },
  { 
    icon: Route, 
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

interface AdminSidebarProps {
  onClose?: () => void;
}

const AdminSidebar = ({ onClose }: AdminSidebarProps) => {
  const [location] = useLocation();
  const { hasRole } = useAuth();

  const visibleItems = menuItems.filter(item => 
    item.roles.some(role => hasRole(role))
  );

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-full bg-background h-full">
      <nav className="px-4 space-y-2 mt-4">
        {visibleItems.map((item) => {
          const isActive = location === item.href || 
                          (item.href !== '/admin/dashboard' && location.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleLinkClick}
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