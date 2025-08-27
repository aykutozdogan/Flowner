import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Settings, Shield, Database, Mail, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-gray-600 mt-2">Configure system-wide settings and preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input id="orgName" defaultValue="Demo Organization" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input id="domain" defaultValue="demo.local" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" defaultValue="UTC" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Default Language</Label>
                    <Input id="language" defaultValue="Turkish" />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Debug Mode</Label>
                      <p className="text-sm text-gray-600">Enable detailed logging and debug information</p>
                    </div>
                    <Switch checked={debugMode} onCheckedChange={setDebugMode} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Backup</Label>
                      <p className="text-sm text-gray-600">Automatically backup data daily</p>
                    </div>
                    <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="60" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input id="maxLoginAttempts" type="number" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Password Min Length</Label>
                    <Input id="passwordMinLength" type="number" defaultValue="8" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jwtSecret">JWT Secret Key</Label>
                    <Input id="jwtSecret" type="password" defaultValue="••••••••••••" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dbHost">Database Host</Label>
                    <Input id="dbHost" defaultValue="localhost" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dbPort">Database Port</Label>
                    <Input id="dbPort" defaultValue="5432" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dbName">Database Name</Label>
                    <Input id="dbName" defaultValue="flowner_dev" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxConnections">Max Connections</Label>
                    <Input id="maxConnections" type="number" defaultValue="20" />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline">Test Connection</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600">Send email notifications for important events</p>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input id="smtpHost" defaultValue="smtp.gmail.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input id="smtpPort" defaultValue="587" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input id="smtpUser" defaultValue="admin@demo.local" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPass">SMTP Password</Label>
                    <Input id="smtpPass" type="password" defaultValue="••••••••" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  External Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input id="webhookUrl" placeholder="https://api.example.com/webhook" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input id="apiKey" type="password" placeholder="Enter API key" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slackWebhook">Slack Webhook</Label>
                    <Input id="slackWebhook" placeholder="https://hooks.slack.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamsWebhook">Teams Webhook</Label>
                    <Input id="teamsWebhook" placeholder="https://outlook.office.com/webhook/..." />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline">Reset</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </AdminLayout>
  );
}