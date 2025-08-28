import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// DevExtreme inspired professional theme system
const themes = ['light', 'dark', 'corporate'] as const;
const storageKey = 'flowner-theme';
const themePrefix = 'flowner-theme-';

export type Theme = typeof themes[number];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  switchTheme: () => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getNextTheme(theme?: Theme): Theme {
  return themes[themes.indexOf(theme as Theme) + 1] || themes[0];
}

function getCurrentTheme(): Theme {
  const stored = localStorage.getItem(storageKey) as Theme;
  if (stored && themes.includes(stored)) {
    return stored;
  }
  
  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

function isThemeStyleSheet(styleSheet: CSSStyleSheet, theme: Theme): boolean {
  const themeMarker = `${themePrefix}${theme}`;
  
  if (process.env.NODE_ENV === 'production') {
    return styleSheet?.href?.includes(themeMarker) || false;
  } else {
    try {
      const rules = Array.from<CSSStyleRule>(styleSheet.cssRules || []);
      return !!rules.find((rule) => rule?.selectorText?.includes(`.${themeMarker}`));
    } catch {
      return false;
    }
  }
}

function switchThemeStyleSheets(enabledTheme: Theme) {
  const disabledTheme = getNextTheme(enabledTheme);
  
  Array.from<CSSStyleSheet>(document.styleSheets).forEach((styleSheet) => {
    try {
      if (isThemeStyleSheet(styleSheet, disabledTheme)) {
        styleSheet.disabled = true;
      } else if (isThemeStyleSheet(styleSheet, enabledTheme)) {
        styleSheet.disabled = false;
      }
    } catch {
      // Ignore cross-origin stylesheet errors
    }
  });
}

async function setAppTheme(newTheme: Theme) {
  const root = document.documentElement;
  
  // Remove all theme classes
  themes.forEach(theme => {
    root.classList.remove(theme, `theme-${theme}`, `${themePrefix}${theme}`);
  });
  
  // Add new theme classes
  root.classList.add(newTheme, `theme-${newTheme}`, `${themePrefix}${newTheme}`);
  
  // Switch stylesheets
  switchThemeStyleSheets(newTheme);
  
  // Store in localStorage
  localStorage.setItem(storageKey, newTheme);
  
  // Force DevExtreme components refresh
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 100);
  
  console.log('🎨 Theme applied:', newTheme);
}

function toggleTheme(currentTheme: Theme): Theme {
  const newTheme = getNextTheme(currentTheme);
  return newTheme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getCurrentTheme());
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setAppTheme(theme).then(() => {
      setIsLoaded(true);
    });
  }, [theme]);
  
  const switchTheme = useCallback(() => {
    setTheme(currentTheme => {
      const newTheme = toggleTheme(currentTheme);
      return newTheme;
    });
  }, []);
  
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    switchTheme,
    isLoaded
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
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

// Compatibility exports for existing code
export const useThemeContext = useTheme;