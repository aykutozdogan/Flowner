import { 
  TreeView as DxTreeView,
  Button as DxButton
} from 'devextreme-react';
import { 
  LayoutDashboard,
  FileText,
  GitBranch,
  Inbox,
  BarChart3,
  Users,
  Plug,
  Settings,
  MoreVertical,
  ClipboardList,
  Play,
  Monitor
} from 'lucide-react';
import { useLocation } from 'wouter';

interface SidebarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenant: {
      id: string;
      name: string;
      domain: string;
    };
  };
}

const menuSections = [
  {
    title: '',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    ]
  },
  {
    title: 'DESIGN',
    items: [
      { key: 'form-designer', label: 'Form Designer', icon: FileText, path: '/forms' },
      { key: 'workflow-designer', label: 'Workflow Designer', icon: GitBranch, path: '/workflows' },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { key: 'processes', label: 'Processes', icon: Play, path: '/processes' },
      { key: 'tasks', label: 'Task Inbox', icon: ClipboardList, path: '/tasks' },
      { key: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
      { key: 'users-roles', label: 'Users & Roles', icon: Users, path: '/users' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { key: 'engine-stats', label: 'Engine Stats', icon: Monitor, path: '/engine/stats' },
      { key: 'integrations', label: 'Integrations', icon: Plug, path: '/integrations' },
      { key: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ]
  }
];

export default function Sidebar({ user }: SidebarProps) {
  const [location, setLocation] = useLocation();

  // Mock user data if not provided
  const currentUser = user || {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Tenant Admin',
    tenant: {
      id: '1',
      name: 'Acme Corporation',
      domain: 'acme.com'
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleItemClick = (itemPath: string) => {
    setLocation(itemPath);
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary, #ffffff)',
      borderRight: '1px solid var(--border-color, #e0e0e0)',
      height: '100vh',
      width: '280px',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      {/* User Profile Section */}
      <div style={{
        padding: '24px 16px',
        borderBottom: '1px solid var(--border-color, #e0e0e0)',
        backgroundColor: 'var(--bg-secondary, #f8f9fa)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--dx-color-primary, #1976d2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {getInitials(currentUser.name)}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-primary, #1976d2)',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currentUser.name}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--text-secondary, #666)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currentUser.email}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary, #999)',
              marginTop: '2px'
            }}>
              {currentUser.role}
            </div>
          </div>

          <DxButton
            icon="chevrondown"
            stylingMode="text"
            height={32}
            width={32}
            elementAttr={{ 'data-testid': 'button-user-menu' }}
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} style={{ marginBottom: section.title ? '24px' : '16px' }}>
            {section.title && (
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary, #999)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '0 16px',
                marginBottom: '12px'
              }}>
                {section.title}
              </div>
            )}

            <div>
              {section.items.map((item) => {
                const isActive = location === item.path;
                const IconComponent = item.icon;

                return (
                  <div
                    key={item.key}
                    onClick={() => handleItemClick(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      margin: '0 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
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
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f8f9fa)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    data-testid={`sidebar-item-${item.key}`}
                  >
                    <IconComponent 
                      size={20} 
                      style={{ 
                        marginRight: '12px',
                        color: isActive ? 'white' : 'var(--text-secondary, #666)'
                      }} 
                    />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: isActive ? '600' : '500'
                    }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Section */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color, #e0e0e0)',
        backgroundColor: 'var(--bg-secondary, #f8f9fa)'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'var(--text-secondary, #999)',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>{currentUser.tenant.name}</strong>
          </div>
          <div>{currentUser.tenant.domain}</div>
        </div>
      </div>
    </div>
  );
}