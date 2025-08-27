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
      // Apply CSS class changes for dynamic theming
      const root = document.documentElement;
      
      // Remove all existing theme classes
      root.classList.remove('dx-theme-light', 'dx-theme-dark', 'dx-theme-corporate', 'dx-theme-carmine', 'dx-theme-dark-moon', 'dx-theme-soft-blue', 'dx-theme-dark-violet', 'dx-theme-green-mist', 'dx-theme-contrast');
      
      // Add current theme class
      root.classList.add(`dx-theme-${theme}`);
      
      // Update CSS variables based on theme
      let primaryColor = '#1976d2'; // Default Flowner Blue
      let backgroundColor = '#ffffff';
      let textColor = '#000000';
      
      switch (theme) {
        case 'dark':
          primaryColor = '#42a5f5';
          backgroundColor = '#1e1e1e';
          textColor = '#ffffff';
          break;
        case 'carmine':
          primaryColor = '#e17055';
          backgroundColor = '#ffeaa7';
          textColor = '#2d3436';
          break;
        case 'dark-moon':
          primaryColor = '#00b894';
          backgroundColor = '#2d3436';
          textColor = '#dddddd';
          break;
        case 'soft-blue':
          primaryColor = '#74b9ff';
          backgroundColor = '#f8f9fa';
          textColor = '#2d3436';
          break;
        case 'dark-violet':
          primaryColor = '#6c5ce7';
          backgroundColor = '#2d3436';
          textColor = '#dddddd';
          break;
        case 'green-mist':
          primaryColor = '#00b894';
          backgroundColor = '#f8f9fa';
          textColor = '#2d3436';
          break;
        case 'contrast':
          primaryColor = '#000000';
          backgroundColor = '#ffffff';
          textColor = '#000000';
          break;
        case 'corporate':
        case 'light':
        default:
          primaryColor = '#1976d2';
          backgroundColor = '#ffffff';
          textColor = '#000000';
          break;
      }
      
      // Apply CSS variables
      root.style.setProperty('--dx-color-primary', primaryColor);
      root.style.setProperty('--dx-color-background', backgroundColor);
      root.style.setProperty('--dx-color-text', textColor);
      
      // Force rerender of all DevExtreme components
      setTimeout(() => {
        const event = new CustomEvent('dx-theme-changed', { detail: { theme, primaryColor } });
        window.dispatchEvent(event);
        window.dispatchEvent(new Event('resize'));
      }, 100);
      
    } catch (error) {
      console.warn('DevExtreme theme setting failed:', error);
    }
    
    // Store in localStorage
    localStorage.setItem('flowner-dx-theme', theme);
    
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