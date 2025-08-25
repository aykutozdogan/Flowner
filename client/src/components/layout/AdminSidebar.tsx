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
  Divider
} from '@mui/material';
import {
  Dashboard,
  AccountTree,
  Assignment,
  PlayArrow,
  BarChart,
  Description,
  Settings
} from '@mui/icons-material';

const SIDEBAR_WIDTH = 240;

const adminMenuItems = [
  { 
    text: 'Dashboard', 
    icon: <Dashboard />, 
    path: '/admin/dashboard',
    testId: 'nav-admin-dashboard'
  },
  { 
    text: 'İş Akışları', 
    icon: <AccountTree />, 
    path: '/admin/workflows',
    testId: 'nav-admin-workflows'
  },
  { 
    text: 'Formlar', 
    icon: <Description />, 
    path: '/admin/forms',
    testId: 'nav-admin-forms'
  },
  { 
    text: 'Süreçler', 
    icon: <PlayArrow />, 
    path: '/admin/processes',
    testId: 'nav-admin-processes'
  },
  { 
    text: 'Görevler', 
    icon: <Assignment />, 
    path: '/admin/tasks',
    testId: 'nav-admin-tasks'
  },
  { 
    text: 'Analitik', 
    icon: <BarChart />, 
    path: '/admin/analytics',
    testId: 'nav-admin-analytics'
  },
  { 
    text: 'Ayarlar', 
    icon: <Settings />, 
    path: '/admin/settings',
    testId: 'nav-admin-settings'
  }
];

export default function AdminSidebar() {
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
          Admin Panel
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ pt: 0 }}>
        {adminMenuItems.map((item) => (
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
                {item.icon}
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