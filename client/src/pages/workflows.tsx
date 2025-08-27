import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';

interface Workflow {
  id: string;
  key?: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  version: string;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS = {
  draft: 'Taslak',
  published: 'Yayınlandı',
  archived: 'Arşivlendi'
};

const STATUS_COLORS = {
  draft: 'warning',
  published: 'success',
  archived: 'default'
} as const;

export default function WorkflowsPage() {
  const [, setLocation] = useLocation();

  // Fetch workflows
  const { data: workflows, isLoading, error } = useQuery({
    queryKey: ['/api/v1/workflows'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('tenant_domain') || 'demo.local';
      
      const response = await fetch('/api/v1/workflows', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Id': tenantId,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || data;
    },
  });

  const handleNewWorkflow = () => {
    setLocation('/bpmn-designer');
  };

  const handleEditWorkflow = (workflowKey: string | undefined, workflowId?: string) => {
    if (!workflowKey && !workflowId) {
      setLocation('/bpmn-designer');
      return;
    }
    const key = workflowKey || workflowId;
    setLocation(`/bpmn-designer/${key}`);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          İş akışları yüklenirken hata oluştu: {(error as any)?.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          İş Akışı Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewWorkflow}
          data-testid="button-new-workflow"
        >
          Yeni İş Akışı
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>İş Akışı Adı</TableCell>
                  <TableCell>Açıklama</TableCell>
                  <TableCell>Versiyon</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Son Güncelleme</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workflows?.map((workflow: Workflow) => (
                  <TableRow key={workflow.id} data-testid={`workflow-row-${workflow.id}`}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {workflow.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {workflow.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>v{workflow.version}</TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[workflow.status]}
                        color={STATUS_COLORS[workflow.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(workflow.updated_at).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEditWorkflow(workflow.key, workflow.id)}
                        size="small"
                        title="Düzenle"
                        data-testid={`button-edit-workflow-${workflow.id}`}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(!workflows || workflows.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        Henüz iş akışı bulunmuyor
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}