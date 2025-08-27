import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Alert,
  CircularProgress 
} from '@mui/material';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email,
          password
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Use AuthContext login method
        login(data.data.user, data.data.access_token, data.data.refresh_token);

        toast({
          title: "Giriş Başarılı",
          description: `Hoş geldiniz, ${data.data.user.name}!`,
        });

        // Handle redirect - redirectTo param takes priority
        const targetRoute = redirectTo || getDefaultRoute();
        
        // Use a small delay to ensure state is updated
        setTimeout(() => {
          setLocation(targetRoute);
        }, 100);
        
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
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              data-testid="input-email"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              data-testid="input-password"
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 500,
              }}
              disabled={loading}
              data-testid="button-login"
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Need help? Contact your system administrator
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
