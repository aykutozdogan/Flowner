import React, { useState } from 'react';
import { Button as DxButton } from 'devextreme-react/button';
import { useAuth } from '@/hooks/useAuth';

interface ProfileDropdownProps {
  userType: 'admin' | 'portal';
}

export function ProfileDropdown({ userType }: ProfileDropdownProps) {
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleProfileClick = () => {
    setIsOpen(!isOpen);
  };

  const handleProfileAction = () => {
    console.log('Profile action');
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Profile Avatar Button */}
      <div
        onClick={handleProfileClick}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#1976d2',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'all 0.2s ease'
        }}
        data-testid="profile-dropdown"
      >
        {user?.email?.charAt(0).toUpperCase() || 'U'}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '0',
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: '150px',
            zIndex: 1000
          }}
        >
          <div
            onClick={handleProfileAction}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>👤</span>
            <span>Profile</span>
          </div>
          <div
            onClick={handleLogout}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#f44336'
            }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}

// Simple theme toggle component
interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <DxButton
      icon={isDark ? 'moon' : 'sun'}
      stylingMode="text"
      onClick={onToggle}
      hint={isDark ? 'Açık Tema' : 'Koyu Tema'}
      data-testid="theme-toggle"
    />
  );
}