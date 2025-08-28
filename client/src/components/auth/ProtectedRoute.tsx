import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { LoadIndicator } from 'devextreme-react';

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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <LoadIndicator visible={true} />
        <div style={{ color: '#666', fontSize: '14px' }}>Yetkilendirme kontrol ediliyor...</div>
      </div>
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