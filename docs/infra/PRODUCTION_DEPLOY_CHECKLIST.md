# Production Deploy Checklist

**Target:** goldshore.ai (gs-web) / admin.goldshore.ai (gs-admin)
**Version:** 1.1

## 1. Pre-Deployment (Build & Dist Verification)
- [ ] **Build Success:** `pnpm --filter <app> build` completes with exit code 0.
- [ ] **Dist Verified:** `dist/` directory contains `_astro/` folder and `index.html` (gs-web) or `_worker.js` (gs-admin).
- [ ] **CSS Present:** `dist/_astro/*.css` exists and is non-empty ( > 1KB).
- [ ] **JS Present:** `dist/_astro/*.js` exists and is non-empty.
- [ ] **No Layout Bypass:** All pages use the approved Layout component (`WebLayout` or `AdminLayout`) and do not redefine `<html>` or `<body>`.

## 2. Post-Deployment (Production Edge Verification)
- [ ] **HTTP 200 OK:** Root URL returns 200 (not 403, 404, or 500).
- [ ] **No Cloudflare Challenge:** Request does not return "cf-mitigated" or challenge page.
- [ ] **Assets Load:** CSS and JS bundles load with 200 OK (no 403/404).
- [ ] **Logo Present:** SVG logo renders correctly (no broken image icon).
- [ ] **Console Clean:** No CSP errors or 404s in browser console.
- [ ] **Visual Sanity:** Hero section, typography, and navigation render as expected.
