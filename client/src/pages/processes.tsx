
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Button as DxButton,
  TextBox as DxTextBox,
  SelectBox as DxSelectBox
} from 'devextreme-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Plus, Play, StopCircle, Calendar, User, Clock, Eye, RefreshCw, FileText } from 'lucide-react';

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
  variables?: Record<string, any>;
}

interface FormDataEntry {
  id: string;
  form_key: string;
  form_version: number;
  data_json: Record<string, any>;
  created_at: string;
  created_by: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  details: Record<string, any>;
  created_at: string;
  user_id?: string;
}

export default function ProcessesPage() {
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [processName, setProcessName] = useState('');
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: workflows, isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows', { status: 'published' }],
    select: (data: any) => data.data || data,
  });

  const { data: processes, isLoading: processesLoading } = useQuery<Process[]>({
    queryKey: ['/api/processes'],
    select: (data: any) => data.data || data,
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
  });

  // Process detail queries
  const { data: processDetail } = useQuery({
    queryKey: ['/api/processes', selectedProcessId],
    enabled: !!selectedProcessId,
    select: (data: any) => data.data || data,
  });

  const { data: formSubmissions } = useQuery<FormDataEntry[]>({
    queryKey: ['/api/forms/data', selectedProcessId],
    queryFn: async () => {
      const response = await apiRequest(`/api/forms/data?processId=${selectedProcessId}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!selectedProcessId,
  });

  const { data: auditLogs } = useQuery<AuditLogEntry[]>({
    queryKey: ['/api/audit', selectedProcessId],
    queryFn: async () => {
      const response = await apiRequest(`/api/audit?entityType=process&entityId=${selectedProcessId}`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!selectedProcessId,
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

  const handleViewProcess = (processId: string) => {
    setSelectedProcessId(processId);
    setIsDetailDrawerOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      running: { variant: 'default' as const, icon: Play, text: 'Çalışıyor' },
      completed: { variant: 'secondary' as const, icon: Clock, text: 'Tamamlandı' },
      cancelled: { variant: 'destructive' as const, icon: StopCircle, text: 'İptal Edildi' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.running;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    return `${Math.floor(diff / 86400)}g`;
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
            <h1 className="text-3xl font-bold">Süreç İzleme</h1>
            <p className="text-gray-600 mt-2">İş süreçlerini izleyin ve yönetin</p>
          </div>
          <div className="flex gap-2">
            <DxButton
              text="Otomatik Yenile"
              icon="refresh"
              stylingMode="outlined"
              onClick={() => setAutoRefresh(!autoRefresh)}
              height={36}
              width={140}
              elementAttr={{
                className: autoRefresh ? 'bg-green-50 border-green-200' : ''
              }}
            />
            <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
              <DialogTrigger asChild>
                <DxButton
                  text="Süreç Başlat"
                  icon="plus"
                  stylingMode="contained"
                  height={36}
                  width={130}
                  elementAttr={{
                    'data-testid': 'start-process-button'
                  }}
                />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Process</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workflow">Workflow</Label>
                    <DxSelectBox
                      dataSource={workflows || []}
                      displayExpr="name"
                      valueExpr="id"
                      value={selectedWorkflowId}
                      onValueChanged={(e) => setSelectedWorkflowId(e.value)}
                      placeholder="Select a published workflow"
                      searchEnabled={false}
                      showClearButton={true}
                      width="100%"
                      height={40}
                      elementAttr={{
                        'data-testid': 'workflow-select'
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="processName">Process Name</Label>
                    <DxTextBox
                      value={processName}
                      onValueChanged={(e) => setProcessName(e.value)}
                      placeholder="Enter process instance name"
                      width="100%"
                      height={40}
                      elementAttr={{
                        id: 'processName',
                        'data-testid': 'process-name-input'
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <DxButton
                      text="Cancel"
                      stylingMode="outlined"
                      onClick={() => setIsStartDialogOpen(false)}
                      width={100}
                      height={36}
                    />
                    <DxButton
                      text="Start Process"
                      stylingMode="contained"
                      onClick={handleStartProcess}
                      disabled={startProcessMutation.isPending}
                      width={120}
                      height={36}
                      elementAttr={{
                        'data-testid': 'start-process-confirm'
                      }}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProcess(process.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Detay
                      </Button>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Başlangıç: {new Date(process.started_at).toLocaleDateString('tr-TR')}
                      </div>
                      {process.completed_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Bitiş: {new Date(process.completed_at).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                      <div className="text-xs">
                        Süre: {formatDuration(process.started_at, process.completed_at)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      ID: {process.id.slice(0, 8)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Process Detail Sheet */}
        <Sheet open={isDetailDrawerOpen} onOpenChange={setIsDetailDrawerOpen}>
          <SheetContent className="w-[800px] sm:max-w-[800px]">
            <SheetHeader>
              <SheetTitle>Process Detayları</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {processDetail && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-sm text-gray-500">Process Name</h3>
                      <p className="text-lg">{processDetail.name}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-500">Status</h3>
                      <div className="mt-1">{getStatusBadge(processDetail.status)}</div>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-500">Started At</h3>
                      <p>{new Date(processDetail.started_at).toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-500">Duration</h3>
                      <p>{formatDuration(processDetail.started_at, processDetail.completed_at)}</p>
                    </div>
                  </div>

                  <Tabs defaultValue="variables" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="variables">Variables</TabsTrigger>
                      <TabsTrigger value="forms">Form Data</TabsTrigger>
                      <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="variables" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Process Variables</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[300px]">
                            <pre className="text-xs bg-gray-50 p-3 rounded">
                              {JSON.stringify(processDetail.variables || {}, null, 2)}
                            </pre>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="forms" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Form Submissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[300px]">
                            {formSubmissions && formSubmissions.length > 0 ? (
                              <div className="space-y-3">
                                {formSubmissions.map((submission: FormDataEntry) => (
                                  <div key={submission.id} className="border p-3 rounded">
                                    <div className="text-sm font-medium mb-2">
                                      {submission.form_key} v{submission.form_version}
                                    </div>
                                    <pre className="text-xs bg-gray-50 p-2 rounded">
                                      {JSON.stringify(submission.data_json, null, 2)}
                                    </pre>
                                    <div className="text-xs text-gray-500 mt-2">
                                      {new Date(submission.created_at).toLocaleString('tr-TR')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No form submissions found</p>
                            )}
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="audit" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Audit Trail</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[300px]">
                            {auditLogs && auditLogs.length > 0 ? (
                              <div className="space-y-3">
                                {auditLogs.map((log: AuditLogEntry) => (
                                  <div key={log.id} className="border-l-4 border-blue-500 pl-3">
                                    <div className="text-sm font-medium">{log.action}</div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(log.created_at).toLocaleString('tr-TR')}
                                    </div>
                                    {log.details && (
                                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1">
                                        {JSON.stringify(log.details, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No audit logs found</p>
                            )}
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
