import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';

interface HealthStatus {
  name: string;
  status: 'Operational' | 'Healthy' | 'Minor Issues';
  color: 'success' | 'warning';
  dotColor: string;
}

interface SystemMetric {
  name: string;
  value: number;
  displayValue: string;
  color: string;
}

const healthItems: HealthStatus[] = [
  {
    name: 'API Services',
    status: 'Operational',
    color: 'success',
    dotColor: '#4CAF50',
  },
  {
    name: 'Database',
    status: 'Healthy',
    color: 'success',
    dotColor: '#4CAF50',
  },
  {
    name: 'Message Queue',
    status: 'Minor Issues',
    color: 'warning',
    dotColor: '#FF9800',
  },
  {
    name: 'File Storage',
    status: 'Operational',
    color: 'success',
    dotColor: '#4CAF50',
  },
];

const metrics: SystemMetric[] = [
  {
    name: 'Server Load',
    value: 23,
    displayValue: '23%',
    color: '#4CAF50',
  },
  {
    name: 'Memory Usage',
    value: 67,
    displayValue: '67%',
    color: '#2196F3',
  },
];

export default function SystemHealth() {
  return (
    <Card
      sx={{
        boxShadow: 1,
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, pb: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          System Health
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Health Status Items */}
        <Box sx={{ mb: 4 }}>
          {healthItems.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
              }}
              data-testid={`health-status-${index}`}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: item.dotColor,
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {item.name}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: item.color === 'success' ? 'success.main' : 'warning.main',
                }}
              >
                {item.status}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* System Metrics */}
        <Box sx={{ borderTop: '1px solid', borderColor: 'grey.200', pt: 3 }}>
          {metrics.map((metric, index) => (
            <Box key={index} sx={{ mb: index < metrics.length - 1 ? 3 : 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {metric.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.displayValue}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={metric.value}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: metric.color,
                    borderRadius: 4,
                  },
                }}
                data-testid={`metric-${index}`}
              />
            </Box>
          ))}
        </Box>

        {/* View Status Button */}
        <Box sx={{ textAlign: 'center', pt: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              cursor: 'pointer',
              '&:hover': { color: 'primary.dark' },
            }}
            data-testid="button-view-system-status"
          >
            View Detailed Status
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
