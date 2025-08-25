import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  is_active: boolean;
  created_at: string;
  settings?: any;
  branding?: any;
}

export default function TenantsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    settings: {},
    branding: {}
  });

  // Fetch tenants
  const { data: tenants, isLoading, error } = useQuery({
    queryKey: ['/api/v1/tenants'],
    select: (data: any) => data.data || data,
  });

  // Create/Update tenant mutation
  const saveTenantMutation = useMutation({
    mutationFn: (tenantData: any) => {
      return editingTenant
        ? apiRequest(`/api/v1/tenants/${editingTenant.id}`, { method: 'PUT', body: tenantData })
        : apiRequest('/api/v1/tenants', { method: 'POST', body: tenantData });
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: editingTenant ? 'Kiracı güncellendi' : 'Yeni kiracı oluşturuldu',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/tenants'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'İşlem başarısız',
        variant: 'destructive',
      });
    },
  });

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: (tenantId: string) => {
      return apiRequest(`/api/v1/tenants/${tenantId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Kiracı silindi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/tenants'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Silme işlemi başarısız',
        variant: 'destructive',
      });
    },
  });

  const handleOpenDialog = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        domain: tenant.domain,
        settings: tenant.settings || {},
        branding: tenant.branding || {}
      });
    } else {
      setEditingTenant(null);
      setFormData({
        name: '',
        domain: '',
        settings: {},
        branding: {}
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTenant(null);
    setFormData({
      name: '',
      domain: '',
      settings: {},
      branding: {}
    });
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.domain.trim()) {
      toast({
        title: 'Hata',
        description: 'Kiracı adı ve domain zorunludur',
        variant: 'destructive',
      });
      return;
    }

    saveTenantMutation.mutate(formData);
  };

  const handleDelete = (tenantId: string) => {
    if (window.confirm('Bu kiracıyı silmek istediğinizden emin misiniz?')) {
      deleteTenantMutation.mutate(tenantId);
    }
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
          Kiracılar yüklenirken hata oluştu: {(error as any)?.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Kiracı Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          data-testid="button-new-tenant"
        >
          Yeni Kiracı
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kiracı Adı</TableCell>
                  <TableCell>Domain</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Oluşturulma Tarihi</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenants?.map((tenant: Tenant) => (
                  <TableRow key={tenant.id} data-testid={`tenant-row-${tenant.id}`}>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell>{tenant.domain}</TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.is_active ? 'Aktif' : 'Pasif'}
                        color={tenant.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(tenant.created_at).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleOpenDialog(tenant)}
                        size="small"
                        data-testid={`button-edit-tenant-${tenant.id}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(tenant.id)}
                        size="small"
                        color="error"
                        data-testid={`button-delete-tenant-${tenant.id}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(!tenants || tenants.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        Henüz kiracı bulunmuyor
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTenant ? 'Kiracıyı Düzenle' : 'Yeni Kiracı Oluştur'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Kiracı Adı"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
            data-testid="input-tenant-name"
          />
          <TextField
            margin="dense"
            label="Domain"
            fullWidth
            variant="outlined"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            placeholder="example.com"
            helperText="Kiracının benzersiz domain adı"
            data-testid="input-tenant-domain"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saveTenantMutation.isPending}
            data-testid="button-save-tenant"
          >
            {saveTenantMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}