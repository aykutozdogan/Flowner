import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Mail, AlertCircle, CheckCircle, Info, Trash2, Check } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  category: 'task' | 'process' | 'system' | 'reminder';
  actionUrl?: string;
}

export default function PortalNotifications() {
  const [activeTab, setActiveTab] = useState('all');

  // Mock data - in real app this would come from API
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'New Task Assigned',
      message: 'You have been assigned a new task: "Expense Approval Request"',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      category: 'task',
      actionUrl: '/portal/tasks/123'
    },
    {
      id: '2',
      title: 'Process Completed',
      message: 'Your "Travel Request" process has been completed successfully',
      type: 'success',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      category: 'process'
    },
    {
      id: '3',
      title: 'System Maintenance',
      message: 'Scheduled system maintenance will occur tonight from 2:00 AM to 4:00 AM',
      type: 'warning',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      category: 'system'
    },
    {
      id: '4',
      title: 'Task Overdue',
      message: 'Task "Invoice Review" is now 2 days overdue',
      type: 'error',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      category: 'reminder'
    },
    {
      id: '5',
      title: 'Weekly Summary',
      message: 'You completed 5 tasks this week. Great job!',
      type: 'info',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
      category: 'system'
    }
  ];

  const [notifications, setNotifications] = useState(mockNotifications);

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.isRead;
    if (activeTab === 'read') return notification.isRead;
    return notification.category === activeTab;
  });

  const getNotificationIcon = (type: string) => {
    const icons = {
      info: Info,
      success: CheckCircle,
      warning: AlertCircle,
      error: AlertCircle,
    };
    const Icon = icons[type as keyof typeof icons] || Info;
    return Icon;
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      info: 'text-blue-500',
      success: 'text-green-500',
      warning: 'text-orange-500',
      error: 'text-red-500',
    };
    return colors[type as keyof typeof colors] || 'text-blue-500';
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      info: 'default' as const,
      success: 'outline' as const,
      warning: 'secondary' as const,
      error: 'destructive' as const,
    };
    return variants[type as keyof typeof variants] || 'default';
  };

  const getCategoryBadge = (category: string) => {
    const labels = {
      task: 'Task',
      process: 'Process', 
      system: 'System',
      reminder: 'Reminder'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-gray-600 mt-2">Stay updated with your tasks and processes</p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <Check className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Notification Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Mail className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{unreadCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {notifications.filter(n => n.category === 'task').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {notifications.filter(n => n.type === 'error').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="task">Tasks ({notifications.filter(n => n.category === 'task').length})</TabsTrigger>
            <TabsTrigger value="process">Processes ({notifications.filter(n => n.category === 'process').length})</TabsTrigger>
            <TabsTrigger value="system">System ({notifications.filter(n => n.category === 'system').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500">
                    {activeTab === 'all' 
                      ? 'You have no notifications.'
                      : `No ${activeTab} notifications found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconColor = getNotificationColor(notification.type);
                  
                  return (
                    <Card 
                      key={notification.id} 
                      className={`${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''} hover:shadow-md transition-shadow`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                                  {notification.title}
                                </h3>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{notification.message}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant={getTypeBadge(notification.type)} className="text-xs">
                                  {notification.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {getCategoryBadge(notification.category)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {getTimeAgo(notification.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(notification.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}