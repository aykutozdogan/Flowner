import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Search, GitBranch, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface Workflow {
  id: string;
  key: string;
  name: string;
  description?: string;
  version: number;
  status: 'published';
}

interface StartProcessForm {
  name: string;
  description?: string;
  variables: Record<string, any>;
}

export default function PortalStartProcess() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<StartProcessForm>({
    name: '',
    description: '',
    variables: {}
  });
  const { toast } = useToast();

  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/v1/workflows', { status: 'published' }],
    select: (data: any) => data.data || [],
  });

  const startProcessMutation = useMutation({
    mutationFn: (data: { workflowId: string; name: string; description?: string; variables?: any }) =>
      apiRequest('/api/v1/processes', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Process started successfully',
      });
      setIsDialogOpen(false);
      setSelectedWorkflow(null);
      setFormData({ name: '', description: '', variables: {} });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start process',
        variant: 'destructive',
      });
    },
  });

  const filteredWorkflows = workflows?.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleStartProcess = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setFormData({
      name: `${workflow.name} - ${new Date().toLocaleDateString()}`,
      description: '',
      variables: {}
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow) return;

    startProcessMutation.mutate({
      workflowId: selectedWorkflow.id,
      name: formData.name,
      description: formData.description,
      variables: formData.variables
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Start New Process</h1>
          <p className="text-gray-600 mt-2">Choose a workflow to start a new business process</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Workflows Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading workflows...</div>
        ) : filteredWorkflows.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <GitBranch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows available</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No workflows match your search criteria.' : 'No published workflows are available to start.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <GitBranch className="h-8 w-8 text-blue-500" />
                    <Badge variant="outline">v{workflow.version}</Badge>
                  </div>
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  {workflow.description && (
                    <p className="text-sm text-gray-600">{workflow.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Key:</span> {workflow.key}
                    </div>
                    
                    <Button 
                      onClick={() => handleStartProcess(workflow)}
                      className="w-full"
                      data-testid={`start-workflow-${workflow.key}`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Process
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Start Process Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Start New Process</DialogTitle>
            </DialogHeader>
            
            {selectedWorkflow && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">{selectedWorkflow.name}</span>
                  </div>
                  {selectedWorkflow.description && (
                    <p className="text-sm text-blue-700 mt-1">{selectedWorkflow.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processName">Process Name *</Label>
                  <Input
                    id="processName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter process name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processDescription">Description</Label>
                  <Textarea
                    id="processDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Initial Variables</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Initial variables can be set during the process execution. 
                      You can configure them in the first task form.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={startProcessMutation.isPending || !formData.name.trim()}
                  >
                    {startProcessMutation.isPending ? 'Starting...' : 'Start Process'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}