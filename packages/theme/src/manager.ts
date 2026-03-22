/**
 * @fileoverview
 * This file serves as the public entry point for the theme management runtime.
 * It re-exports the necessary functions and types for initializing and controlling
 * the application's theme from client-side code.
 */

export {
  initTheme,
  setTheme,
  loadThemeSettings,
  applyTheme,
  saveTheme,
} from './theme-manager';

export type {
  ThemeMode,
  Density,
  Accent,
  ThemeSettings,
} from './theme-manager';

