import {
  initTheme as initializeTheme,
  type ThemeMode,
  applyThemeSettings,
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
