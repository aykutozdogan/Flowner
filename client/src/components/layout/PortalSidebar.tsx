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

interface PortalSidebarProps {
  onClose?: () => void;
}

const PortalSidebar = ({ onClose }: PortalSidebarProps) => {
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
                          (item.href !== '/portal/tasks' && location.startsWith(item.href));

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

export default PortalSidebar;