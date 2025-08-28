import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'corporate';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('flowner-theme') as ThemeMode;
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
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('dark', 'theme-dark', 'corporate', 'theme-corporate');
    
    // Add current theme class - both formats for compatibility
    if (theme === 'dark') {
      root.classList.add('dark', 'theme-dark');
    } else if (theme === 'corporate') {
      root.classList.add('corporate', 'theme-corporate');
    }
    
    // Store in localStorage
    localStorage.setItem('flowner-theme', theme);
    
    // Force re-render of DevExtreme components
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
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
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}