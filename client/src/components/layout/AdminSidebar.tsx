
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
  Collapse,
  Divider,
  Avatar,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Description as FormIcon,
  AccountTree as WorkflowIcon,
  PlayCircleOutline as ProcessIcon,
  Assignment as TaskIcon,
  Business as TenantIcon,
  People as UsersIcon,
  ExpandLess,
  ExpandMore,
  AutoAwesome as AutoAwesomeIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useLocation } from 'wouter';

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  user?: any;
}

interface MenuGroup {
  title: string;
  icon: React.ComponentType<any>;
  items: Array<{
    text: string;
    icon: React.ComponentType<any>;
    path: string;
    badge?: number;
    color?: string;
  }>;
  collapsible?: boolean;
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Dashboard',
    icon: DashboardIcon,
    items: [
      { text: 'Ana Sayfa', icon: DashboardIcon, path: '/admin/dashboard' },
      { text: 'Analytics', icon: AnalyticsIcon, path: '/admin/analytics' }
    ]
  },
  {
    title: 'Tasarım & Geliştirme',
    icon: AutoAwesomeIcon,
    collapsible: true,
    items: [
      { text: 'Formlar', icon: FormIcon, path: '/admin/forms', color: '#4CAF50' },
      { text: 'Form Builder', icon: FormIcon, path: '/admin/forms/builder', color: '#4CAF50' },
      { text: 'Workflows', icon: WorkflowIcon, path: '/admin/workflows', color: '#2196F3' },
      { text: 'BPMN Designer', icon: WorkflowIcon, path: '/admin/workflows/designer', color: '#2196F3' }
    ]
  },
  {
    title: 'İşlem Yönetimi',
    icon: ProcessIcon,
    collapsible: true,
    items: [
      { text: 'Processes', icon: ProcessIcon, path: '/admin/processes', badge: 12 },
      { text: 'Task Inbox', icon: TaskIcon, path: '/admin/tasks', badge: 5, color: '#FF9800' }
    ]
  },
  {
    title: 'Sistem Yönetimi',
    icon: SettingsIcon,
    collapsible: true,
    items: [
      { text: 'Tenants', icon: TenantIcon, path: '/admin/tenants', color: '#9C27B0' },
      { text: 'Users', icon: UsersIcon, path: '/admin/users', color: '#607D8B' }
    ]
  }
];

export default function AdminSidebar({ open, onClose, user }: AdminSidebarProps) {
  const [location, setLocation] = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Dashboard', 'Tasarım & Geliştirme']);
  const theme = useTheme();

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupTitle)
        ? prev.filter(title => title !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    onClose();
  };

  const currentUser = user || {
    name: 'Admin User',
    role: 'Tenant Admin',
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
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
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
                <WorkflowIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                Flowner
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
            label="Admin Panel"
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
          {menuGroups.map((group) => (
            <Box key={group.title} sx={{ mb: 1 }}>
              {group.collapsible ? (
                <ListItemButton
                  onClick={() => toggleGroup(group.title)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    color: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      bgcolor: alpha('rgba(255,255,255,0.1)', 0.1),
                      color: 'white'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <ListItemIcon>
                    <group.icon sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={group.title}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  />
                  {expandedGroups.includes(group.title) ? 
                    <ExpandLess sx={{ color: 'rgba(255,255,255,0.6)' }} /> : 
                    <ExpandMore sx={{ color: 'rgba(255,255,255,0.6)' }} />
                  }
                </ListItemButton>
              ) : (
                <Typography
                  variant="overline"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    pl: 2,
                    mb: 1,
                    display: 'block'
                  }}
                >
                  {group.title}
                </Typography>
              )}

              <Collapse in={!group.collapsible || expandedGroups.includes(group.title)} timeout="auto">
                <List sx={{ pl: group.collapsible ? 2 : 0 }}>
                  {group.items.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <ListItem key={item.text} sx={{ py: 0.25, px: 0 }}>
                        <ListItemButton
                          onClick={() => handleNavigation(item.path)}
                          sx={{
                            borderRadius: 2,
                            minHeight: 48,
                            bgcolor: isActive ? alpha('rgba(255,255,255,0.15)', 0.15) : 'transparent',
                            color: isActive ? 'white' : 'rgba(255,255,255,0.8)',
                            '&:hover': {
                              bgcolor: alpha('rgba(255,255,255,0.1)', 0.1),
                              color: 'white',
                              transform: 'translateX(4px)'
                            },
                            transition: 'all 0.2s ease-in-out',
                            border: isActive ? `1px solid ${alpha('rgba(255,255,255,0.3)', 0.3)}` : 'none'
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <item.icon 
                              sx={{ 
                                fontSize: 20,
                                color: item.color || (isActive ? 'white' : 'rgba(255,255,255,0.7)')
                              }} 
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={item.text}
                            primaryTypographyProps={{
                              fontSize: '0.875rem',
                              fontWeight: isActive ? 600 : 400
                            }}
                          />
                          {item.badge && (
                            <Chip
                              label={item.badge}
                              size="small"
                              sx={{
                                bgcolor: theme.palette.error.main,
                                color: 'white',
                                height: 20,
                                fontSize: '0.75rem',
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          ))}
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
