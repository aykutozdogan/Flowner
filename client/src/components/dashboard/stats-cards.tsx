import { Box, Card, CardContent, Typography } from '@mui/material';
import { 
  PlayCircleOutline as ProcessIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

export default function StatsCards() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard'],
    enabled: !!localStorage.getItem('access_token'),
  });

  const stats = analytics?.data?.stats || {};

  const cards: StatCard[] = [
    {
      title: 'Active Processes',
      value: stats?.activeProcesses || '247',
      change: '+12%',
      changeType: 'positive',
      icon: ProcessIcon,
      iconColor: '#1976D2',
      iconBg: '#E3F2FD',
    },
    {
      title: 'Pending Tasks',
      value: stats?.pendingTasks || '89',
      change: '-5%',
      changeType: 'negative',
      icon: ScheduleIcon,
      iconColor: '#F57C00',
      iconBg: '#FFF3E0',
    },
    {
      title: 'Completed Today',
      value: stats?.completedToday || '34',
      change: '+8%',
      changeType: 'positive',
      icon: CheckCircleIcon,
      iconColor: '#388E3C',
      iconBg: '#E8F5E8',
    },
    {
      title: 'Average Duration',
      value: stats?.avgDuration || '2.4h',
      change: '-15min',
      changeType: 'positive',
      icon: TimerIcon,
      iconColor: '#1976D2',
      iconBg: '#E3F2FD',
    },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} sx={{ height: 140 }}>
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">Loading...</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 4
      }}
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <Card
            key={index}
            sx={{
              boxShadow: 1,
              border: '1px solid',
              borderColor: 'grey.200',
              '&:hover': {
                boxShadow: 2,
              },
            }}
            data-testid={`stat-card-${index}`}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: card.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon sx={{ fontSize: 24, color: card.iconColor }} />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: card.changeType === 'positive' ? 'success.main' : 'warning.main',
                  }}
                >
                  {card.change}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  {index === 0 && 'from last month'}
                  {index === 1 && 'from last week'}
                  {index === 2 && 'from yesterday'}
                  {index === 3 && 'improvement'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
