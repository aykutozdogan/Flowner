
import { 
  Inbox, 
  FileText, 
  User,
  CheckSquare,
  Play,
  Bell
} from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { 
    icon: Inbox, 
    label: 'Tasks', 
    href: '/portal/tasks',
    roles: ['user', 'approver']
  },
  { 
    icon: Play, 
    label: 'Start Process', 
    href: '/portal/start-process',
    roles: ['user', 'approver']
  },
  { 
    icon: FileText, 
    label: 'My Processes', 
    href: '/portal/my-processes',
    roles: ['user', 'approver']
  },
  { 
    icon: FileText, 
    label: 'Forms', 
    href: '/portal/forms',
    roles: ['user', 'approver']
  },
  { 
    icon: Bell, 
    label: 'Notifications', 
    href: '/portal/notifications',
    roles: ['user', 'approver']
  },
  { 
    icon: User, 
    label: 'Profile', 
    href: '/portal/profile',
    roles: ['user', 'approver']
  }
];

const PortalSidebar = () => {
  const [location] = useLocation();
  const { hasRole } = useAuth();

  const visibleItems = menuItems.filter(item => 
    item.roles.some(role => hasRole(role))
  );

  return (
    <div className="w-64 bg-background border-r border-border h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground">Flowner Portal</h2>
      </div>
      
      <nav className="px-4 space-y-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/portal/tasks' && location.pathname.startsWith(item.href));
          
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

export default PortalSidebar;
