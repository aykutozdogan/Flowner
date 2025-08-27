import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, useTheme, alpha, Badge } from '@mui/material';
import { Menu as MenuIcon, AccountCircle, Notifications, Assignment, Logout } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import PortalSidebar from './PortalSidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DevExtremeThemeSelector } from '@/components/ui/devextreme-theme-selector';

interface PortalLayoutProps {
  children: React.ReactNode;
  user?: any;
}

function PortalLayout({ children, user }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const { logout } = useAuth();

  // Dummy logout handler to satisfy the Button component's onClick prop
  const handleLogout = () => {
    logout();
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
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.2),
                }
              }}
            >
              <MenuIcon sx={{ color: theme.palette.secondary.main }} />
            </IconButton>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.secondary.main,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Flowner Portal
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
              <Badge badgeContent={3} color="error">
                <Assignment />
              </Badge>
            </IconButton>

            <IconButton
              sx={{
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.1)
                }
              }}
            >
              <Badge badgeContent={2} color="error">
                <Notifications />
              </Badge>
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
      <PortalSidebar />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8, // AppBar height offset
          bgcolor: '#f8fafc',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export { PortalLayout };
export default PortalLayout;