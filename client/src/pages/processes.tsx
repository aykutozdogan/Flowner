import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Plus, Play, StopCircle, Calendar, User, Clock } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  status: 'published';
}

interface Process {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'cancelled';
  workflow_id: string;
  started_at: string;
  completed_at?: string;
}

export default function ProcessesPage() {
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [processName, setProcessName] = useState('');

  const { data: workflows, isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows', { status: 'published' }],
    select: (data: any) => data.data || data,
  });

  const { data: processes, isLoading: processesLoading } = useQuery<Process[]>({
    queryKey: ['/api/processes'],
    select: (data: any) => data.data || data,
  });

  const startProcessMutation = useMutation({
    mutationFn: (data: { workflowId: string; name: string }) =>
      apiRequest('/api/processes', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Process started successfully',
      });
      setIsStartDialogOpen(false);
      setProcessName('');
      setSelectedWorkflowId('');
      queryClient.invalidateQueries({ queryKey: ['/api/processes'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start process',
        variant: 'destructive',
      });
    },
  });

  const cancelProcessMutation = useMutation({
    mutationFn: (processId: string) =>
      apiRequest(`/api/processes/${processId}/cancel`, {
        method: 'POST',
      }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Process cancelled successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/processes'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel process',
        variant: 'destructive',
      });
    },
  });

  const handleStartProcess = () => {
    if (!selectedWorkflowId || !processName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a workflow and provide a process name',
        variant: 'destructive',
      });
      return;
    }

    startProcessMutation.mutate({
      workflowId: selectedWorkflowId,
      name: processName.trim(),
    });
  };

  const handleCancelProcess = (processId: string, processName: string) => {
    if (confirm(`Are you sure you want to cancel "${processName}"?`)) {
      cancelProcessMutation.mutate(processId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      running: { variant: 'default' as const, icon: Play },
      completed: { variant: 'secondary' as const, icon: Clock },
      cancelled: { variant: 'destructive' as const, icon: StopCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.running;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (processesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Process Instances</h1>
            <p className="text-gray-600 mt-2">Monitor and manage running business processes</p>
          </div>
          <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="start-process-button">
                <Plus className="w-4 h-4 mr-2" />
                Start Process
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Process</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workflow">Workflow</Label>
                  <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                    <SelectTrigger data-testid="workflow-select">
                      <SelectValue placeholder="Select a published workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows?.map((workflow) => (
                        <SelectItem key={workflow.id} value={workflow.id}>
                          {workflow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="processName">Process Name</Label>
                  <Input
                    id="processName"
                    value={processName}
                    onChange={(e) => setProcessName(e.target.value)}
                    placeholder="Enter process instance name"
                    data-testid="process-name-input"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsStartDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStartProcess}
                    disabled={startProcessMutation.isPending}
                    data-testid="start-process-confirm"
                  >
                    Start Process
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {processes?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Play className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No processes found</h3>
                <p className="text-gray-500">Start your first process to get started.</p>
              </CardContent>
            </Card>
          ) : (
            processes?.map((process) => (
              <Card key={process.id} data-testid={`process-card-${process.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {process.name}
                        {getStatusBadge(process.status)}
                      </CardTitle>
                      <CardDescription>
                        Process ID: {process.id}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {process.status === 'running' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelProcess(process.id, process.name)}
                          disabled={cancelProcessMutation.isPending}
                          data-testid={`cancel-process-${process.id}`}
                        >
                          <StopCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Started {new Date(process.started_at).toLocaleDateString()}
                    </div>
                    {process.completed_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Completed {new Date(process.completed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}