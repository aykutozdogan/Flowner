import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Play, FileText, Calendar, User } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  version: string;
  created_at: string;
  updated_at: string;
}

export default function WorkflowsPage() {
  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows'],
    select: (data: any) => data.data || data,
  });

  const publishMutation = useMutation({
    mutationFn: (workflowId: string) => 
      apiRequest(`/api/workflows/${workflowId}/publish`, {
        method: 'POST',
        body: { version: '1.0.0' }
      }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Workflow published successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish workflow',
        variant: 'destructive',
      });
    },
  });

  const handlePublish = (workflowId: string, workflowName: string) => {
    if (confirm(`Are you sure you want to publish "${workflowName}"?`)) {
      publishMutation.mutate(workflowId);
    }
  };

  if (isLoading) {
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
            <h1 className="text-3xl font-bold">Workflow Management</h1>
            <p className="text-gray-600 mt-2">Manage and publish your business process workflows</p>
          </div>
        </div>

        <div className="grid gap-4">
          {workflows?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
                <p className="text-gray-500">Create your first workflow to get started.</p>
              </CardContent>
            </Card>
          ) : (
            workflows?.map((workflow) => (
              <Card key={workflow.id} data-testid={`workflow-card-${workflow.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {workflow.name}
                        <Badge 
                          variant={workflow.status === 'published' ? 'default' : 'secondary'}
                          data-testid={`workflow-status-${workflow.id}`}
                        >
                          {workflow.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {workflow.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {workflow.status === 'draft' && (
                        <Button
                          onClick={() => handlePublish(workflow.id, workflow.name)}
                          disabled={publishMutation.isPending}
                          size="sm"
                          data-testid={`publish-workflow-${workflow.id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Publish
                        </Button>
                      )}
                      {workflow.status === 'published' && (
                        <Badge variant="outline" className="text-green-600">
                          <Play className="w-3 h-3 mr-1" />
                          Live
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      Version {workflow.version}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Updated {new Date(workflow.updated_at).toLocaleDateString()}
                    </div>
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