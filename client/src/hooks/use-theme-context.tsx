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
    try {
      const rules = Array.from(styleSheet.cssRules || []) as CSSStyleRule[];
      return !!rules.find((rule) => rule?.selectorText?.includes(`.${themeMarker}`));
    } catch (e) {
      return false;
    }
  }
}

function switchThemeStyleSheets(enabledTheme: Theme) {
  const disabledTheme = getNextTheme(enabledTheme);

  Array.from(document.styleSheets).forEach((styleSheet) => {
    try {
      const shouldDisable = isThemeStyleSheet(styleSheet, disabledTheme);
      if (shouldDisable !== undefined) {
        styleSheet.disabled = shouldDisable;
      }
    } catch (e) {
      // Handle cross-origin stylesheets
    }
  });
}

async function setAppTheme(newTheme?: Theme) {
  const themeName = newTheme || getCurrentTheme();

  // Remove old theme classes
  document.documentElement.classList.remove('theme-light', 'theme-dark', 'app-theme-light', 'app-theme-dark');
  
  // Add new theme classes
  document.documentElement.classList.add(`theme-${themeName}`, `app-theme-${themeName}`);

  switchThemeStyleSheets(themeName);

  try {
    const regexTheme = new RegExp(`\\.(${themes.join('|')})`, 'g');
    const currentThemeName = currentVizTheme();
    if (currentThemeName) {
      currentVizTheme(currentThemeName.replace(regexTheme, `.${themeName}`));
      refreshTheme();
    }
  } catch (e) {
    console.warn('DevExtreme theme refresh failed:', e);
  }
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