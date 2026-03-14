import {
  initTheme as initializeTheme,
  loadThemeSettings,
  setTheme as applyThemeSettings,
  type ThemeMode,
} from './theme-manager';

export { initTheme, loadThemeSettings, setTheme } from './theme-manager';

export class ThemeManager {
  static init() {
    return initializeTheme();
  }

  static setTheme(theme: ThemeMode) {
    applyThemeSettings({ mode: theme });
  }
}
