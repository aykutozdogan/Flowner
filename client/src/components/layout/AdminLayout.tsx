import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, useTheme, alpha, Drawer } from '@mui/material';
import { Menu as MenuIcon, AccountCircle, Notifications, Search, LightMode, DarkMode, BusinessCenter, Logout, PushPin, PushPinOutlined } from '@mui/icons-material';
import { useTheme as useCustomTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/devextreme';
import { DevExtremeThemeSelector } from '@/components/ui/devextreme-theme-selector';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: any;
}

function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Masaüstünde başlangıçta açık, mobilde kapalı
    return window.innerWidth >= 768;
  });
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    return localStorage.getItem('admin_sidebar_pinned') === 'true';
  });
  const theme = useTheme();
  const { theme: currentTheme, toggleTheme } = useCustomTheme();
  const { logout } = useAuth();

  useEffect(() => {
    localStorage.setItem('admin_sidebar_pinned', sidebarPinned.toString());
  }, [sidebarPinned]);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Pencere boyutu değiştiğinde sidebar durumunu güncelle
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && !sidebarPinned) {
        setSidebarOpen(true);
      } else if (window.innerWidth < 768 && !sidebarPinned) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          bgcolor: 'white',
          color: theme.palette.text.primary,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="secondary"
              size="small"
              onClick={handleToggleSidebar}
              data-testid="button-toggle-sidebar"
              icon="menu"
            />

            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.primary.main,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Flowner Admin
            </Typography>
          </Box>

          {/* Right side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="secondary"
              size="small"
              icon="search"
              data-testid="button-search"
            />

            <DevExtremeThemeSelector />

            <Button
              variant="secondary"
              size="small"
              onClick={toggleTheme}
              icon={currentTheme === 'light' ? 'sun' : currentTheme === 'dark' ? 'moon' : 'home'}
              title={`Tema: ${currentTheme === 'light' ? 'Açık' : currentTheme === 'dark' ? 'Koyu' : 'Kurumsal'}`}
              data-testid="button-theme-toggle"
            />

            <Button
              variant="secondary"
              size="small"
              icon="bell"
              data-testid="button-notifications"
            />

            <Button
              variant="danger"
              size="small"
              onClick={logout}
              icon="runner"
              title="Çıkış Yap"
              data-testid="button-logout"
            />

            <IconButton 
              sx={{ 
                '&:hover': { 
                  bgcolor: alpha(theme.palette.action.hover, 0.1) 
                } 
              }}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant={sidebarPinned ? "persistent" : "temporary"}
        anchor="left"
        open={sidebarOpen || sidebarPinned}
        onClose={handleCloseSidebar}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            mt: 8, // AppBar height offset
            height: 'calc(100% - 64px)',
          },
        }}
      >
        {/* Pin/Unpin Button */}
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #e0e0e0' }}>
          <Button
            variant="secondary"
            size="small"
            onClick={handlePinSidebar}
            icon={sidebarPinned ? "unpin" : "pin"}
            title={sidebarPinned ? "Menüyü Serbest Bırak" : "Menüyü Sabitle"}
            data-testid="button-pin-sidebar"
          />
        </Box>
        <AdminSidebar onClose={handleCloseSidebar} />
      </Drawer>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          mt: 8, // AppBar height offset - boşluğu kaldırdık
          ml: sidebarPinned ? '280px' : 0,
          bgcolor: '#f8fafc',
          minHeight: 'calc(100vh - 64px)',
          transition: 'margin-left 0.3s ease',
          p: 0 // Padding'i kaldırdık
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export { AdminLayout };
export default AdminLayout;