import { Box, Card, CardContent, Typography } from '@mui/material';
import { Button as DxButton } from 'devextreme-react';
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
          {actions.map((action, index) => (
            <DxButton
              key={index}
              text={action.title}
              onClick={() => setLocation(action.path)}
              width="100%"
              height={44}
              stylingMode={action.primary ? "contained" : "outlined"}
              type={action.primary ? "default" : "normal"}
              elementAttr={{
                'data-testid': `button-quick-action-${index}`,
                className: action.primary ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
