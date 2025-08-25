import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Server, 
  Database,
  Cpu,
  HardDrive
} from 'lucide-react';

interface EngineStats {
  scheduler: {
    status: string;
    totalJobs: number;
    queuedJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    queueHealth: number;
    avgProcessingTime: number;
    lastActivity: string;
  };
  timestamp: string;
}

export default function EngineStatsPage() {
  const { data: stats, isLoading, error } = useQuery<EngineStats>({
    queryKey: ['/api/engine/stats'],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time stats
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Stats</h3>
            <p className="text-gray-500">Unable to fetch engine statistics. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scheduler = stats?.scheduler;
  const queueHealth = scheduler?.queueHealth || 0;
  const totalJobs = scheduler?.totalJobs || 0;
  const completionRate = totalJobs > 0 ? ((scheduler?.completedJobs || 0) / totalJobs) * 100 : 0;

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Engine Statistics</h1>
            <p className="text-gray-600 mt-2">Real-time workflow engine monitoring and performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={scheduler?.status === 'running' ? 'default' : 'destructive'}
              data-testid="engine-status"
            >
              <Server className="w-3 h-3 mr-1" />
              {scheduler?.status || 'unknown'}
            </Badge>
            <span className="text-sm text-gray-500">
              Updated: {stats?.timestamp ? new Date(stats.timestamp).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="total-jobs-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduler?.totalJobs || 0}</div>
              <p className="text-xs text-muted-foreground">
                All time job count
              </p>
            </CardContent>
          </Card>

          <Card data-testid="queued-jobs-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Queued Jobs</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {scheduler?.queuedJobs || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Waiting for processing
              </p>
            </CardContent>
          </Card>

          <Card data-testid="running-jobs-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running Jobs</CardTitle>
              <Cpu className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {scheduler?.runningJobs || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently processing
              </p>
            </CardContent>
          </Card>

          <Card data-testid="completed-jobs-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {scheduler?.completedJobs || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully finished
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Queue Health
              </CardTitle>
              <CardDescription>
                Overall health of the job processing queue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Health Score</span>
                  <span>{Math.round(queueHealth)}%</span>
                </div>
                <Progress 
                  value={queueHealth} 
                  className="h-2"
                  data-testid="queue-health-progress"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Failed Jobs</div>
                  <div className="text-red-600 font-medium">
                    {scheduler?.failedJobs || 0}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Success Rate</div>
                  <div className="text-green-600 font-medium">
                    {Math.round(completionRate)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Job processing performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Processing Time</span>
                  <span className="font-medium">
                    {scheduler?.avgProcessingTime ? 
                      `${Math.round(scheduler.avgProcessingTime)}ms` : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Activity</span>
                  <span className="font-medium">
                    {scheduler?.lastActivity ? 
                      new Date(scheduler.lastActivity).toLocaleString() : 
                      'Never'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engine Status</span>
                  <Badge variant={scheduler?.status === 'running' ? 'default' : 'destructive'}>
                    {scheduler?.status || 'unknown'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}