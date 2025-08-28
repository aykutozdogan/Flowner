import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Alert,
  CircularProgress 
} from '@mui/material';
import { 
  TextBox as DxTextBox,
  Button as DxButton 
} from 'devextreme-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { login, getDefaultRoute } = useAuth();

  // Get redirectTo parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get('redirectTo');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Set tenant header for login
      localStorage.setItem('tenant_domain', 'demo.local');
      
      const response = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'X-Tenant-Id': 'demo.local'
        },
        body: {
          email,
          password
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Store tenant info
        localStorage.setItem('tenant_id', data.data.user.tenant_id);
        localStorage.setItem('tenant_domain', 'demo.local');
        
        // Use AuthContext login method
        login(data.data.user, data.data.access_token, data.data.refresh_token);

        toast({
          title: "Giriş Başarılı",
          description: `Hoş geldiniz, ${data.data.user.name}!`,
        });

        // Handle redirect - redirectTo param takes priority
        let targetRoute = redirectTo;
        
        if (!targetRoute) {
          // Determine route based on user role
          if (data.data.user.role === 'tenant_admin' || data.data.user.role === 'designer') {
            targetRoute = '/admin/dashboard';
          } else if (data.data.user.role === 'approver' || data.data.user.role === 'user') {
            targetRoute = '/portal/inbox';
          } else {
            targetRoute = '/login';
          }
        }
        
        console.log('User role:', data.data.user.role, 'Target route:', targetRoute);
        
        // Use a small delay to ensure state is updated
        setTimeout(() => {
          setLocation(targetRoute);
        }, 200);
        
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      toast({
        title: "Login Failed",
        description: err.message || 'Please check your credentials',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
              }}
            >
              <span className="material-icons text-white text-xl">account_tree</span>
            </Box>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Flowner
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Business Process Management
              </Typography>
            </Box>
          </Box>

          {/* Login Form */}
          <Box sx={{ width: '100%' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Email Address *
              </label>
              <DxTextBox
                placeholder="Enter your email address"
                value={email}
                onValueChanged={(e) => setEmail(e.value)}
                disabled={loading}
                width="100%"
                height={44}
                elementAttr={{
                  id: 'email',
                  'data-testid': 'input-email'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Password *
              </label>
              <DxTextBox
                mode="password"
                placeholder="Enter your password"
                value={password}
                onValueChanged={(e) => setPassword(e.value)}
                disabled={loading}
                width="100%"
                height={44}
                elementAttr={{
                  id: 'password',
                  'data-testid': 'input-password'
                }}
              />
            </div>

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}

            <DxButton
              text={loading ? 'Signing In...' : 'Sign In'}
              type="default"
              stylingMode="contained"
              onClick={handleSubmit}
              disabled={loading}
              width="100%"
              height={50}
              elementAttr={{
                'data-testid': 'button-login'
              }}
            />

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Need help? Contact your system administrator
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
