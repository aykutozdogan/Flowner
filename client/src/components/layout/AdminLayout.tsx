
import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, useTheme, alpha } from '@mui/material';
import { Menu as MenuIcon, AccountCircle, Notifications, Search, LightMode, DarkMode, BusinessCenter, Logout } from '@mui/icons-material';
import { useTheme as useCustomTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: any;
}

function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return localStorage.getItem('admin_sidebar_pinned') === 'true';
  });
  const theme = useTheme();
  const { theme: currentTheme, toggleTheme } = useCustomTheme();
  const { logout } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          bgcolor: 'white',
          color: theme.palette.text.primary,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              edge="start"
              onClick={() => setSidebarOpen(true)}
              sx={{ 
                mr: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <MenuIcon sx={{ color: theme.palette.primary.main }} />
            </IconButton>
            
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
            <IconButton 
              sx={{ 
                '&:hover': { 
                  bgcolor: alpha(theme.palette.action.hover, 0.1) 
                } 
              }}
            >
              <Search />
            </IconButton>
            
            {/* S7 Theme Toggle */}
            <IconButton 
              onClick={toggleTheme}
              sx={{ 
                '&:hover': { 
                  bgcolor: alpha(theme.palette.action.hover, 0.1) 
                },
                color: theme.palette.primary.main
              }}
              title={`Tema: ${currentTheme === 'light' ? 'Açık' : currentTheme === 'dark' ? 'Koyu' : 'Kurumsal'}`}
            >
              {currentTheme === 'light' && <LightMode />}
              {currentTheme === 'dark' && <DarkMode />}
              {currentTheme === 'corporate' && <BusinessCenter />}
            </IconButton>
            
            <IconButton 
              sx={{ 
                '&:hover': { 
                  bgcolor: alpha(theme.palette.action.hover, 0.1) 
                } 
              }}
            >
              <Notifications />
            </IconButton>
            
            <IconButton 
              onClick={logout}
              sx={{ 
                '&:hover': { 
                  bgcolor: alpha(theme.palette.error.main, 0.1) 
                },
                color: theme.palette.error.main
              }}
              title="Çıkış Yap"
              data-testid="button-logout"
            >
              <Logout />
            </IconButton>
            
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

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          mt: 8, // AppBar height offset
          ml: () => {
            const isPinned = localStorage.getItem('admin_sidebar_pinned') === 'true';
            return isPinned && sidebarOpen ? '280px' : 0;
          },
          bgcolor: '#f8fafc',
          minHeight: 'calc(100vh - 64px)',
          transition: 'margin-left 0.3s ease'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export { AdminLayout };
export default AdminLayout;
