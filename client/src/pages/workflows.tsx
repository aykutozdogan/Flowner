import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Alert
} from '@mui/material';
import {
  Button as DxButton,
  DataGrid as DxDataGrid
} from 'devextreme-react';
import { Column } from 'devextreme-react/data-grid';

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
        <DxButton
          text="Yeni İş Akışı"
          icon="plus"
          stylingMode="contained"
          onClick={handleNewWorkflow}
          height={40}
          width={140}
          elementAttr={{
            'data-testid': 'button-new-workflow'
          }}
        />
      </Box>

      <Card>
        <CardContent sx={{ p: 2 }}>
          <DxDataGrid
            dataSource={workflows || []}
            keyExpr="id"
            showBorders
            showRowLines
            showColumnLines
            height={600}
            wordWrapEnabled
            allowColumnResizing
            columnAutoWidth
            hoverStateEnabled
            noDataText="Henüz iş akışı bulunmuyor"
          >
            <Column
              dataField="name"
              caption="İş Akışı Adı"
              width="200"
            />
            <Column
              dataField="description"
              caption="Açıklama"
              cellRender={(data) => (
                <span style={{ color: '#666' }}>
                  {data.value || '-'}
                </span>
              )}
            />
            <Column
              dataField="version"
              caption="Versiyon"
              width="100"
              alignment="center"
              cellRender={(data) => `v${data.value}`}
            />
            <Column
              dataField="status"
              caption="Durum"
              width="120"
              alignment="center"
              cellRender={(data) => {
                const status = data.value;
                const colors = {
                  draft: '#ff9800',
                  published: '#4caf50',
                  archived: '#757575'
                };
                return (
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: colors[status] || '#757575',
                      color: 'white'
                    }}
                  >
                    {STATUS_LABELS[status] || status}
                  </span>
                );
              }}
            />
            <Column
              dataField="updated_at"
              caption="Son Güncelleme"
              width="140"
              alignment="center"
              cellRender={(data) => (
                <span style={{ color: '#666' }}>
                  {new Date(data.value).toLocaleDateString('tr-TR')}
                </span>
              )}
            />
            <Column
              caption="İşlemler"
              width="100"
              alignment="center"
              cellRender={(data) => (
                <DxButton
                  icon="edit"
                  stylingMode="text"
                  onClick={() => handleEditWorkflow(data.data.key, data.data.id)}
                  hint="Düzenle"
                  height={32}
                  width={32}
                  elementAttr={{
                    'data-testid': `button-edit-workflow-${data.data.id}`
                  }}
                />
              )}
            />
          </DxDataGrid>
        </CardContent>
      </Card>
    </Box>
  );
}