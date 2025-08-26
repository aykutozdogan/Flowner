import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as CustomThemeProvider } from './hooks/use-theme';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
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
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PortalLayout } from '@/components/layout/PortalLayout';

// Create Material-UI theme matching the design reference
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // S7 Primary Blue - güvenilir, profesyonel
      dark: '#1565c0',
      light: '#42a5f5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#5c6bc0', // S7 Indigo - modern accent
      dark: '#3f51b5',
      light: '#9575cd',
      contrastText: '#ffffff',
    },
    success: {
      main: '#388e3c', // S7 Success Green
      dark: '#2e7d32',
      light: '#66bb6a',
    },
    warning: {
      main: '#f57c00', // S7 Warning Amber
      dark: '#ef6c00',
      light: '#ff9800',
    },
    error: {
      main: '#d32f2f', // S7 Error Red
      dark: '#c62828',
      light: '#f44336',
    },
    info: {
      main: '#0288d1', // S7 Info Light Blue
      dark: '#0277bd',
      light: '#03a9f4',
    },
    background: {
      default: '#fafafa', // S7 Enterprise Background
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8, // S7 Consistent border radius
  },
  components: {
    // S7 Component Simplification
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
  shadows: [
    'none',
    '0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12)', // material shadow
    '0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)', // material-lg shadow
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
    '0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12)',
  ],
});

function RootRedirect() {
  const { isAuthenticated, getDefaultRoute } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Redirect to={getDefaultRoute()} />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/forms">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <FormsPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/tenants">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <TenantsPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/users">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <UsersPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/workflows">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <Workflows />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/workflows/designer/:key?">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <BpmnDesignerPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/forms/builder/:key?">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <FormBuilderPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/processes">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <Processes />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/tasks">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <Tasks />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/analytics">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <EngineStats />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      {/* Portal Routes */}
      <Route path="/portal/inbox">
        <ProtectedRoute requirePortal>
          <PortalInbox />
        </ProtectedRoute>
      </Route>

      <Route path="/portal/tasks/:id">
        <ProtectedRoute requirePortal>
          <PortalTaskDetail />
        </ProtectedRoute>
      </Route>

      <Route path="/portal/tasks">
        <ProtectedRoute requirePortal>
          <PortalLayout>
            <PortalInbox />
          </PortalLayout>
        </ProtectedRoute>
      </Route>

      {/* Root Redirect */}
      <Route path="/" component={RootRedirect} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Clean props to avoid Material-UI warnings
  const cleanThemeProviderProps = {
    theme
  };

  return (
    <CustomThemeProvider>
      <ThemeProvider {...cleanThemeProviderProps}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </CustomThemeProvider>
  );
}

export default App;