import React from 'react';
import { useLocation } from 'wouter';
import { Box, Paper, Typography, Button, Card, CardContent, CardActions, Chip, Grid } from '@mui/material';
import { Assignment, PlayArrow, Schedule, Person, CheckCircle } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

interface Task {
  id: string;
  name: string;
  description: string;
  process: {
    id: string;
    name: string;
  };
  form: {
    id: string;
    key: string;
    version: number;
    name: string;
  } | null;
  priority: string;
  status: string;
  due_date: string;
  created_at: string;
}

export function Portal() {
  const [, setLocation] = useLocation();

  // Kullanıcının task'larını getir
  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ['/api/tasks/inbox'],
    queryFn: () => {
      return fetch('/api/tasks/inbox?status=pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Id': localStorage.getItem('tenantId') || ''
        }
      }).then(res => res.json());
    }
  });

  const tasks: Task[] = tasksResponse?.data || [];
  const meta = tasksResponse?.meta;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'normal': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Kullanıcı Portalı
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Size atanan task'ları görüntüleyebilir ve tamamlayabilirsiniz.
        </Typography>
      </Box>

      {/* Stats Cards */}
      {meta && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Assignment color="primary" />
                  <Box>
                    <Typography variant="h6">{meta.counts.pending}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bekleyen Task'lar
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle color="success" />
                  <Box>
                    <Typography variant="h6">{meta.counts.completed}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tamamlanan Task'lar
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Schedule color="warning" />
                  <Box>
                    <Typography variant="h6">{meta.counts.overdue}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Süresi Geçen Task'lar
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tasks List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bekleyen Task'larım ({tasks.length})
        </Typography>
        
        {isLoading && (
          <Typography>Yükleniyor...</Typography>
        )}
        
        {tasks.length === 0 && !isLoading && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Bekleyen task'ınız bulunmuyor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Yeni task'lar atandığında burada görüntülenecektir.
            </Typography>
          </Box>
        )}
        
        <Grid container spacing={2}>
          {tasks.map((task) => (
            <Grid item xs={12} md={6} lg={4} key={task.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Assignment fontSize="small" color="primary" />
                    <Typography variant="h6" component="h3" noWrap>
                      {task.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '40px' }}>
                    {task.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={task.status} 
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                    <Chip 
                      label={task.priority} 
                      color={getPriorityColor(task.priority)}
                      variant="outlined"
                      size="small"
                    />
                    {task.form && (
                      <Chip 
                        label="Form" 
                        color="info"
                        variant="outlined"
                        size="small"
                        data-testid={`chip-form-${task.id}`}
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PlayArrow fontSize="small" color="disabled" />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {task.process.name}
                    </Typography>
                  </Box>
                  
                  {task.due_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule fontSize="small" color="disabled" />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(task.due_date).toLocaleDateString('tr-TR')}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <CardActions>
                  <Button 
                    size="small" 
                    variant="contained"
                    onClick={() => setLocation(`/portal/tasks/${task.id}`)}
                    data-testid={`button-open-task-${task.id}`}
                  >
                    Task'ı Aç
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}