import React, { createContext, useContext, useEffect, useState } from 'react';

type DevExtremeThemeMode = 'light' | 'dark' | 'corporate';

interface DevExtremeThemeContextType {
  theme: DevExtremeThemeMode;
  setTheme: (theme: DevExtremeThemeMode) => void;
  toggleTheme: () => void;
}

const DevExtremeThemeContext = createContext<DevExtremeThemeContextType | undefined>(undefined);

export function DevExtremeThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<DevExtremeThemeMode>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('flowner-dx-theme') as DevExtremeThemeMode;
    if (stored && ['light', 'dark', 'corporate'].includes(stored)) {
      return stored;
    }
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  useEffect(() => {
    // Skip theme setting during initial render or if theme is not set
    if (!theme) {
      return;
    }

    // Apply DevExtreme theme based on current selection
    let themeName = 'generic.light';
    
    switch (theme) {
      case 'dark':
        themeName = 'generic.dark';  
        break;
      case 'corporate':
        themeName = 'material.blue.light';
        break;
      case 'light':
      default:
        themeName = 'generic.light';
        break;
    }

    try {
      // Try to set DevExtreme theme if available
      const themes = (window as any).DevExpress?.ui?.themes;
      if (themes) {
        themes.current(themeName);
      }
    } catch (error) {
      console.warn('DevExtreme theme setting skipped:', error);
    }
    
    // Apply additional CSS class to document root
    const root = document.documentElement;
    root.classList.remove('dx-theme-light', 'dx-theme-dark', 'dx-theme-corporate');
    root.classList.add(`dx-theme-${theme}`);
    
    // Store in localStorage
    localStorage.setItem('flowner-dx-theme', theme);

    // Update CSS variables for Flowner branding
    const primaryColor = '#1976d2'; // Flowner Blue
    root.style.setProperty('--dx-color-primary', primaryColor);
    root.style.setProperty('--dx-color-primary-rgb', '25, 118, 210');
    
  }, [theme]);

  const toggleTheme = () => {
    setTheme(current => {
      switch (current) {
        case 'light': return 'dark';
        case 'dark': return 'corporate';
        case 'corporate': return 'light';
        default: return 'light';
      }
    });
  };

  return (
    <DevExtremeThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </DevExtremeThemeContext.Provider>
  );
}

export function useDevExtremeTheme() {
  const context = useContext(DevExtremeThemeContext);
  if (!context) {
    throw new Error('useDevExtremeTheme must be used within a DevExtremeThemeProvider');
  }
  return context;
}