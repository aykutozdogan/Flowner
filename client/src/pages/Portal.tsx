import React from 'react';
import { useLocation } from 'wouter';
import { Button as DxButton } from 'devextreme-react';
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
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: 'white',
              overflow: 'hidden'
            }} key={task.id}>
                <div style={{ padding: '16px' }}>
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
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: getStatusColor(task.status) === 'warning' ? '#fff3cd' : '#d4edda',
                      color: getStatusColor(task.status) === 'warning' ? '#856404' : '#155724'
                    }}>
                      {task.status}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: getPriorityColor(task.priority) === 'error' ? '#f8d7da' : '#cce7ff',
                      color: getPriorityColor(task.priority) === 'error' ? '#721c24' : '#004085'
                    }}>
                      {task.priority}
                    </span>
                    {task.form && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: '#e3f2fd',
                        color: '#1565c0'
                      }}
                      data-testid={`chip-form-${task.id}`}>
                        Form
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <PlayArrow style={{ fontSize: '16px', color: '#999' }} />
                    <span style={{ fontSize: '14px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.process.name}
                    </span>
                  </div>
                  
                  {task.due_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Schedule style={{ fontSize: '16px', color: '#999' }} />
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {new Date(task.due_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                  <DxButton 
                    text="Task'ı Aç"
                    type="default"
                    stylingMode="contained"
                    onClick={() => setLocation(`/portal/tasks/${task.id}`)}
                    elementAttr={{ 'data-testid': `button-open-task-${task.id}` }}
                  />
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}