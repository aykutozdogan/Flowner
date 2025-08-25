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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'tenant_admin' | 'designer' | 'approver' | 'user';
  is_active: boolean;
  created_at: string;
  tenant_id: string;
}

const ROLE_LABELS = {
  tenant_admin: 'Kiracı Yöneticisi',
  designer: 'Tasarımcı',
  approver: 'Onaylayıcı',
  user: 'Kullanıcı'
};

const ROLE_COLORS = {
  tenant_admin: 'error',
  designer: 'warning',
  approver: 'info',
  user: 'success'
} as const;

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user' as User['role']
  });

  // Fetch users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['/api/v1/users'],
    select: (data: any) => data.data || data,
  });

  // Create/Update user mutation
  const saveUserMutation = useMutation({
    mutationFn: (userData: any) => {
      return editingUser
        ? apiRequest(`/api/v1/users/${editingUser.id}`, { method: 'PUT', body: userData })
        : apiRequest('/api/v1/users', { method: 'POST', body: userData });
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: editingUser ? 'Kullanıcı güncellendi' : 'Yeni kullanıcı oluşturuldu',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/users'] });
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => {
      return apiRequest(`/api/v1/users/${userId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Kullanıcı silindi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Silme işlemi başarısız',
        variant: 'destructive',
      });
    },
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        name: user.name,
        password: '', // Don't prefill password for security
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        name: '',
        password: '',
        role: 'user'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'user'
    });
  };

  const handleSave = () => {
    if (!formData.email.trim() || !formData.name.trim()) {
      toast({
        title: 'Hata',
        description: 'Email ve ad alanları zorunludur',
        variant: 'destructive',
      });
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      toast({
        title: 'Hata',
        description: 'Yeni kullanıcı için şifre zorunludur',
        variant: 'destructive',
      });
      return;
    }

    const payload: any = { ...formData };
    // Don't send empty password for updates
    if (editingUser && !payload.password?.trim()) {
      delete payload.password;
    }

    saveUserMutation.mutate(payload);
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      deleteUserMutation.mutate(userId);
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
          Kullanıcılar yüklenirken hata oluştu: {(error as any)?.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Kullanıcı Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          data-testid="button-new-user"
        >
          Yeni Kullanıcı
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ad</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Oluşturulma Tarihi</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users?.map((user: User) => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={ROLE_LABELS[user.role]}
                        color={ROLE_COLORS[user.role]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Aktif' : 'Pasif'}
                        color={user.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleOpenDialog(user)}
                        size="small"
                        data-testid={`button-edit-user-${user.id}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(user.id)}
                        size="small"
                        color="error"
                        data-testid={`button-delete-user-${user.id}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(!users || users.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        Henüz kullanıcı bulunmuyor
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
          {editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Oluştur'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ad Soyad"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
            data-testid="input-user-name"
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            sx={{ mb: 2 }}
            data-testid="input-user-email"
          />
          <TextField
            margin="dense"
            label={editingUser ? "Yeni Şifre (boş bırakılabilir)" : "Şifre"}
            type="password"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            sx={{ mb: 2 }}
            data-testid="input-user-password"
          />
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select
              value={formData.role}
              label="Rol"
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
              data-testid="select-user-role"
            >
              <MenuItem value="user">Kullanıcı</MenuItem>
              <MenuItem value="approver">Onaylayıcı</MenuItem>
              <MenuItem value="designer">Tasarımcı</MenuItem>
              <MenuItem value="tenant_admin">Kiracı Yöneticisi</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saveUserMutation.isPending}
            data-testid="button-save-user"
          >
            {saveUserMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}