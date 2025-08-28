import { LoadIndicator } from 'devextreme-react';
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
  const { data: analytics, isLoading } = useQuery<{data?: {stats?: any}}>({
    queryKey: ['/api/v1/analytics/dashboard'],
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '24px', 
        marginBottom: '32px' 
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ 
            height: '140px', 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff'
          }}>
            <LoadIndicator visible={true} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    }}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <div
            key={index}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#fff',
              transition: 'box-shadow 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
            data-testid={`stat-card-${index}`}
          >
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#666', 
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    {card.title}
                  </div>
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: '700', 
                    color: '#333' 
                  }}>
                    {card.value}
                  </div>
                </div>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '8px', 
                  backgroundColor: card.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon style={{ fontSize: '24px', color: card.iconColor }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: card.changeType === 'positive' ? '#4caf50' : '#ff9800'
                }}>
                  {card.change}
                </span>
                <span style={{ fontSize: '14px', color: '#666', marginLeft: '4px' }}>
                  {index === 0 && 'from last month'}
                  {index === 1 && 'from last week'}
                  {index === 2 && 'from yesterday'}
                  {index === 3 && 'improvement'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
