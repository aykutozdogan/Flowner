
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, ArrowLeft, Publish } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { FormBuilder } from '../../components/forms/FormBuilder';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

interface FormDefinition {
  id?: string;
  key: string;
  name: string;
  description?: string;
  version: number;
  status: 'draft' | 'published';
  fields: any[];
  createdAt?: string;
  updatedAt?: string;
}

export const FormBuilderPage = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDefinition>({
    key: '',
    name: '',
    description: '',
    version: 1,
    status: 'draft',
    fields: []
  });
  const [isLoading, setIsLoading] = useState(!!key);
  const [isSaving, setSaving] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [changelogText, setChangelogText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (key) {
      loadForm();
    }
  }, [key]);

  const loadForm = async () => {
    try {
      const response = await api.get(`/forms/${key}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
      } else {
        throw new Error('Form not found');
      }
    } catch (error) {
      console.error('Failed to load form:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form',
        variant: 'destructive'
      });
      navigate('/admin/forms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (isDraft = true) => {
    if (!form.key || !form.name) {
      toast({
        title: 'Validation Error',
        description: 'Form key and name are required',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const endpoint = form.id ? `/forms/${form.id}` : '/forms';
      const method = form.id ? 'PUT' : 'POST';
      
      const payload = {
        ...form,
        status: isDraft ? 'draft' : 'published'
      };

      if (!isDraft && changelogText) {
        payload.changelog = changelogText;
      }

      const response = await api.request(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
        toast({
          title: 'Success',
          description: `Form ${isDraft ? 'saved as draft' : 'published'} successfully`
        });
        
        if (!isDraft) {
          setShowPublishDialog(false);
          setChangelogText('');
        }
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Save failed');
      }
    } catch (error) {
      console.error('Failed to save form:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save form',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => {
    setShowPublishDialog(true);
  };

  const confirmPublish = () => {
    handleSave(false);
  };

  if (isLoading) {
    return <div className="p-6">Loading form...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/admin/forms')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {key ? 'Edit Form' : 'Create Form'}
              </h1>
              {form.status && (
                <p className="text-sm text-muted-foreground">
                  Status: {form.status} | Version: {form.version}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" disabled={isSaving}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handlePublish} disabled={isSaving}>
              <Publish className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Form Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="formKey">Form Key</Label>
                  <Input
                    id="formKey"
                    value={form.key}
                    onChange={(e) => setForm(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="expense_request"
                    disabled={!!form.id}
                  />
                </div>
                <div>
                  <Label htmlFor="formName">Form Name</Label>
                  <Input
                    id="formName"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Expense Request Form"
                  />
                </div>
                <div>
                  <Label htmlFor="formDescription">Description</Label>
                  <Textarea
                    id="formDescription"
                    value={form.description || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Form description..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <FormBuilder
              fields={form.fields}
              onChange={(fields) => setForm(prev => ({ ...prev, fields }))}
            />
          </div>
        </div>
      </div>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Publishing will create version {form.version + 1} and make it available for use in workflows.
            </p>
            <div>
              <Label htmlFor="changelog">Changelog (Optional)</Label>
              <Textarea
                id="changelog"
                value={changelogText}
                onChange={(e) => setChangelogText(e.target.value)}
                placeholder="Describe changes made in this version..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmPublish}>
                Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
