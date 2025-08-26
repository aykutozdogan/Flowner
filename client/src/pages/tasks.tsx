import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseApprovalTask } from '@/components/workflows/ExpenseApprovalTask';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { CheckCircle, Clock, AlertCircle, User, Calendar, FileText } from 'lucide-react';
import { useLocation } from "wouter";

interface Task {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  priority: number;
  process_id: string;
  assignee_role?: string;
  assignee_id?: string;
  due_date?: string;
  created_at: string;
}

export default function TasksPage() {
  const setLocation = useLocation()[1]; // Initialize router
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['/api/engine/tasks'],
    select: (data: any) => data.data || data,
  });

  const completeTaskMutation = useMutation({
    mutationFn: (data: { taskId: string; outcome: string }) =>
      apiRequest(`/api/engine/tasks/${data.taskId}/complete`, {
        method: 'POST',
        body: { outcome: data.outcome },
      }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task completed successfully',
      });
      setSelectedTask(null);
      queryClient.invalidateQueries({ queryKey: ['/api/engine/tasks'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete task',
        variant: 'destructive',
      });
    },
  });

  const assignTaskMutation = useMutation({
    mutationFn: (data: { taskId: string; assigneeId: string }) =>
      apiRequest(`/api/engine/tasks/${data.taskId}/assign`, {
        method: 'POST',
        body: { assigneeId: data.assigneeId },
      }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task assigned successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/engine/tasks'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign task',
        variant: 'destructive',
      });
    },
  });

  const filteredTasks = tasks?.filter(task => {
    switch (activeTab) {
      case 'pending':
        return task.status === 'pending';
      case 'assigned':
        return task.status === 'assigned';
      case 'completed':
        return task.status === 'completed';
      default:
        return true;
    }
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock },
      assigned: { variant: 'default' as const, icon: User },
      completed: { variant: 'secondary' as const, icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 2) return <Badge variant="destructive">High</Badge>;
    if (priority === 1) return <Badge variant="default">Normal</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  const handleCompleteTask = (task: Task, outcome: string) => {
    completeTaskMutation.mutate({ 
      taskId: task.id, 
      outcome 
    });
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

  const pendingCount = tasks?.filter(t => t.status === 'pending').length || 0;
  const assignedCount = tasks?.filter(t => t.status === 'assigned').length || 0;
  const completedCount = tasks?.filter(t => t.status === 'completed').length || 0;

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Task Inbox</h1>
          <p className="text-gray-600 mt-2">Manage your assigned tasks and review work items</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">
              All ({tasks?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="assigned" data-testid="tab-assigned">
              Assigned ({assignedCount})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({completedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-500">
                    {activeTab === 'all' 
                      ? 'No tasks have been assigned to you yet.'
                      : `No ${activeTab} tasks found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card 
                  key={task.id} 
                  data-testid={`task-card-${task.id}`}
                  className="cursor-pointer hover:shadow-lg hover:bg-accent" // Added Tailwind classes for hover effect
                  onClick={() => setLocation(`/tasks/${task.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {task.name}
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </CardTitle>
                        <CardDescription>
                          {task.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {task.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click from navigating
                                  setSelectedTask(task);
                                }}
                                data-testid={`complete-task-${task.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Complete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Complete Task</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="font-medium">{task.name}</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {task.description || 'No description provided'}
                                  </p>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent dialog buttons from triggering card click
                                      handleCompleteTask(task, 'rejected');
                                    }}
                                    disabled={completeTaskMutation.isPending}
                                    data-testid="reject-task"
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent dialog buttons from triggering card click
                                      handleCompleteTask(task, 'approved');
                                    }}
                                    disabled={completeTaskMutation.isPending}
                                    data-testid="approve-task"
                                  >
                                    Approve
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {task.status === 'assigned' && (
                          <Badge variant="outline" className="text-blue-600">
                            <User className="w-3 h-3 mr-1" />
                            In Progress
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Process: {task.process_id.substring(0, 8)}...
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Created {new Date(task.created_at).toLocaleDateString()}
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}