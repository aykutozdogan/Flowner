import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { 
  AddBox as AddBoxIcon,
  DeviceHub as DeviceHubIcon,
  PersonAdd as PersonAddIcon,
  Assessment as AssessmentIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useLocation } from 'wouter';

interface QuickAction {
  title: string;
  icon: React.ElementType;
  path: string;
  primary?: boolean;
}

const actions: QuickAction[] = [
  {
    title: 'Create New Form',
    icon: AddBoxIcon,
    path: '/forms/new',
    primary: true,
  },
  {
    title: 'Design Workflow',
    icon: DeviceHubIcon,
    path: '/workflows/new',
  },
  {
    title: 'Invite Users',
    icon: PersonAddIcon,
    path: '/users/invite',
  },
  {
    title: 'View Reports',
    icon: AssessmentIcon,
    path: '/analytics',
  },
];

export default function QuickActions() {
  const [, setLocation] = useLocation();

  return (
    <Card
      sx={{
        boxShadow: 1,
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Actions
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {actions.map((action, index) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={index}
                fullWidth
                variant="text"
                onClick={() => setLocation(action.path)}
                sx={{
                  justifyContent: 'space-between',
                  p: 1.5,
                  bgcolor: action.primary ? 'primary.light' : 'grey.50',
                  color: action.primary ? 'primary.main' : 'text.primary',
                  '&:hover': {
                    bgcolor: action.primary ? 'primary.light' : 'grey.100',
                  },
                  borderRadius: 2,
                  textTransform: 'none',
                }}
                data-testid={`button-quick-action-${index}`}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Icon 
                    sx={{ 
                      fontSize: 20,
                      color: action.primary ? 'primary.main' : 'text.secondary'
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      color: action.primary ? 'primary.main' : 'text.primary'
                    }}
                  >
                    {action.title}
                  </Typography>
                </Box>
                <ArrowForwardIcon 
                  sx={{ 
                    fontSize: 16,
                    color: action.primary ? 'primary.main' : 'text.secondary'
                  }} 
                />
              </Button>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
