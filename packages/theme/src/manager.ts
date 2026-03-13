import {
  initTheme as initializeTheme,
  setTheme as applyThemeSettings,
  type ThemeMode,
} from './theme-manager';

export * from './theme-manager';

export class ThemeManager {
  static init() {
    return initializeTheme();
  }

  static setTheme(theme: ThemeMode) {
    applyThemeSettings({ mode: theme });
  }
}
