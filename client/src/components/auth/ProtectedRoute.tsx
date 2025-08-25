import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePortal?: boolean;
  fallbackRoute?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requirePortal = false,
  fallbackRoute = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, hasAdminAccess, hasPortalAccess, user } = useAuth();
  const [, setLocation] = useLocation();

  // Yükleniyor durumu kontrolü
  if (user === undefined) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">Yetkilendirme kontrol ediliyor...</Typography>
      </Box>
    );
  }

  // Kimlik doğrulama kontrolü
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  // Admin erişim kontrolü
  if (requireAdmin && !hasAdminAccess()) {
    setLocation('/portal/inbox');
    return null;
  }

  // Portal erişim kontrolü
  if (requirePortal && !hasPortalAccess()) {
    setLocation('/admin/dashboard');
    return null;
  }

  return <>{children}</>;
}