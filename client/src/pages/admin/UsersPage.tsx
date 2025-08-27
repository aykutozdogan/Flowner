
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

interface User {
  id: string;
  email: string;
  displayName?: string;
  roles: string[];
  tenantId: string;
  isActive: boolean;
  createdAt: string;
}

interface UserFormData {
  email: string;
  password: string;
  displayName: string;
  roles: string[];
}

const availableRoles = [
  { id: 'tenant_admin', label: 'Tenant Admin' },
  { id: 'designer', label: 'Designer' },
  { id: 'user', label: 'User' },
  { id: 'approver', label: 'Approver' }
];

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    displayName: '',
    roles: []
  });
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const endpoint = editingUser ? `/users/${editingUser.id}` : '/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const payload = editingUser 
        ? { email: formData.email, displayName: formData.displayName, roles: formData.roles }
        : formData;

      const response = await api.request(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User ${editingUser ? 'updated' : 'created'} successfully`
        });
        setIsDialogOpen(false);
        setEditingUser(null);
        setFormData({ email: '', password: '', displayName: '', roles: [] });
        fetchUsers();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Operation failed');
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save user',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      displayName: user.displayName || '',
      roles: user.roles
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await api.delete(`/users/${userId}`);
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User deleted successfully'
        });
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, roleId]
        : prev.roles.filter(r => r !== roleId)
    }));
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', displayName: '', roles: [] });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage system users and permissions</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : 'Create New User'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              {!editingUser && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              
              <div>
                <Label>Roles</Label>
                <div className="space-y-2 mt-2">
                  {availableRoles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={role.id}
                        checked={formData.roles.includes(role.id)}
                        onCheckedChange={(checked) => handleRoleChange(role.id, checked as boolean)}
                      />
                      <Label htmlFor={role.id} className="text-sm font-normal">
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{user.displayName || user.email}</CardTitle>
                  {user.displayName && (
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  )}
                  <div className="flex gap-1 mt-2">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {availableRoles.find(r => r.id === role)?.label || role}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(user.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Created: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
        
        {users.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No users found. Create your first user to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
