import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { DevExtremeThemeProvider } from '@/hooks/use-devextreme-theme';
import { ThemeProvider } from '@/hooks/use-theme';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// DevExtreme imports
import 'devextreme/dist/css/dx.light.css';

// Pages imports
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Workflows from "@/pages/workflows";
import Processes from "@/pages/processes";
import Tasks from "@/pages/tasks";
import EngineStats from "@/pages/engine-stats";
import PortalInbox from "@/pages/portal/PortalInbox";
import PortalTaskDetail from "@/pages/portal/PortalTaskDetail";
import FormBuilderPage from "@/pages/admin/FormBuilderPage";
import BpmnDesignerPage from "@/pages/admin/BpmnDesignerPage";
import FormsPage from "@/pages/admin/FormsPage";
import TenantsPage from "@/pages/admin/TenantsPage";
import UsersPage from "@/pages/admin/UsersPage";
import AdminTasksPage from "@/pages/admin/AdminTasksPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import PortalMyProcesses from "@/pages/portal/PortalMyProcesses";
import PortalProfile from "@/pages/portal/PortalProfile";
import PortalStartProcess from "@/pages/portal/PortalStartProcess";
import PortalForms from "@/pages/portal/PortalForms";
import PortalNotifications from "@/pages/portal/PortalNotifications";

// Layout imports
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { useErrorTracking } from '@/hooks/useErrorTracking';

// Unified App Props Interface
interface AppProps {
  entryMode?: 'admin' | 'portal' | 'unified';
  defaultTheme?: string;
}

// Ana uygulama component'i - role-based routing ile
function AppContent({ entryMode = 'unified' }: { entryMode?: string }) {
  const { user, isAuthenticated, role } = useAuth();

  // Error tracking başlat
  useErrorTracking();

  // Login kontrolü
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  // Role-based layout seçimi
  const isAdmin = role === 'tenant_admin' || role === 'designer';
  const isPortalUser = role === 'user' || role === 'approver';

  // Entry mode'a göre routing
  if (entryMode === 'admin' && !isAdmin) {
    return <div>Yetkiniz bulunmamaktadır. Admin rolü gereklidir.</div>;
  }
  
  if (entryMode === 'portal' && !isPortalUser) {
    return <div>Yetkiniz bulunmamaktadır. Portal kullanıcısı rolü gereklidir.</div>;
  }

  return (
    <Switch>
      {/* Login route */}
      <Route path="/login" component={Login} />
      
      {/* Admin routes - sadece admin rolü */}
      {isAdmin && (
        <>
          <Route path="/admin" nest>
            <AdminLayout>
              <Switch>
                <Route path="/dashboard" component={AdminDashboard} />
                <Route path="/users" component={UsersPage} />
                <Route path="/tenants" component={TenantsPage} />
                <Route path="/forms" component={FormsPage} />
                <Route path="/form-builder" component={FormBuilderPage} />
                <Route path="/workflows" component={Workflows} />
                <Route path="/bpmn-designer" component={BpmnDesignerPage} />
                <Route path="/processes" component={Processes} />
                <Route path="/tasks" component={AdminTasksPage} />
                <Route path="/engine-stats" component={EngineStats} />
                <Route path="/settings" component={AdminSettingsPage} />
                <Route>
                  <Redirect to="/admin/dashboard" />
                </Route>
              </Switch>
            </AdminLayout>
          </Route>
        </>
      )}
      
      {/* Portal routes - portal kullanıcıları */}
      {isPortalUser && (
        <>
          <Route path="/portal" nest>
            <PortalLayout>
              <Switch>
                <Route path="/inbox" component={PortalInbox} />
                <Route path="/task/:id" component={PortalTaskDetail} />
                <Route path="/my-processes" component={PortalMyProcesses} />
                <Route path="/start-process" component={PortalStartProcess} />
                <Route path="/forms" component={PortalForms} />
                <Route path="/profile" component={PortalProfile} />
                <Route path="/notifications" component={PortalNotifications} />
                <Route>
                  <Redirect to="/portal/inbox" />
                </Route>
              </Switch>
            </PortalLayout>
          </Route>
        </>
      )}
      
      {/* Unified mode routes */}
      {entryMode === 'unified' && (
        <>
          <Route path="/tasks" component={Tasks} />
          <Route path="/workflows" component={Workflows} />
          <Route path="/processes" component={Processes} />
          <Route path="/engine-stats" component={EngineStats} />
        </>
      )}
      
      {/* Default redirects */}
      <Route path="/">
        {() => {
          if (entryMode === 'admin') return <Redirect to="/admin/dashboard" />;
          if (entryMode === 'portal') return <Redirect to="/portal/inbox" />;
          if (isAdmin) return <Redirect to="/admin/dashboard" />;
          if (isPortalUser) return <Redirect to="/portal/inbox" />;
          return <Redirect to="/login" />;
        }}
      </Route>
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Main App Component
function App({ entryMode = 'unified', defaultTheme = 'light' }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <DevExtremeThemeProvider defaultTheme={defaultTheme}>
            <TooltipProvider>
              <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
                <AppContent entryMode={entryMode} />
                <Toaster />
              </div>
            </TooltipProvider>
          </DevExtremeThemeProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;