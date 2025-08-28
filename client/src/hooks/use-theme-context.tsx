import { currentTheme as currentVizTheme, refreshTheme } from 'devextreme/viz/themes';
import { current as getCurrentDXTheme } from 'devextreme/ui/themes';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const themes = ['light', 'dark'] as const;
const storageKey = 'app-theme';
const themePrefix = 'app-theme-';

const prefixes = ['./styles/theme-dx-', './styles/variables-'];

const loadStylesImports = async() => {
  // Import SCSS files statically to avoid Vite warnings
  await Promise.all([
    import(/* @vite-ignore */ '../styles/theme-dx-dark.scss'),
    import(/* @vite-ignore */ '../styles/theme-dx-light.scss'),
    import(/* @vite-ignore */ '../styles/variables-dark.scss'),
    import(/* @vite-ignore */ '../styles/variables-light.scss')
  ]);
};

export type Theme = typeof themes[number];

function getNextTheme(theme?: Theme) {
  return themes[themes.indexOf(theme as Theme) + 1] || themes[0];
}

function getCurrentTheme(): Theme {
  return window.localStorage[storageKey] || getNextTheme();
}

function isThemeStyleSheet(styleSheet: CSSStyleSheet, theme: Theme) {
  const themeMarker = `${themePrefix}${theme}`;
  // eslint-disable-next-line no-undef
  if(process.env.NODE_ENV === 'production') {
    return styleSheet?.href?.includes(`${themeMarker}`);
  } else {
    const rules = Array.from<CSSStyleRule>(styleSheet.cssRules || []);
    return !!rules.find((rule) => rule?.selectorText?.includes(`.${themeMarker}`));
  }
}

function switchThemeStyleSheets(enabledTheme: Theme) {
  const disabledTheme = getNextTheme(enabledTheme);

  Array.from<CSSStyleSheet>(document.styleSheets).forEach((styleSheet) => {
    try {
      styleSheet.disabled = isThemeStyleSheet(styleSheet, disabledTheme);
    } catch (e) {
      // Handle cross-origin stylesheets
    }
  });
}

async function setAppTheme(newTheme?: Theme) {
  const themeName = newTheme || getCurrentTheme();

  switchThemeStyleSheets(themeName);
  
  // Add theme class to document
  document.documentElement.className = document.documentElement.className
    .replace(/app-theme-\w+/g, '')
    .trim();
  document.documentElement.classList.add(`app-theme-${themeName}`);

  const regexTheme = new RegExp(`\\.(${themes.join('|')})`, 'g');
  currentVizTheme(currentVizTheme().replace(regexTheme, `.${themeName}`));
  refreshTheme();
}

function toggleTheme(currentTheme: Theme): Theme {
  const newTheme = getNextTheme(currentTheme);
  window.localStorage[storageKey] = newTheme;
  return newTheme;
}

export function useThemeContext() {
  const [theme, setTheme] = useState(getCurrentTheme());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadStylesImports().then(() => {
      setIsLoaded(true);
    });
  }, []);

  const switchTheme = useCallback(() => setTheme((currentTheme: Theme) => toggleTheme(currentTheme)), []);

  const isFluent = useCallback((): boolean => {
    return getCurrentDXTheme().includes('fluent');
  }, []);

  const isDark = useMemo(() => theme === 'dark', [theme]);

  useEffect(() => {
    isLoaded && setAppTheme(theme);
  }, [theme, isLoaded]);

  return useMemo(()=> ({ 
    theme, 
    switchTheme, 
    isLoaded, 
    isFluent,
    isDark,
    toggleTheme: switchTheme
  }), [theme, isLoaded, isFluent, isDark, switchTheme]);
}

export const ThemeContext = React.createContext<ReturnType<typeof useThemeContext> | null>(null);