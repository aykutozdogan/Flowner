import React, { useState, useEffect } from 'react';
import { Button as DxButton } from 'devextreme-react';
import { useAuth } from '@/hooks/useAuth';
import { useSimpleTheme } from '@/hooks/use-simple-theme';
import { ProfileDropdown, ThemeToggle } from '@/components/ui/profile-dropdown';
import PortalSidebar from './PortalSidebar';

interface PortalLayoutProps {
  children: React.ReactNode;
  user?: any;
}

function PortalLayout({ children, user }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    return localStorage.getItem('portal_sidebar_pinned') === 'true';
  });
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useSimpleTheme();

  useEffect(() => {
    localStorage.setItem('portal_sidebar_pinned', sidebarPinned.toString());
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
    transition: 'margin-left 0.3s ease',
    marginLeft: sidebarPinned ? '280px' : '0',
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
            Flowner Portal
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DxButton
            icon="folder"
            stylingMode="text"
            hint="Görevlerim"
          />

          <div style={{ position: 'relative' }}>
            <DxButton
              icon="bell"
              stylingMode="text"
              hint="Bildirimler"
            />
            <div style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: '#f44336',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              3
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <DxButton
              icon="message"
              stylingMode="text"
              hint="Mesajlar"
            />
            <div style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: '#f44336',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              2
            </div>
          </div>

          <ThemeToggle 
            isDark={isDark}
            onToggle={toggleTheme}
          />

          <ProfileDropdown userType="portal" />
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
            Portal Menü
          </div>
          <DxButton
            icon={sidebarPinned ? "unpin" : "pin"}
            stylingMode="text"
            onClick={handlePinSidebar}
            hint={sidebarPinned ? "Menüyü Serbest Bırak" : "Menüyü Sabitle"}
          />
        </div>
        <PortalSidebar onClose={handleCloseSidebar} />
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

export { PortalLayout };
export default PortalLayout;