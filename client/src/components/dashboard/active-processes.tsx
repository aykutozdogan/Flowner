import { Box, Card, CardContent, Typography, IconButton, Chip, Avatar } from '@mui/material';
import { 
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  Support as SupportIcon,
} from '@mui/icons-material';

interface Process {
  id: string;
  name: string;
  initiator: string;
  status: 'In Progress' | 'Pending Approval' | 'Assigned';
  updated: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  statusColor: 'success' | 'warning' | 'info';
}

const processes: Process[] = [
  {
    id: '1',
    name: 'Employee Onboarding',
    initiator: 'Initiated by HR Team',
    status: 'In Progress',
    updated: '2h ago',
    icon: DescriptionIcon,
    iconColor: '#1976D2',
    iconBg: '#E3F2FD',
    statusColor: 'success',
  },
  {
    id: '2',
    name: 'Purchase Request',
    initiator: 'Initiated by John Doe',
    status: 'Pending Approval',
    updated: '4h ago',
    icon: ReceiptIcon,
    iconColor: '#F57C00',
    iconBg: '#FFF3E0',
    statusColor: 'warning',
  },
  {
    id: '3',
    name: 'IT Support Ticket',
    initiator: 'Initiated by Sarah Wilson',
    status: 'Assigned',
    updated: '6h ago',
    icon: SupportIcon,
    iconColor: '#1976D2',
    iconBg: '#E3F2FD',
    statusColor: 'info',
  },
];

export default function ActiveProcesses() {
  return (
    <Card
      sx={{
        boxShadow: 1,
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Active Processes
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" data-testid="button-refresh-processes">
            <RefreshIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" data-testid="button-process-options">
            <MoreVertIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Process List */}
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Box>
          {processes.map((process, index) => {
            const Icon = process.icon;
            
            return (
              <Box
                key={process.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderBottom: index < processes.length - 1 ? '1px solid' : 'none',
                  borderColor: 'grey.100',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'grey.50',
                  },
                }}
                data-testid={`process-item-${index}`}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: process.iconBg,
                    }}
                  >
                    <Icon sx={{ fontSize: 20, color: process.iconColor }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {process.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {process.initiator}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={process.status}
                    size="small"
                    color={process.statusColor}
                    variant="outlined"
                    sx={{ 
                      mb: 0.5,
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {process.updated}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
        
        {/* View All Button */}
        <Box sx={{ textAlign: 'center', p: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
          <Typography
            variant="body2"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              cursor: 'pointer',
              '&:hover': { color: 'primary.dark' },
            }}
            data-testid="button-view-all-processes"
          >
            View All Processes
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
