export class ThemeManager {
  static init() {
    console.log('ThemeManager initialized');
    // Check for saved theme
    const savedTheme = localStorage.getItem('goldshore.theme.v1');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }

  static setTheme(theme: string) {
    localStorage.setItem('goldshore.theme.v1', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
}
