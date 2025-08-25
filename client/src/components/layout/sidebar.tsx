import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Avatar } from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Description as FormIcon,
  AccountTree as WorkflowIcon,
  Inbox as InboxIcon,
  Analytics as AnalyticsIcon,
  People as PeopleIcon,
  IntegrationInstructions as IntegrationsIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  Assignment as TaskIcon,
  PlayCircleOutline as ProcessIcon,
  Monitor as MonitoringIcon,
} from '@mui/icons-material';
import { useLocation } from 'wouter';

interface SidebarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenant: {
      id: string;
      name: string;
      domain: string;
    };
  };
}

const menuSections = [
  {
    title: '',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/' },
    ]
  },
  {
    title: 'DESIGN',
    items: [
      { key: 'form-designer', label: 'Form Designer', icon: FormIcon, path: '/forms' },
      { key: 'workflow-designer', label: 'Workflow Designer', icon: WorkflowIcon, path: '/workflows' },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { key: 'processes', label: 'Processes', icon: ProcessIcon, path: '/processes' },
      { key: 'tasks', label: 'Task Inbox', icon: TaskIcon, path: '/tasks' },
      { key: 'analytics', label: 'Analytics', icon: AnalyticsIcon, path: '/analytics' },
      { key: 'users-roles', label: 'Users & Roles', icon: PeopleIcon, path: '/users' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { key: 'engine-stats', label: 'Engine Stats', icon: MonitoringIcon, path: '/engine/stats' },
      { key: 'integrations', label: 'Integrations', icon: IntegrationsIcon, path: '/integrations' },
      { key: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
    ]
  }
];

export default function Sidebar({ user }: SidebarProps) {
  const [location, setLocation] = useLocation();

  // Mock user data if not provided
  const currentUser = user || {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Tenant Admin',
    tenant: {
      id: '1',
      name: 'Acme Corporation',
      domain: 'acme.com'
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Box
      sx={{
        width: 256,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'grey.200',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        boxShadow: 1,
      }}
    >
      {/* App Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.dark',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WorkflowIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
              Flowner
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentUser.tenant.name}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, px: 1, py: 2 }}>
        {menuSections.map((section, sectionIndex) => (
          <Box key={section.title || sectionIndex} sx={{ mb: section.title ? 2 : 1 }}>
            {section.title && (
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  py: 1,
                  fontWeight: 600,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.75rem',
                }}
              >
                {section.title}
              </Typography>
            )}
            <List sx={{ py: 0.5 }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <ListItem key={item.key} sx={{ py: 0, px: 0.5 }}>
                    <ListItemButton
                      onClick={() => setLocation(item.path)}
                      sx={{
                        borderRadius: 1.5,
                        minHeight: 44,
                        bgcolor: isActive ? 'primary.light' : 'transparent',
                        color: isActive ? 'primary.main' : 'text.primary',
                        '&:hover': {
                          bgcolor: isActive ? 'primary.light' : 'grey.50',
                        },
                      }}
                      data-testid={`nav-${item.key}`}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Icon 
                          sx={{ 
                            fontSize: 20,
                            color: isActive ? 'primary.main' : 'text.secondary'
                          }} 
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 500 : 400,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* User Profile */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.dark',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {getInitials(currentUser.name)}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500, 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2 
              }}
            >
              {currentUser.name}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {currentUser.role}
            </Typography>
          </Box>
          <MoreVertIcon 
            sx={{ 
              fontSize: 20, 
              color: 'text.secondary',
              cursor: 'pointer',
              '&:hover': { color: 'text.primary' }
            }}
            data-testid="button-user-menu"
          />
        </Box>
      </Box>
    </Box>
  );
}
