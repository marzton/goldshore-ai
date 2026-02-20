# Production Deploy Checklist

**Target:** goldshore.ai / admin.goldshore.ai

## Pre-Deployment (Build & Dist Verification)
- [ ] **Build Success:** `pnpm --filter <app> build` completes with exit code 0.
- [ ] **Dist Verified:** `dist/` directory contains `_astro/` folder.
- [ ] **CSS Present:** `dist/_astro/*.css` exists and is non-empty.
- [ ] **JS Present:** `dist/_astro/*.js` exists and is non-empty.
- [ ] **No Layout Bypass:** All pages use the approved Layout component (`WebLayout` or `AdminLayout`).

## Post-Deployment (Production Edge Verification)
- [ ] **HTTP 200 OK:** Root URL returns 200 (not 403/404/500).
- [ ] **No Cloudflare Challenge:** Request does not return "cf-mitigated".
- [ ] **Assets Load:** CSS and JS bundles load with 200 OK.
- [ ] **Logo Present:** SVG logo renders correctly (no broken image).
- [ ] **Console Clean:** No CSP errors or 404s in browser console.
- [ ] **Visual Sanity:** Hero section, typography, and navigation render as expected.
