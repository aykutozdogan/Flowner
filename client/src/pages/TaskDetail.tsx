import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Box, Paper, Typography, CircularProgress, Alert, Chip, Card, CardContent } from '@mui/material';
import { ArrowBack, Assignment, Schedule, Person } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { FormRenderer } from '../components/FormRenderer';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';

interface TaskData {
  id: string;
  name: string;
  description: string;
  processId: string;
  status: string;
  priority: number;
  assigneeRole: string;
  formId: string;
  formKey: string;
  formVersion: number;
  formData: Record<string, any>;
  outcome: string;
  dueDate: string;
  createdAt: string;
  completedAt: string;
}

interface FormPreviewData {
  form: any;
  version: any;
  schema_json: any;
  ui_schema_json: any;
}

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Task detayı sorgusu
  const { data: taskResponse, isLoading: taskLoading, error: taskError } = useQuery({
    queryKey: ['/api/v1/tasks', id],
    enabled: !!id
  });

  const task: TaskData = (taskResponse as any)?.data;

  // Form schema sorgusu
  const { data: formResponse, isLoading: formLoading, error: formError } = useQuery({
    queryKey: ['/api/v1/forms', task?.formKey, 'preview', task?.formVersion],
    queryFn: () => {
      if (!task?.formKey || !task?.formVersion) return null;
      return fetch(`/api/v1/forms/${task.formKey}/preview?version=${task.formVersion}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-Id': localStorage.getItem('tenantId') || ''
        }
      }).then(res => res.json());
    },
    enabled: !!task?.formKey && !!task?.formVersion
  });

  const formPreview: FormPreviewData = formResponse?.data;

  // Task complete mutation
  const completeTaskMutation = useMutation({
    mutationFn: (data: { outcome: string; formData: Record<string, any> }) => {
      return apiRequest(`/api/engine/tasks/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          outcome: data.outcome,
          formData: data.formData
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setLocation('/portal/tasks');
    }
  });

  useEffect(() => {
    if (task?.formData) {
      setFormData(task.formData);
    }
  }, [task]);

  const handleFormSubmit = (data: Record<string, any>) => {
    const { _outcome, ...formData } = data;
    completeTaskMutation.mutate({
      outcome: _outcome || 'completed',
      formData
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return 'Normal';
      case 2: return 'Yüksek';
      case 3: return 'Acil';
      default: return 'Düşük';
    }
  };

  if (taskLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (taskError || !task) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Task yüklenirken hata oluştu. Lütfen tekrar deneyin.
        </Alert>
      </Box>
    );
  }

  if (task.status === 'completed') {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => setLocation('/portal/tasks')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">Task Detayı</Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Bu task zaten tamamlanmış.
        </Alert>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{task.name}</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {task.description}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                label={task.status} 
                color={getStatusColor(task.status)}
                size="small"
              />
              <Chip 
                label={getPriorityText(task.priority)} 
                variant="outlined"
                size="small"
              />
            </Box>
            
            {task.outcome && (
              <Typography variant="body2">
                <strong>Sonuç:</strong> {task.outcome}
              </Typography>
            )}
            
            {task.completedAt && (
              <Typography variant="body2" color="text.secondary">
                <strong>Tamamlanma:</strong> {new Date(task.completedAt).toLocaleString('tr-TR')}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => setLocation('/portal/tasks')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Task Detayı</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Assignment color="primary" />
            <Typography variant="h6">{task.name}</Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            {task.description}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={task.status} 
                color={getStatusColor(task.status)}
                size="small"
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Öncelik:
              </Typography>
              <Chip 
                label={getPriorityText(task.priority)} 
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person fontSize="small" color="disabled" />
              <Typography variant="body2" color="text.secondary">
                {task.assigneeRole}
              </Typography>
            </Box>
            
            {task.dueDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule fontSize="small" color="disabled" />
                <Typography variant="body2" color="text.secondary">
                  {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Form Renderer */}
      {task.formKey && task.formVersion && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Task Formu
          </Typography>
          
          {formLoading && (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          )}
          
          {formError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Form yüklenirken hata oluştu.
            </Alert>
          )}
          
          {formPreview && (
            <FormRenderer
              schema={formPreview.schema_json}
              uiSchema={formPreview.ui_schema_json}
              value={formData}
              onSubmit={handleFormSubmit}
              outcomes={[
                { value: 'approve', label: 'Onayla' },
                { value: 'reject', label: 'Reddet' }
              ]}
              disabled={completeTaskMutation.isPending}
            />
          )}
          
          {completeTaskMutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Task tamamlanırken hata oluştu. Lütfen tekrar deneyin.
            </Alert>
          )}
        </Paper>
      )}
      
      {!task.formKey && (
        <Paper sx={{ p: 3 }}>
          <Alert severity="info">
            Bu task için form bulunmuyor.
          </Alert>
        </Paper>
      )}
    </Box>
  );
}