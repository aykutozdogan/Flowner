import React, { useState, useEffect } from 'react';
import { Drawer, Menu, Button as DxButton, DropDownButton } from 'devextreme-react';
import { useLocation } from 'wouter';
import { DevExtremeThemeSelector } from './DevExtremeThemeSelector';
import 'devextreme/dist/css/dx.light.css';

interface MenuItemData {
  text: string;
  icon?: string;
  path?: string;
  items?: MenuItemData[];
}

interface DropDownButtonItemData {
  text: string;
  icon?: string;
  onClick?: () => void;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface User {
  name: string;
  role: 'admin' | 'user';
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [menuOpened, setMenuOpened] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    return localStorage.getItem('admin_sidebar_pinned') === 'true';
  });
  const [location, navigate] = useLocation();
  
  // Mock user - gerçek uygulamada auth hook'undan gelecek
  const user: User = { name: 'Admin Kullanıcı', role: 'admin' };

  useEffect(() => {
    localStorage.setItem('admin_sidebar_pinned', isPinned.toString());
  }, [isPinned]);

  const menuItems: MenuItemData[] = [
    {
      text: 'Dashboard',
      icon: 'home',
      path: '/dashboard'
    },
    {
      text: 'Form Yönetimi',
      icon: 'edit',
      items: [
        { text: 'Form Builder', path: '/forms/builder' },
        { text: 'Formlar', path: '/forms' }
      ]
    },
    {
      text: 'Workflow Yönetimi',
      icon: 'event',
      items: [
        { text: 'BPMN Designer', path: '/workflows/designer' },
        { text: 'Workflows', path: '/workflows' }
      ]
    },
    {
      text: 'Sistem Yönetimi',
      icon: 'preferences',
      items: [
        { text: 'Tenants', path: '/tenants' },
        { text: 'Kullanıcılar', path: '/users' },
        { text: 'Görevler', path: '/tasks' }
      ]
    },
    {
      text: 'Raporlar',
      icon: 'chart',
      items: [
        { text: 'Analytics', path: '/analytics' },
        { text: 'Engine Stats', path: '/engine-stats' }
      ]
    },
    {
      text: 'Ayarlar',
      icon: 'preferences',
      path: '/settings'
    }
  ];

  const profileMenuItems: DropDownButtonItemData[] = [
    {
      text: 'Profil',
      icon: 'user',
      onClick: () => navigate('/admin/profile')
    },
    {
      text: 'Ayarlar', 
      icon: 'preferences',
      onClick: () => navigate('/admin/settings')
    },
    {
      text: 'Çıkış Yap',
      icon: 'runner',
      onClick: () => {
        // Logout logic
        console.log('Çıkış yapılıyor...');
        navigate('/login');
      }
    }
  ];

  const handleMenuItemClick = (e: any) => {
    const path = e.itemData.path;
    if (path) {
      navigate(path);
    }
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    if (!isPinned) {
      setMenuOpened(true);
    }
  };

  return (
    <div className="admin-layout">
      {/* Header */}
      <div className="admin-header" style={{
        height: '64px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        marginLeft: isPinned ? '280px' : '0',
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Sol taraf */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <DxButton
            icon="menu"
            stylingMode="text"
            onClick={() => setMenuOpened(!menuOpened)}
            hint={menuOpened ? "Menüyü Kapat" : "Menüyü Aç"}
          />
          
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1976d2'
          }}>
            Flowner Admin
          </div>
        </div>

        {/* Sağ taraf */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <DevExtremeThemeSelector />
          
          <DropDownButton
            text={user.name}
            icon="user"
            items={profileMenuItems}
            displayExpr="text"
            keyExpr="text"
            stylingMode="text"
            dropDownOptions={{
              width: 200
            }}
            data-testid="profile-dropdown"
          />
        </div>
      </div>

      {/* Drawer Navigation */}
      <Drawer
        opened={menuOpened}
        openedStateMode={isPinned ? "shrink" : "overlap"}
        position="left"
        template="menu"
        closeOnOutsideClick={!isPinned}
        onOpenedChange={(opened) => {
          if (!isPinned) {
            setMenuOpened(opened);
          }
        }}
        render={() => (
          <div style={{ 
            width: '280px', 
            height: '100vh',
            backgroundColor: '#fafafa',
            borderRight: '1px solid #e0e0e0',
            paddingTop: '64px'
          }}>
            {/* Pin/Unpin Button */}
            <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
              <DxButton
                icon={isPinned ? "unpin" : "pin"}
                text={isPinned ? "Unpin" : "Pin"}
                onClick={togglePin}
                width="100%"
                stylingMode="outlined"
              />
            </div>

            {/* Navigation Menu */}
            <Menu
              items={menuItems}
              displayExpr="text"
              orientation="vertical"
              onItemClick={handleMenuItemClick}
              style={{ 
                padding: '8px',
                backgroundColor: 'transparent'
              }}
            />
          </div>
        )}
      />

      {/* Main Content */}
      <div style={{
        marginTop: '64px',
        marginLeft: isPinned ? '280px' : '0',
        transition: 'margin-left 0.3s ease',
        minHeight: 'calc(100vh - 64px)',
        padding: '0'
      }}>
        {children}
      </div>
    </div>
  );
}