import React from 'react';
import { useLocation } from 'wouter';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Badge
} from '@mui/material';
import {
  Inbox,
  Assignment,
  CheckCircle,
  Schedule,
  Person,
  Notifications
} from '@mui/icons-material';

const SIDEBAR_WIDTH = 240;

const portalMenuItems = [
  { 
    text: 'Gelen Kutusu', 
    icon: <Inbox />, 
    path: '/portal/inbox',
    badge: 5,
    testId: 'nav-portal-inbox'
  },
  { 
    text: 'Görevlerim', 
    icon: <Assignment />, 
    path: '/portal/tasks',
    testId: 'nav-portal-tasks'
  },
  { 
    text: 'Tamamlanan', 
    icon: <CheckCircle />, 
    path: '/portal/completed',
    testId: 'nav-portal-completed'
  },
  { 
    text: 'Geç Kalanlar', 
    icon: <Schedule />, 
    path: '/portal/overdue',
    badge: 2,
    testId: 'nav-portal-overdue'
  },
  { 
    text: 'Profilim', 
    icon: <Person />, 
    path: '/portal/profile',
    testId: 'nav-portal-profile'
  },
  { 
    text: 'Bildirimler', 
    icon: <Notifications />, 
    path: '/portal/notifications',
    badge: 3,
    testId: 'nav-portal-notifications'
  }
];

export default function PortalSidebar() {
  const [location, setLocation] = useLocation();

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: 'primary.main',
            textAlign: 'center'
          }}
        >
          Kullanıcı Portalı
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ pt: 0 }}>
        {portalMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              selected={location === item.path}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.lighter',
                  borderRight: '3px solid',
                  borderRightColor: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                  '& .MuiListItemText-primary': {
                    color: 'primary.main',
                    fontWeight: 600,
                  }
                }
              }}
              data-testid={item.testId}
            >
              <ListItemIcon>
                {item.badge ? (
                  <Badge 
                    badgeContent={item.badge} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        minWidth: 16,
                        height: 16
                      }
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}