// Professional DevExtreme Theme Provider
// Re-export from professional theme manager
export { ThemeProvider, useTheme, useThemeContext } from '../theme/theme-manager';
export type { Theme } from '../theme/theme-manager';

// Backward compatibility
export { useTheme as useThemeOld } from '../hooks/use-theme-context';