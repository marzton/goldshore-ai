# Render Stability Guard

**Status:** ACTIVE
**Scope:** goldshore.ai (gs-web)

## 1. Definition of "CSS Broken"
A deployment is considered "CSS Broken" if ANY of the following occur:
- The site renders unstyled content (FOUC that persists).
- The `/_astro/*.css` bundle returns a 404 or 403 error.
- The `global.css` file is not loaded or overridden incorrectly.
- Layout elements (header, footer, sidebar) are missing or misaligned.
- Typography falls back to system defaults instead of the theme font.
- Buttons lose their specific styling (padding, colors, borders).

## 2. Definition of "Theme Regression"
A change is a "Theme Regression" if:
- It bypasses the standard layout (`WebLayout` or `AdminLayout`).
- It duplicates theme imports (importing partials instead of `global.css`).
- It hardcodes styles that should be token-based (e.g., hex codes instead of `var(--gs-color-...)`).
- It introduces inline `<style>` tags that conflict with global styles.

## 3. Rollback Protocol
If a "CSS Broken" state or "Theme Regression" is detected in production:
1.  **IMMEDIATE ROLLBACK:** Revert the Cloudflare Pages deployment to the previous known good commit.
2.  **LOCK:** Freeze deployments to the affected environment.
3.  **DIAGNOSE:** Analyze the `dist/` output and browser console logs.
4.  **FIX:** remediate the code ensuring local build verification passes.
5.  **VERIFY:** Run the Production Deploy Checklist before re-enabling deployments.
