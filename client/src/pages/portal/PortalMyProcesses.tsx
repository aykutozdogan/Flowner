import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Play, Clock, CheckCircle, XCircle } from 'lucide-react';

interface UserProcess {
  id: string;
  name: string;
  workflow_name: string;
  status: 'running' | 'completed' | 'cancelled' | 'suspended';
  started_at: string;
  completed_at?: string;
  variables: any;
}

export default function PortalMyProcesses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: processes, isLoading } = useQuery<UserProcess[]>({
    queryKey: ['/api/v1/processes/my'],
    select: (data: any) => data.data || [],
  });

  const filteredProcesses = processes?.filter(process => {
    const matchesSearch = process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.workflow_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || process.status === activeTab;
    
    return matchesSearch && matchesTab;
  }) || [];

  const getStatusBadge = (status: string) => {
    const config = {
      running: { variant: 'default' as const, icon: Play, color: 'text-blue-500' },
      completed: { variant: 'outline' as const, icon: CheckCircle, color: 'text-green-500' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-500' },
      suspended: { variant: 'secondary' as const, icon: Clock, color: 'text-orange-500' },
    };

    const { variant, icon: Icon, color } = config[status as keyof typeof config] || config.running;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${color}`} />
        {status}
      </Badge>
    );
  };

  const getStatusCounts = () => {
    const counts = {
      all: processes?.length || 0,
      running: processes?.filter(p => p.status === 'running').length || 0,
      completed: processes?.filter(p => p.status === 'completed').length || 0,
      cancelled: processes?.filter(p => p.status === 'cancelled').length || 0,
      suspended: processes?.filter(p => p.status === 'suspended').length || 0,
    };
    return counts;
  };

  const counts = getStatusCounts();

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Processes</h1>
          <p className="text-gray-600 mt-2">View and track all processes you have started</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search processes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Process Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.all}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <Play className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{counts.running}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{counts.completed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{counts.cancelled}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{counts.suspended}</div>
            </CardContent>
          </Card>
        </div>

        {/* Process Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="running">Running ({counts.running})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
            <TabsTrigger value="suspended">Suspended ({counts.suspended})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading processes...</div>
            ) : filteredProcesses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Play className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No processes found</h3>
                  <p className="text-gray-500">
                    {activeTab === 'all' 
                      ? 'You haven\'t started any processes yet.'
                      : `No ${activeTab} processes found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredProcesses.map((process) => (
                  <Card key={process.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{process.name}</h3>
                          <p className="text-gray-600">Workflow: {process.workflow_name}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Started: {new Date(process.started_at).toLocaleString()}</span>
                            {process.completed_at && (
                              <span>Completed: {new Date(process.completed_at).toLocaleString()}</span>
                            )}
                          </div>
                          {process.variables && Object.keys(process.variables).length > 0 && (
                            <div className="mt-2">
                              <details className="text-sm">
                                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                  View Variables
                                </summary>
                                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                                  {JSON.stringify(process.variables, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(process.status)}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}