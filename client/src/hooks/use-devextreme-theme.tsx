import React, { createContext, useContext, useEffect, useState } from 'react';

type DevExtremeThemeMode = 'light' | 'dark' | 'corporate' | 'carmine' | 'dark-moon' | 'soft-blue' | 'dark-violet' | 'green-mist' | 'contrast';

interface DevExtremeThemeContextType {
  theme: DevExtremeThemeMode;
  setTheme: (theme: DevExtremeThemeMode) => void;
  toggleTheme: () => void;
}

const DevExtremeThemeContext = createContext<DevExtremeThemeContextType | undefined>(undefined);

export function DevExtremeThemeProvider({ children, defaultTheme }: { children: React.ReactNode; defaultTheme?: string }) {
  const [theme, setTheme] = useState<DevExtremeThemeMode>(() => {
    // Use defaultTheme if provided
    if (defaultTheme && ['light', 'dark', 'corporate', 'carmine', 'dark-moon', 'soft-blue', 'dark-violet', 'green-mist', 'contrast'].includes(defaultTheme)) {
      return defaultTheme as DevExtremeThemeMode;
    }
    
    // Check localStorage first
    const stored = localStorage.getItem('flowner-dx-theme') as DevExtremeThemeMode;
    if (stored && ['light', 'dark', 'corporate', 'carmine', 'dark-moon', 'soft-blue', 'dark-violet', 'green-mist', 'contrast'].includes(stored)) {
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
      case 'carmine':
        themeName = 'generic.carmine';
        break;
      case 'dark-moon':
        themeName = 'generic.darkmoon';
        break;
      case 'soft-blue':
        themeName = 'generic.softblue';
        break;
      case 'dark-violet':
        themeName = 'generic.darkviolet';
        break;
      case 'green-mist':
        themeName = 'generic.greenmist';
        break;
      case 'contrast':
        themeName = 'generic.contrast';
        break;
      case 'light':
      default:
        themeName = 'generic.light';
        break;
    }

    try {
      // Load DevExtreme theme CSS dynamically
      const themeUrls = {
        'generic.light': 'https://cdn3.devexpress.com/jslib/23.2.5/css/dx.light.css',
        'generic.dark': 'https://cdn3.devexpress.com/jslib/23.2.5/css/dx.dark.css',
        'material.blue.light': 'https://cdn3.devexpress.com/jslib/23.2.5/css/dx.material.blue.light.css',
        'generic.carmine': 'https://cdn3.devexpress.com/jslib/23.2.5/css/dx.carmine.css',
        'generic.darkmoon': 'https://cdn3.devexpress.com/jslib/23.2.5/css/dx.darkmoon.css',
        'generic.softblue': 'https://cdn3.devexpress.com/jslib/23.2.5/css/dx.softblue.css',
        'generic.darkviolet': 'https://cdn3.devexpress.com/jslib/23.2.5/css/dx.darkviolet.css',
        'generic.greenmist': 'https://cdn3.devexpress.com/jslib/23.2.5/css/dx.greenmist.css',
        'generic.contrast': 'https://cdn3.devexpress.com/jslib/23.2.5/css/dx.contrast.css'
      };
      
      // Remove previous theme CSS
      const existingTheme = document.querySelector('link[data-dx-theme]');
      if (existingTheme) {
        existingTheme.remove();
      }
      
      // Load new theme CSS
      const themeUrl = themeUrls[themeName as keyof typeof themeUrls] || themeUrls['generic.light'];
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = themeUrl;
      link.setAttribute('data-dx-theme', themeName);
      document.head.appendChild(link);
      
      // Try DevExtreme theme API if available  
      if (typeof window !== 'undefined' && (window as any).DevExpress?.ui?.themes) {
        const themes = (window as any).DevExpress.ui.themes;
        themes.current(themeName);
      }
    } catch (error) {
      console.warn('DevExtreme theme setting skipped:', error);
    }
    
    // Apply additional CSS class to document root
    const root = document.documentElement;
    root.classList.remove('dx-theme-light', 'dx-theme-dark', 'dx-theme-corporate', 'dx-theme-carmine', 'dx-theme-dark-moon', 'dx-theme-soft-blue', 'dx-theme-dark-violet', 'dx-theme-green-mist', 'dx-theme-contrast');
    root.classList.add(`dx-theme-${theme}`);
    
    // Store in localStorage
    localStorage.setItem('flowner-dx-theme', theme);

    // Update CSS variables for Flowner branding
    const primaryColor = '#1976d2'; // Flowner Blue
    root.style.setProperty('--dx-color-primary', primaryColor);
    root.style.setProperty('--dx-color-primary-rgb', '25, 118, 210');
    
    // Force update all DevExtreme components
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      const event = new CustomEvent('dx-theme-changed', { detail: { theme } });
      window.dispatchEvent(event);
    }, 100);
    
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <DevExtremeThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </DevExtremeThemeContext.Provider>
  );
}

export function useDevExtremeTheme() {
  const context = useContext(DevExtremeThemeContext);
  if (context === undefined) {
    throw new Error('useDevExtremeTheme must be used within a DevExtremeThemeProvider');
  }
  return context;
}

// Re-export for compatibility
export const useTheme = useDevExtremeTheme;