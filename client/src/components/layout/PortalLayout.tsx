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
  // SIMPLIFIED SIDEBAR STATE - ALWAYS OPEN, ONLY TOGGLE COLLAPSE  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('portal-sidebar-collapsed');
    return saved === 'true' ? true : false; // Simple string comparison
  });
  const sidebarOpen = true; // Always open in desktop mode
  const { isDark, switchTheme } = useTheme();
  const { logout } = useAuth();

  // SIMPLE TOGGLE - ONLY EXPAND/COLLAPSE (DevExtreme Style)
  const handleToggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    localStorage.setItem('portal-sidebar-collapsed', newCollapsed.toString());
    console.log('🔧 Portal Sidebar toggled:', newCollapsed ? 'COLLAPSED' : 'EXPANDED');
  };

  const handleCloseSidebar = () => {
    // Not used in desktop mode - sidebar always visible
    console.log('🔧 Portal close sidebar called (desktop mode: no action)');
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