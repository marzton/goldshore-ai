# Frontend Build Audit

## Scope
Audit of the current `@goldshore/gs-web` frontend build pipeline and generated artifacts, based on source files and a local `pnpm -C apps/gs-web build` run.

## Files changed
- `docs/infra/FRONTEND_BUILD_AUDIT.md`
- `docs/infra/FRONTEND_ARCHITECTURE_MAP.md`

## Layout verified
Yes. The homepage currently routes through:
1. `src/pages/index.astro`
2. `src/layouts/MarketingLayout.astro`
3. `src/layouts/WebLayout.astro`

Notes from current source:
- `index.astro` uses `<MarketingLayout ...>`.
- `MarketingLayout.astro` wraps `<WebLayout ...><slot /></WebLayout>`.
- `index.astro` currently closes with `</WebLayout>` rather than `</MarketingLayout>`, and includes duplicated nested hero section markup. This still builds, but increases markup-risk.

## Theme import chain verified
Yes. Current chain is present in source:
- Page-level token import: `@goldshore/theme/tokens` in `index.astro`.
- Layout-level imports: `@goldshore/theme`, plus `@goldshore/theme/styles/{tokens,base,components,layout}` and local `../styles/global.css` in `WebLayout.astro`.
- Package export points and `index.css` import order in `packages/theme` resolve to reset/tokens/base/components/layout CSS.

## CSS bundle present
Yes.
- Generated CSS bundles in `apps/gs-web/dist/_astro/`:
  - `_path_.C5Y_aPFQ.css`
  - `index.DaxsQ9bd.css`
  - `_path_.PUeE2N-W.css`
- `dist/index.html` includes stylesheet links to `/_astro/*.css`.

## JS bundle present
Yes.
- Generated JS bundle in `apps/gs-web/dist/_astro/`:
  - `page.D1uwR3nK.js`
- `dist/index.html` includes module script load for this bundle.

## Asset resolution verified
Yes.
- Source layout imports `logo` from `../assets/logo.svg` and uses `logo.src`.
- Build output resolves this to hashed assets:
  - `dist/_astro/logo.BiM2Pwt_.svg`
  - `dist/assets/logo.svg`
- `dist/index.html` references `/_astro/logo.BiM2Pwt_.svg` in rendered `<img>` tags.

## Hero mount verified
Partially.
- Hero DOM mounts in rendered HTML (`<section class="hero">` with `#gs-starfield` and `#gs-shootingstars` canvases).
- `ParallaxHero.astro` imports `mountHero`, but current inline script does not call `mountHero()`.
- Inline script currently queries `.gs-cinematic-hero` and references `mountStarfield` / `mountShootingStars`, which are not defined in the component file.
- `mountHero.ts` exports a complete mount/unmount lifecycle using `resize` listeners and RAF teardown, but this lifecycle is not currently wired from `ParallaxHero.astro`.

## Risk level
Medium.
- Build completes and emits expected artifact classes (HTML/CSS/JS).
- Runtime risk exists around hero initialization and malformed/duplicated homepage section structure.

## Reversible
Yes.
- Documentation-only change. No runtime code or build configuration was modified.
