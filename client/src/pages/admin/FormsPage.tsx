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
  Edit as EditIcon,
  Visibility as ViewIcon,
  Publish as PublishIcon
} from '@mui/icons-material';

interface Form {
  id: string;
  key: string;
  name: string;
  description: string;
  latest_version: number;
  status: 'draft' | 'published' | 'archived';
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

export default function FormsPage() {
  const [, setLocation] = useLocation();

  // Fetch forms
  const { data: forms, isLoading, error } = useQuery({
    queryKey: ['/api/v1/forms'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('tenant_domain') || 'demo.local';
      
      const response = await fetch('/api/v1/forms', {
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

  const handleNewForm = () => {
    setLocation('/form-builder');
  };

  const handleEditForm = (formKey: string) => {
    setLocation(`/form-builder/${formKey}`);
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
          Formlar yüklenirken hata oluştu: {(error as any)?.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Form Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewForm}
          data-testid="button-new-form"
        >
          Yeni Form
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Form Adı</TableCell>
                  <TableCell>Anahtar</TableCell>
                  <TableCell>Açıklama</TableCell>
                  <TableCell>Versiyon</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Son Güncelleme</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {forms?.map((form: Form) => (
                  <TableRow key={form.id} data-testid={`form-row-${form.key}`}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {form.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {form.key}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {form.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>v{form.latest_version}</TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[form.status]}
                        color={STATUS_COLORS[form.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(form.updated_at).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEditForm(form.key)}
                        size="small"
                        title="Düzenle"
                        data-testid={`button-edit-form-${form.key}`}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(!forms || forms.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        Henüz form bulunmuyor
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