import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { User, Mail, Key, Bell, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PortalProfile() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const { toast } = useToast();

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    });
  };

  const handleChangePassword = () => {
    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-gray-500" />
                  </div>
                  <div>
                    <Button variant="outline">Change Avatar</Button>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG up to 2MB</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="Demo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="User" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="admin@demo.local" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" defaultValue="+90 555 123 4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" defaultValue="IT" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" defaultValue="System Administrator" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current Roles</Label>
                  <div className="flex gap-2">
                    <Badge>tenant_admin</Badge>
                    <Badge variant="outline">designer</Badge>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button onClick={handleChangePassword}>Change Password</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Two-Factor Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
                  </div>
                  
                  {twoFactorAuth && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Two-factor authentication is enabled. Use your authenticator app to generate codes.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Login History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-gray-600">IP: 127.0.0.1 • Browser: Chrome</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">Previous Session</p>
                        <p className="text-sm text-gray-600">IP: 192.168.1.100 • Browser: Firefox • 2 hours ago</p>
                      </div>
                      <Badge variant="secondary">Expired</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Browser Notifications</Label>
                      <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
                    </div>
                    <Switch checked={browserNotifications} onCheckedChange={setBrowserNotifications} />
                  </div>
                </div>

                {emailNotifications && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">Email notification types:</p>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Task assignments</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Process completions</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Weekly summaries</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">System maintenance</span>
                      </label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select id="language" className="w-full p-2 border rounded-md">
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select id="timezone" className="w-full p-2 border rounded-md">
                      <option value="Europe/Istanbul">Istanbul (UTC+3)</option>
                      <option value="UTC">UTC</option>
                      <option value="Europe/London">London (UTC+0)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <select id="dateFormat" className="w-full p-2 border rounded-md">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <select id="theme" className="w-full p-2 border rounded-md">
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}