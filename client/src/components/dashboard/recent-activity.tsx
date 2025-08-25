import { Box, Card, CardContent, Typography, Button, Avatar } from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  RocketLaunch as RocketLaunchIcon,
} from '@mui/icons-material';

interface ActivityItem {
  id: string;
  type: 'completed' | 'updated' | 'pending' | 'published';
  user: string;
  action: string;
  target: string;
  timestamp: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

const activities: ActivityItem[] = [
  {
    id: '1',
    type: 'completed',
    user: 'Sarah Johnson',
    action: 'completed',
    target: 'Employee Onboarding',
    timestamp: '2 minutes ago',
    icon: CheckCircleIcon,
    iconColor: '#388E3C',
    iconBg: '#E8F5E8',
  },
  {
    id: '2',
    type: 'updated',
    user: 'Mike Chen',
    action: 'updated',
    target: 'Purchase Request Form',
    timestamp: '15 minutes ago',
    icon: EditIcon,
    iconColor: '#1976D2',
    iconBg: '#E3F2FD',
  },
  {
    id: '3',
    type: 'pending',
    user: 'Budget Approval',
    action: 'is pending approval from',
    target: 'Finance Team',
    timestamp: '1 hour ago',
    icon: ScheduleIcon,
    iconColor: '#F57C00',
    iconBg: '#FFF3E0',
  },
  {
    id: '4',
    type: 'published',
    user: 'Admin',
    action: 'published new workflow',
    target: 'IT Support Ticket',
    timestamp: '3 hours ago',
    icon: RocketLaunchIcon,
    iconColor: '#7B1FA2',
    iconBg: '#F3E5F5',
  },
];

export default function RecentActivity() {
  return (
    <Card
      sx={{
        boxShadow: 1,
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent Activity
          </Typography>
          <Button
            variant="text"
            size="small"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              textTransform: 'none',
              '&:hover': { color: 'primary.dark' },
            }}
            data-testid="button-view-all-activity"
          >
            View All
          </Button>
        </Box>

        {/* Activity List */}
        <Box sx={{ px: 3, pb: 3 }}>
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            
            return (
              <Box
                key={activity.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  pb: 2,
                  borderBottom: index < activities.length - 1 ? '1px solid' : 'none',
                  borderColor: 'grey.100',
                  mb: index < activities.length - 1 ? 2 : 0,
                }}
                data-testid={`activity-item-${index}`}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: activity.iconBg,
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ fontSize: 16, color: activity.iconColor }} />
                </Avatar>
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                    <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>
                      {activity.user}
                    </Typography>
                    {' '}{activity.action}{' '}
                    <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>
                      {activity.target}
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activity.timestamp}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
