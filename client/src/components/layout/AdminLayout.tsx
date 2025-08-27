import React, { useState, useEffect } from 'react';
import { 
  Button as DxButton,
  Drawer as DxDrawer
} from 'devextreme-react';
import { useTheme as useCustomTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { DevExtremeThemeSelector } from '@/components/ui/devextreme-theme-selector';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: any;
}

function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    return localStorage.getItem('admin_sidebar_pinned') === 'true';
  });
  const { theme: currentTheme, toggleTheme } = useCustomTheme();
  const { logout } = useAuth();

  useEffect(() => {
    localStorage.setItem('admin_sidebar_pinned', sidebarPinned.toString());
  }, [sidebarPinned]);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (sidebarPinned) {
      setSidebarOpen(true);
    }
  }, [sidebarPinned]);

  const handlePinSidebar = () => {
    setSidebarPinned(!sidebarPinned);
    if (!sidebarPinned) {
      setSidebarOpen(true);
    }
  };

  const handleCloseSidebar = () => {
    if (!sidebarPinned) {
      setSidebarOpen(false);
    }
  };

  const handleBackdropClick = () => {
    if (!sidebarPinned) {
      setSidebarOpen(false);
    }
  };

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

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: '64px',
    left: 0,
    width: '280px',
    height: 'calc(100vh - 64px)',
    backgroundColor: '#fafafa',
    borderRight: '1px solid #e0e0e0',
    zIndex: sidebarPinned ? 999 : 1001,
    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease'
  };

  const mainStyle: React.CSSProperties = {
    marginTop: '64px',
    marginLeft: sidebarPinned ? '280px' : '0',
    backgroundColor: '#f8fafc',
    minHeight: 'calc(100vh - 64px)',
    transition: 'margin-left 0.3s ease',
    width: sidebarPinned ? 'calc(100% - 280px)' : '100%'
  };

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998
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
            color: '#1976d2'
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

          <DevExtremeThemeSelector />

          <DxButton
            icon={currentTheme === 'light' ? 'sun' : currentTheme === 'dark' ? 'moon' : 'home'}
            stylingMode="text"
            onClick={toggleTheme}
            hint={`Tema: ${currentTheme === 'light' ? 'Açık' : currentTheme === 'dark' ? 'Koyu' : 'Kurumsal'}`}
          />

          <DxButton
            icon="bell"
            stylingMode="text"
            hint="Bildirimler"
          />

          <DxButton
            icon="runner"
            stylingMode="text"
            onClick={logout}
            hint="Çıkış Yap"
          />
        </div>
      </div>

      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fff'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#333'
          }}>
            Admin Menü
          </div>
          <DxButton
            icon={sidebarPinned ? "unpin" : "pin"}
            stylingMode="text"
            onClick={handlePinSidebar}
            hint={sidebarPinned ? "Menüyü Serbest Bırak" : "Menüyü Sabitle"}
          />
        </div>
        <AdminSidebar onClose={handleCloseSidebar} />
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && !sidebarPinned && (
        <div style={backdropStyle} onClick={handleBackdropClick} />
      )}

      {/* Main Content */}
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  );
}

export { AdminLayout };
export default AdminLayout;