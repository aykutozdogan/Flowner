import React, { useState, useEffect } from 'react';
import { 
  Button as DxButton,
  Drawer as DxDrawer
} from 'devextreme-react';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { ProfileDropdown, ThemeToggle } from '@/components/ui/profile-dropdown';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: any;
}

function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start expanded
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Collapsed state
  const { isDark, switchTheme } = useTheme();
  const { logout } = useAuth();

  const handleToggleSidebar = () => {
    if (sidebarOpen) {
      // If open, just collapse it
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      // If closed, open it
      setSidebarOpen(true);
      setSidebarCollapsed(false);
    }
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSidebarCollapsed(false);
  };

  // No backdrop click needed for desktop usage

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '64px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px'
  };

  // REMOVED: Fixed sidebar style causing duplicate - AdminSidebar handles its own styling

  const mainStyle: React.CSSProperties = {
    marginTop: '64px',
    marginLeft: sidebarOpen ? (sidebarCollapsed ? '64px' : '280px') : '0',
    backgroundColor: '#f8fafc',
    minHeight: 'calc(100vh - 64px)',
    transition: 'margin-left 0.3s ease',
    width: sidebarOpen ? (sidebarCollapsed ? 'calc(100% - 64px)' : 'calc(100% - 280px)') : '100%'
  };

  // Backdrop removed - desktop sidebar should stay persistent

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
            color: isDark ? '#ffffff' : '#1976d2'
          }}>
            Flowner Admin
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

          <ProfileDropdown userType="admin" />
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          width: sidebarCollapsed ? '64px' : '280px',
          height: 'calc(100vh - 64px)',
          backgroundColor: '#fafafa',
          borderRight: '1px solid #e0e0e0',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}>
        <div style={{
          padding: sidebarCollapsed ? '16px 8px' : '16px',
          display: 'flex',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fff'
        }}>
          {!sidebarCollapsed && (
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1976d2'
            }}>
              Admin Menü
            </div>
          )}
        </div>
          <AdminSidebar onClose={handleCloseSidebar} isCollapsed={sidebarCollapsed} />
        </div>
      )}

      {/* No backdrop - sidebar should stay open on desktop */}

      {/* Main Content */}
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  );
}

export { AdminLayout };
export default AdminLayout;