
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Save, ArrowLeft, Upload, Settings } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { BpmnDesigner } from '../../components/workflows/BpmnDesigner';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

interface WorkflowDefinition {
  id?: string;
  key: string;
  name: string;
  description?: string;
  version: number;
  status: 'draft' | 'published';
  bpmnXml: string;
  jsonDsl?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface FormOption {
  key: string;
  name: string;
  version: number;
}

const BpmnDesignerPage = () => {
  const [location, navigate] = useLocation();
  // Extract key from route path /admin/workflows/:key
  const key = location.split('/').pop();
  const [workflow, setWorkflow] = useState<WorkflowDefinition>({
    key: '',
    name: '',
    description: '',
    version: 1,
    status: 'draft',
    bpmnXml: ''
  });
  const [forms, setForms] = useState<FormOption[]>([]);
  const [isLoading, setIsLoading] = useState(!!key);
  const [isSaving, setSaving] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [changelogText, setChangelogText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (key) {
      loadWorkflow();
    }
    loadForms();
  }, [key]);

  const loadWorkflow = async () => {
    try {
      const response = await api.get(`/workflows/${key}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflow(data.workflow);
      } else {
        throw new Error('Workflow not found');
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflow',
        variant: 'destructive'
      });
      navigate('/admin/workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const loadForms = async () => {
    try {
      const response = await api.get('/forms?status=published');
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms || []);
      }
    } catch (error) {
      console.error('Failed to load forms:', error);
    }
  };

  const handleSave = async (isDraft = true) => {
    if (!workflow.key || !workflow.name || !workflow.bpmnXml) {
      toast({
        title: 'Validation Error',
        description: 'Workflow key, name, and BPMN diagram are required',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const endpoint = workflow.id ? `/workflows/${workflow.id}` : '/workflows';
      const method = workflow.id ? 'PUT' : 'POST';
      
      const payload = {
        ...workflow,
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
        setWorkflow(data.workflow);
        toast({
          title: 'Success',
          description: `Workflow ${isDraft ? 'saved as draft' : 'published'} successfully`
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
      console.error('Failed to save workflow:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save workflow',
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
    return <div className="p-6">Loading workflow...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/admin/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workflows
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {key ? 'Edit Workflow' : 'Create Workflow'}
              </h1>
              {workflow.status && (
                <p className="text-sm text-muted-foreground">
                  Status: {workflow.status} | Version: {workflow.version}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handlePublish} disabled={isSaving}>
              <Upload className="h-4 w-4 mr-2" />
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
                <CardTitle>Workflow Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workflowKey">Workflow Key</Label>
                  <Input
                    id="workflowKey"
                    value={workflow.key}
                    onChange={(e) => setWorkflow(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="expense_approval"
                    disabled={!!workflow.id}
                  />
                </div>
                <div>
                  <Label htmlFor="workflowName">Workflow Name</Label>
                  <Input
                    id="workflowName"
                    value={workflow.name}
                    onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Expense Approval Process"
                  />
                </div>
                <div>
                  <Label htmlFor="workflowDescription">Description</Label>
                  <Textarea
                    id="workflowDescription"
                    value={workflow.description || ''}
                    onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Workflow description..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Available Forms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {forms.map((form) => (
                    <div key={`${form.key}_${form.version}`} className="p-2 border rounded text-sm">
                      <div className="font-medium">{form.name}</div>
                      <div className="text-muted-foreground">
                        Key: {form.key} | v{form.version}
                      </div>
                    </div>
                  ))}
                  {forms.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No published forms available. Create and publish forms first.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <BpmnDesigner
              value={workflow.bpmnXml}
              onChange={(bpmnXml, jsonDsl) => 
                setWorkflow(prev => ({ ...prev, bpmnXml, jsonDsl }))
              }
              forms={forms}
            />
          </div>
        </div>
      </div>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Publishing will create version {workflow.version + 1} and make it available for process instantiation.
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

export default BpmnDesignerPage;
