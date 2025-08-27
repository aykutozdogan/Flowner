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

interface PortalLayoutProps {
  children: React.ReactNode;
}

interface User {
  name: string;
  role: 'admin' | 'user';
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const [menuOpened, setMenuOpened] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    return localStorage.getItem('portal_sidebar_pinned') === 'true';
  });
  const [location, navigate] = useLocation();
  
  // Mock user - gerçek uygulamada auth hook'undan gelecek
  const user: User = { name: 'Portal Kullanıcısı', role: 'user' };

  useEffect(() => {
    localStorage.setItem('portal_sidebar_pinned', isPinned.toString());
  }, [isPinned]);

  const menuItems: MenuItemData[] = [
    {
      text: 'Görevlerim',
      icon: 'tasks',
      path: '/tasks'
    },
    {
      text: 'Süreçlerim',
      icon: 'event',
      path: '/my-processes'
    },
    {
      text: 'Yeni Süreç Başlat',
      icon: 'add',
      path: '/start-process'
    },
    {
      text: 'Formlarım',
      icon: 'edit',
      path: '/forms'
    },
    {
      text: 'Bildirimler',
      icon: 'message',
      path: '/notifications'
    },
    {
      text: 'Profil',
      icon: 'user',
      path: '/profile'
    }
  ];

  const profileMenuItems: DropDownButtonItemData[] = [
    {
      text: 'Profil',
      icon: 'user',
      onClick: () => navigate('/profile')
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
    <div className="portal-layout">
      {/* Header */}
      <div className="portal-header" style={{
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
            color: '#4caf50'
          }}>
            Flowner Portal
          </div>
        </div>

        {/* Sağ taraf */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Görev Badge */}
          <div style={{ position: 'relative' }}>
            <DxButton
              icon="tasks"
              stylingMode="text"
              hint="Bekleyen Görevler"
            />
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: '#f44336',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>3</span>
          </div>

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
                text={isPinned ? "Sabitle" : "Sabitle"}
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