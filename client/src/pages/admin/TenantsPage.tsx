
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface TenantFormData {
  name: string;
  domain: string;
  description: string;
}

export const TenantsPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    domain: '',
    description: ''
  });
  const { toast } = useToast();

  const fetchTenants = async () => {
    try {
      const response = await api.get('/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tenants',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const endpoint = editingTenant ? `/tenants/${editingTenant.id}` : '/tenants';
      const method = editingTenant ? 'PUT' : 'POST';
      
      const response = await api.request(endpoint, {
        method,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Tenant ${editingTenant ? 'updated' : 'created'} successfully`
        });
        setIsDialogOpen(false);
        setEditingTenant(null);
        setFormData({ name: '', domain: '', description: '' });
        fetchTenants();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Operation failed');
      }
    } catch (error) {
      console.error('Failed to save tenant:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save tenant',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      domain: tenant.domain,
      description: tenant.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;

    try {
      const response = await api.delete(`/tenants/${tenantId}`);
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Tenant deleted successfully'
        });
        fetchTenants();
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tenant',
        variant: 'destructive'
      });
    }
  };

  const openCreateDialog = () => {
    setEditingTenant(null);
    setFormData({ name: '', domain: '', description: '' });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Loading tenants...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">Manage tenant organizations</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTenant ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{tenant.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{tenant.domain}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(tenant)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(tenant.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {tenant.description && (
              <CardContent>
                <p className="text-sm">{tenant.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(tenant.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
        
        {tenants.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No tenants found. Create your first tenant to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
