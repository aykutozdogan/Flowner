import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Button,
  Box,
  Avatar,
  Chip,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  AccountCircle, 
  Logout, 
  Settings, 
  Language,
  Brightness4,
  Brightness7,
  Business
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

interface AppHeaderProps {
  title?: string;
  showTenantSelector?: boolean;
}

export function AppHeader({ title = 'Flowner', showTenantSelector = true }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [selectedTenant, setSelectedTenant] = useState('demo.local');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
    handleMenuClose();
  };

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'tr' ? 'en' : 'tr');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'tenant_admin': return 'Yönetici';
      case 'designer': return 'Tasarımcı';
      case 'approver': return 'Onaylayıcı';
      case 'user': return 'Kullanıcı';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tenant_admin': return 'error';
      case 'designer': return 'primary';
      case 'approver': return 'warning';
      case 'user': return 'success';
      default: return 'default';
    }
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={1}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar>
        {/* Logo ve Başlık */}
        <Typography 
          variant="h6" 
          noWrap 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            color: 'primary.main'
          }}
          data-testid="header-title"
        >
          {title}
        </Typography>

        {/* Tenant Seçici */}
        {showTenantSelector && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Tenant</InputLabel>
              <Select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                label="Tenant"
                startAdornment={<Business sx={{ mr: 1, fontSize: 16 }} />}
                data-testid="select-tenant"
              >
                <MenuItem value="demo.local">Demo Org</MenuItem>
                <MenuItem value="acme.local">Acme Corp</MenuItem>
                <MenuItem value="example.local">Example Inc</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Dil ve Tema Butonları */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          <IconButton 
            onClick={toggleLanguage}
            color="inherit"
            title={language === 'tr' ? 'English' : 'Türkçe'}
            data-testid="button-language"
          >
            <Language />
          </IconButton>
          
          <IconButton 
            onClick={toggleTheme}
            color="inherit"
            title={themeMode === 'light' ? 'Koyu Tema' : 'Açık Tema'}
            data-testid="button-theme"
          >
            {themeMode === 'light' ? <Brightness4 /> : <Brightness7 />}
          </IconButton>
        </Box>

        {/* Kullanıcı Bilgileri */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user.name}
              </Typography>
              <Chip 
                label={getRoleDisplayName(user.role)}
                size="small"
                color={getRoleColor(user.role) as any}
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            </Box>
            
            <IconButton
              onClick={handleMenuOpen}
              color="inherit"
              data-testid="button-user-menu"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        )}

        {/* Kullanıcı Menüsü */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleMenuClose} data-testid="menu-profile">
            <AccountCircle sx={{ mr: 2 }} />
            Profil
          </MenuItem>
          <MenuItem onClick={handleMenuClose} data-testid="menu-settings">
            <Settings sx={{ mr: 2 }} />
            Ayarlar
          </MenuItem>
          <MenuItem onClick={handleLogout} data-testid="menu-logout">
            <Logout sx={{ mr: 2 }} />
            Çıkış Yap
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}