import { 
  Inbox, 
  FileText, 
  User,
  CheckSquare,
  Play,
  Bell
} from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { 
    icon: Inbox, 
    label: 'Tasks', 
    href: '/inbox',
    roles: ['user', 'approver']
  },
  { 
    icon: Play, 
    label: 'Start Process', 
    href: '/start-process',
    roles: ['user', 'approver']
  },
  { 
    icon: FileText, 
    label: 'My Processes', 
    href: '/my-processes',
    roles: ['user', 'approver']
  },
  { 
    icon: FileText, 
    label: 'Forms', 
    href: '/forms',
    roles: ['user', 'approver']
  },
  { 
    icon: Bell, 
    label: 'Notifications', 
    href: '/notifications',
    roles: ['user', 'approver']
  },
  { 
    icon: User, 
    label: 'Profile', 
    href: '/profile',
    roles: ['user', 'approver']
  }
];

interface PortalSidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
}

const PortalSidebar = ({ onClose, isCollapsed = false }: PortalSidebarProps) => {
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
    <div 
      style={{
        backgroundColor: 'var(--bg-primary, #ffffff)',
        color: 'var(--text-primary, #333333)',
        height: '100%',
        width: '100%'
      }}
    >
      <nav style={{ padding: '16px 0' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-secondary, #999)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          padding: '0 16px',
          marginBottom: '12px'
        }}>
          {!isCollapsed && 'PORTAL MENU'}
        </div>
        
        {visibleItems.map((item) => {
          const isActive = location === item.href || 
                          (item.href !== '/inbox' && location.startsWith(item.href));

          return (
            <div
              key={item.href}
              onClick={() => {
                handleLinkClick();
                if (item.href) {
                  window.location.href = item.href;
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: isCollapsed ? '12px 8px' : '12px 16px',
                margin: '0 8px',
                borderRadius: '8px',
                backgroundColor: isActive 
                  ? 'var(--dx-color-primary, #1976d2)' 
                  : 'transparent',
                color: isActive 
                  ? 'white' 
                  : 'var(--text-primary, #333)',
                transition: 'all 0.2s ease',
                borderLeft: isActive ? '4px solid rgba(255,255,255,0.3)' : '4px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-color, rgba(25, 118, 210, 0.1))';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon 
                size={18} 
                style={{ 
                  marginRight: isCollapsed ? '0' : '12px',
                  color: isActive ? 'white' : 'var(--text-secondary, #666)'
                }} 
              />
              {!isCollapsed && (
                <span style={{
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '500'
                }}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default PortalSidebar;