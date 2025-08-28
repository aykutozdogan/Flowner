import React from 'react';
import { useLocation } from 'wouter';
import { Button as DxButton, DataGrid as DxDataGrid } from 'devextreme-react';
import { Column } from 'devextreme-react/data-grid';
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
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '400', 
          margin: '0 0 16px 0',
          color: '#333'
        }}>
          Kullanıcı Portalı
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: '#666',
          margin: '0'
        }}>
          Size atanan task'ları görüntüleyebilir ve tamamlayabilirsiniz.
        </p>
      </div>

      {/* Stats Cards */}
      {meta && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '24px', 
          marginBottom: '32px' 
        }}>
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: 'white',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Assignment style={{ color: '#1976d2', fontSize: '32px' }} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
                  {meta.counts.pending}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Bekleyen Task'lar
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: 'white',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <CheckCircle style={{ color: '#4caf50', fontSize: '32px' }} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
                  {meta.counts.completed}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Tamamlanan Task'lar
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: 'white',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Schedule style={{ color: '#ff9800', fontSize: '32px' }} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
                  {meta.counts.overdue}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Süresi Geçen Task'lar
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div style={{ 
        padding: '24px',
        backgroundColor: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#333'
        }}>
          Bekleyen Task'larım ({tasks.length})
        </h2>
        
        {isLoading && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
            Yükleniyor...
          </div>
        )}
        
        {tasks.length === 0 && !isLoading && (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <Assignment style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', color: '#666', margin: '0 0 8px 0' }}>
              Bekleyen task'ınız bulunmuyor
            </h3>
            <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
              Yeni task'lar atandığında burada görüntülenecektir.
            </p>
          </div>
        )}
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '16px' 
        }}>
          {tasks.map((task) => (
            <Card variant="outlined" key={task.id}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Assignment style={{ fontSize: '20px', color: '#1976d2' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.name}
                    </h3>
                  </div>
                  
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#666', 
                    marginBottom: '16px', 
                    minHeight: '40px',
                    margin: '0 0 16px 0',
                    lineHeight: '1.4'
                  }}>
                    {task.description}
                  </p>
                  
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
                  </div>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PlayArrow fontSize="small" color="disabled" />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {task.process.name}
                    </Typography>
                  </div>
                  
                  {task.due_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule fontSize="small" color="disabled" />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(task.due_date).toLocaleDateString('tr-TR')}
                      </Typography>
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                  <Button 
                    size="small" 
                    variant="contained"
                    onClick={() => setLocation(`/portal/tasks/${task.id}`)}
                    data-testid={`button-open-task-${task.id}`}
                  >
                    Task'ı Aç
                  </Button>
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}