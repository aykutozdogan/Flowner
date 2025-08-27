import React, { createContext, useContext, useEffect, useState } from 'react';

type DevExtremeThemeMode = 'light' | 'dark' | 'corporate' | 'carmine' | 'dark-moon' | 'soft-blue' | 'dark-violet' | 'green-mist' | 'contrast';

interface DevExtremeThemeContextType {
  theme: DevExtremeThemeMode;
  setTheme: (theme: DevExtremeThemeMode) => void;
  toggleTheme: () => void;
}

const DevExtremeThemeContext = createContext<DevExtremeThemeContextType | undefined>(undefined);

export function DevExtremeThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<DevExtremeThemeMode>(() => {
    const stored = localStorage.getItem('flowner-dx-theme') as DevExtremeThemeMode;
    if (stored && ['light', 'dark', 'corporate', 'carmine', 'dark-moon', 'soft-blue', 'dark-violet', 'green-mist', 'contrast'].includes(stored)) {
      return stored;
    }
    return 'light';
  });

  useEffect(() => {
    if (!theme) return;

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
      const themes = (window as any).DevExpress?.ui?.themes;
      if (themes) {
        themes.current(themeName);
      }
    } catch (error) {
      console.warn('DevExtreme theme setting skipped:', error);
    }
    
    const root = document.documentElement;
    root.classList.remove('dx-theme-light', 'dx-theme-dark', 'dx-theme-corporate', 'dx-theme-carmine', 'dx-theme-dark-moon', 'dx-theme-soft-blue', 'dx-theme-dark-violet', 'dx-theme-green-mist', 'dx-theme-contrast');
    root.classList.add(`dx-theme-${theme}`);
    
    localStorage.setItem('flowner-dx-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(current => {
      const themes: DevExtremeThemeMode[] = ['light', 'dark', 'corporate'];
      const currentIndex = themes.indexOf(current);
      return themes[(currentIndex + 1) % themes.length];
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