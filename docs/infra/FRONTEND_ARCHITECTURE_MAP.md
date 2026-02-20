# FRONTEND_ARCHITECTURE_MAP

## CSS load order
1. `apps/gs-web/src/layouts/WebLayout.astro`
   - `import '@goldshore/theme/styles/global.css';`
   - `import '../styles/global.css';`
2. `apps/gs-web/src/styles/global.css`
   - imports local `./gs-effects.css`
   - defines app-level root/body typography smoothing
3. Route-level styles (example): `apps/gs-web/src/pages/index.astro` imports `../styles/home.css`

## Layout chain
- `apps/gs-web/src/pages/index.astro`
  -> `apps/gs-web/src/layouts/MarketingLayout.astro`
  -> `apps/gs-web/src/layouts/WebLayout.astro`

## Asset import pattern
- Logos and compiled static assets should use Astro/Vite imports:
  - `import logo from '../assets/logo.svg';`
  - `<img src={logo.src} ... />`
- Build emits hashed assets to `dist/_astro/` and rewrites references in HTML.

## Hero mount lifecycle
- Component: `apps/gs-web/src/components/hero/ParallaxHero.astro`
  - Marks root with `data-hero-root`
  - Uses scoped canvases (`data-stars`, `data-shooting`)
  - Runs one client script block to initialize each hero root once
- Runtime mount module: `apps/gs-web/src/components/hero/mountHero.ts`
  - Accepts a root node
  - Mounts starfield and shooting-stars canvases from scoped selectors
  - Returns teardown callback

## Bundle output structure
After `pnpm --filter @goldshore/gs-web build`:
- `apps/gs-web/dist/index.html`
- `apps/gs-web/dist/_astro/*.css`
- `apps/gs-web/dist/_astro/*.js`
- `index.html` contains hashed `/_astro/...` stylesheet and module script references.
