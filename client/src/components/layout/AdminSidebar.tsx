import React, { useState } from 'react';
import { Home, ChevronDown, ChevronRight, User, CheckSquare, FolderOpen, Route, Play, Building, Users, Settings, BarChart3 } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../../hooks/useAuth';

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  href?: string;
  roles: string[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { 
    icon: Home, 
    label: 'Dashboard', 
    href: '/dashboard',
    roles: ['tenant_admin', 'designer']
  },
  { 
    icon: FolderOpen, 
    label: 'Management',
    roles: ['tenant_admin', 'designer'],
    children: [
      { 
        icon: FolderOpen, 
        label: 'Forms', 
        href: '/forms',
        roles: ['tenant_admin', 'designer']
      },
      { 
        icon: Route, 
        label: 'Workflows', 
        href: '/workflows',
        roles: ['tenant_admin', 'designer']
      },
      { 
        icon: Play, 
        label: 'Processes', 
        href: '/processes',
        roles: ['tenant_admin', 'designer']
      }
    ]
  },
  { 
    icon: Building, 
    label: 'Administration',
    roles: ['tenant_admin'],
    children: [
      { 
        icon: Building, 
        label: 'Tenants', 
        href: '/tenants',
        roles: ['tenant_admin']
      },
      { 
        icon: Users, 
        label: 'Users', 
        href: '/users',
        roles: ['tenant_admin']
      },
      { 
        icon: BarChart3, 
        label: 'Analytics', 
        href: '/analytics',
        roles: ['tenant_admin', 'designer']
      },
      { 
        icon: Settings, 
        label: 'Settings', 
        href: '/settings',
        roles: ['tenant_admin']
      }
    ]
  }
];

interface AdminSidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
}

const AdminSidebar = ({ onClose, isCollapsed = false }: AdminSidebarProps) => {
  const [location] = useLocation();
  const { hasRole } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Management', 'Administration']);

  // FIXED: Prevent rendering multiple sidebars
  if (document.querySelector('.admin-sidebar-rendered')) {
    return null;
  }

  const handleLinkClick = () => {
    // Don't close sidebar on desktop - only close on mobile if needed
    // if (onClose) {
    //   onClose();
    // }
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasVisibleChildren = item.children?.some(child => 
      child.roles.some(role => hasRole(role))
    );
    
    if (!item.roles.some(role => hasRole(role)) && !hasVisibleChildren) {
      return null;
    }

    const isExpanded = expandedItems.includes(item.label);
    const isActive = item.href && (location === item.href || location.startsWith(item.href));

    if (item.children && hasVisibleChildren) {
      return (
        <div key={item.label}>
          <div
            onClick={() => !isCollapsed && toggleExpanded(item.label)}
            className={`
              flex items-center cursor-pointer
              text-gray-700 hover:bg-gray-50 border-l-4 border-transparent
              ${isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-4 py-3'}
              ${level > 0 && !isCollapsed ? 'pl-8' : ''}
            `}
            style={{ borderLeftColor: isExpanded ? '#1976d2' : 'transparent' }}
            title={isCollapsed ? item.label : ''}
          >
            <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
              <item.icon size={18} className="text-gray-500" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </div>
            {!isCollapsed && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
          </div>
          
          {!isCollapsed && isExpanded && (
            <div className="bg-gray-50">
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    if (item.href) {
      return (
        <Link
          key={item.href}
          to={item.href}
          onClick={handleLinkClick}
        >
          <div
            className={`
              flex items-center cursor-pointer
              transition-colors border-l-4
              ${isActive 
                ? 'bg-blue-50 text-blue-700 border-blue-500' 
                : 'text-gray-700 hover:bg-gray-50 border-transparent'
              }
              ${isCollapsed ? 'justify-center py-3 px-2' : 'space-x-3 px-4 py-3'}
              ${level > 0 && !isCollapsed ? 'pl-12' : ''}
            `}
            title={isCollapsed ? item.label : ''}
          >
            <item.icon 
              size={18} 
              className={isActive ? 'text-blue-600' : 'text-gray-500'} 
            />
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </div>
        </Link>
      );
    }

    return null;
  };

  return (
    <div className={`bg-white h-full transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-full'}`}>
      <nav className="py-2">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>
    </div>
  );
};

export default AdminSidebar;