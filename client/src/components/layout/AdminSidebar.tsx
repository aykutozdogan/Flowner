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
}

const AdminSidebar = ({ onClose }: AdminSidebarProps) => {
  const [location] = useLocation();
  const { hasRole } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Management', 'Administration']);

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
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
            onClick={() => toggleExpanded(item.label)}
            className={`
              flex items-center justify-between px-4 py-3 cursor-pointer
              text-gray-700 hover:bg-gray-50 border-l-4 border-transparent
              ${level > 0 ? 'pl-8' : ''}
            `}
            style={{ borderLeftColor: isExpanded ? '#1976d2' : 'transparent' }}
          >
            <div className="flex items-center space-x-3">
              <item.icon size={18} className="text-gray-500" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {isExpanded && (
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
              flex items-center space-x-3 px-4 py-3 cursor-pointer
              transition-colors border-l-4
              ${isActive 
                ? 'bg-blue-50 text-blue-700 border-blue-500' 
                : 'text-gray-700 hover:bg-gray-50 border-transparent'
              }
              ${level > 0 ? 'pl-12' : ''}
            `}
          >
            <item.icon 
              size={18} 
              className={isActive ? 'text-blue-600' : 'text-gray-500'} 
            />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        </Link>
      );
    }

    return null;
  };

  return (
    <div className="w-full bg-white h-full">
      <nav className="py-2">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>
    </div>
  );
};

export default AdminSidebar;