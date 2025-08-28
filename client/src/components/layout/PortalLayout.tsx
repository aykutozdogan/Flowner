import React, { useState, useEffect } from 'react';
import { 
  Button as DxButton,
  Drawer as DxDrawer
} from 'devextreme-react';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { ProfileDropdown, ThemeToggle } from '@/components/ui/profile-dropdown';
import PortalSidebar from './PortalSidebar';

interface PortalLayoutProps {
  children: React.ReactNode;
  user?: any;
}

function PortalLayout({ children, user }: PortalLayoutProps) {
  // PERSISTENT SIDEBAR STATE - SAME AS ADMIN
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('portal-sidebar-open');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('portal-sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const { isDark, switchTheme } = useTheme();
  const { logout } = useAuth();

  // SAVE STATE TO LOCALSTORAGE - SAME AS ADMIN
  const handleToggleSidebar = () => {
    if (sidebarOpen) {
      if (sidebarCollapsed) {
        // If collapsed, close completely
        setSidebarOpen(false);
        localStorage.setItem('portal-sidebar-open', 'false');
      } else {
        // If expanded, collapse it
        setSidebarCollapsed(true);
        localStorage.setItem('portal-sidebar-collapsed', 'true');
      }
    } else {
      // If closed, open it
      setSidebarOpen(true);
      setSidebarCollapsed(false);
      localStorage.setItem('portal-sidebar-open', 'true');
      localStorage.setItem('portal-sidebar-collapsed', 'false');
    }
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSidebarCollapsed(false);
    localStorage.setItem('portal-sidebar-open', 'false');
    localStorage.setItem('portal-sidebar-collapsed', 'false');
  };

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '64px',
    backgroundColor: 'var(--bg-primary, #fff)',
    borderBottom: '1px solid var(--border-color, #e0e0e0)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px'
  };

  const mainStyle: React.CSSProperties = {
    marginTop: '64px',
    marginLeft: sidebarOpen ? (sidebarCollapsed ? '64px' : '280px') : '0',
    backgroundColor: 'var(--bg-secondary, #f8fafc)',
    minHeight: 'calc(100vh - 64px)',
    transition: 'margin-left 0.3s ease',
    width: sidebarOpen ? (sidebarCollapsed ? 'calc(100% - 64px)' : 'calc(100% - 280px)') : '100%'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <DxButton
            icon="menu"
            stylingMode="text"
            onClick={handleToggleSidebar}
            hint={sidebarOpen ? "Menüyü Kapat" : "Menüyü Aç"}
          />
          
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--dx-color-primary, #1976d2)'
          }}>
            Flowner Portal
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DxButton
            icon="search"
            stylingMode="text"
            hint="Arama"
          />

          <ThemeToggle 
            isDark={isDark}
            onToggle={switchTheme}
          />

          <DxButton
            icon="bell"
            stylingMode="text"
            hint="Bildirimler"
          />

          <ProfileDropdown userType="portal" />
        </div>
      </div>

      {/* Sidebar - SAME AS ADMIN */}
      {sidebarOpen && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          width: sidebarCollapsed ? '64px' : '280px',
          height: 'calc(100vh - 64px)',
          backgroundColor: 'var(--bg-primary, #fafafa)',
          borderRight: '1px solid var(--border-color, #e0e0e0)',
          zIndex: 1001,
          transition: 'all 0.3s ease',
          overflowY: 'auto'
        }}>
          <PortalSidebar onClose={handleCloseSidebar} isCollapsed={sidebarCollapsed} />
        </div>
      )}

      {/* Main Content */}
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  );
}

export { PortalLayout };
export default PortalLayout;