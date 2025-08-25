
import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Divider,
  Avatar,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Assignment as TaskIcon,
  PlayCircleOutline as ProcessIcon,
  Person as ProfileIcon,
  Notifications as NotificationIcon,
  Home as HomeIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useLocation } from 'wouter';

interface PortalSidebarProps {
  open: boolean;
  onClose: () => void;
  user?: any;
}

const menuItems = [
  {
    text: 'Ana Sayfa',
    icon: HomeIcon,
    path: '/portal/dashboard',
    color: '#4CAF50'
  },
  {
    text: 'Task Inbox',
    icon: TaskIcon,
    path: '/portal/tasks',
    badge: 3,
    color: '#FF9800'
  },
  {
    text: 'Süreçlerim',
    icon: ProcessIcon,
    path: '/portal/my-processes',
    badge: 7,
    color: '#2196F3'
  },
  {
    text: 'Bildirimler',
    icon: NotificationIcon,
    path: '/portal/notifications',
    badge: 2,
    color: '#F44336'
  },
  {
    text: 'Profil',
    icon: ProfileIcon,
    path: '/portal/profile',
    color: '#9C27B0'
  }
];

export default function PortalSidebar({ open, onClose, user }: PortalSidebarProps) {
  const [location, setLocation] = useLocation();
  const theme = useTheme();

  const handleNavigation = (path: string) => {
    setLocation(path);
    onClose();
  };

  const currentUser = user || {
    name: 'Portal User',
    role: 'User',
    avatar: null
  };

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          border: 'none',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ 
          p: 3,
          background: alpha('rgba(255,255,255,0.1)', 0.1),
          borderBottom: `1px solid ${alpha('rgba(255,255,255,0.2)', 0.2)}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: alpha('rgba(255,255,255,0.2)', 0.2),
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUpIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                Portal
              </Typography>
            </Box>
            
            <IconButton
              onClick={onClose}
              sx={{ 
                color: 'white',
                '&:hover': {
                  bgcolor: alpha('rgba(255,255,255,0.1)', 0.1)
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Chip
            label="Kullanıcı Paneli"
            size="small"
            sx={{
              bgcolor: alpha('rgba(255,255,255,0.2)', 0.2),
              color: 'white',
              fontWeight: 500,
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
        </Box>

        {/* Navigation */}
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
          <List>
            {menuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <ListItem key={item.text} sx={{ py: 0.5, px: 0 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 2,
                      minHeight: 52,
                      bgcolor: isActive ? alpha('rgba(255,255,255,0.15)', 0.15) : 'transparent',
                      color: isActive ? 'white' : 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        bgcolor: alpha('rgba(255,255,255,0.1)', 0.1),
                        color: 'white',
                        transform: 'translateX(4px)'
                      },
                      transition: 'all 0.2s ease-in-out',
                      border: isActive ? `1px solid ${alpha('rgba(255,255,255,0.3)', 0.3)}` : 'none',
                      mb: 0.5
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 44 }}>
                      {item.badge ? (
                        <Badge 
                          badgeContent={item.badge} 
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.75rem',
                              minWidth: 18,
                              height: 18,
                              bgcolor: theme.palette.error.main
                            }
                          }}
                        >
                          <item.icon sx={{ 
                            fontSize: 22,
                            color: item.color || (isActive ? 'white' : 'rgba(255,255,255,0.7)')
                          }} />
                        </Badge>
                      ) : (
                        <item.icon sx={{ 
                          fontSize: 22,
                          color: item.color || (isActive ? 'white' : 'rgba(255,255,255,0.7)')
                        }} />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.95rem',
                        fontWeight: isActive ? 600 : 400
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        <Divider sx={{ borderColor: alpha('rgba(255,255,255,0.2)', 0.2) }} />

        {/* User Profile */}
        <Box sx={{ 
          p: 3,
          background: alpha('rgba(0,0,0,0.1)', 0.1)
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: alpha('rgba(255,255,255,0.2)', 0.2),
                border: `2px solid ${alpha('rgba(255,255,255,0.3)', 0.3)}`
              }}
            >
              {currentUser.name.charAt(0)}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                {currentUser.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {currentUser.role}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
