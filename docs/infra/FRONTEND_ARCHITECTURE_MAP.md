# Frontend Architecture Map

This map reflects the current implementation and build outputs for `apps/gs-web`.

## CSS load order

### Source-level import sequence
1. `src/pages/index.astro`
   - Imports `@goldshore/theme/tokens`
   - Imports local `../styles/home.css`
2. `src/layouts/WebLayout.astro`
   - Imports `@goldshore/theme`
   - Imports `@goldshore/theme/styles/tokens`
   - Imports `@goldshore/theme/styles/base`
   - Imports `@goldshore/theme/styles/components`
   - Imports `@goldshore/theme/styles/layout`
   - Imports local `../styles/global.css`
3. `packages/theme/index.css`
   - `@import './reset.css'`
   - `@import './src/styles/tokens.css'`
   - `@import './src/styles/base.css'`
   - `@import './src/styles/components.css'`
   - `@import './src/styles/layout.css'`

### Rendered build output
In `dist/index.html`, stylesheet links are emitted for hashed CSS bundles under `/_astro/`.
Current build shows:
- `/_astro/_path_.C5Y_aPFQ.css`
- `/_astro/index.DaxsQ9bd.css`
- `/_astro/_path_.PUeE2N-W.css`

## Layout chain

Current homepage layout chain:

`src/pages/index.astro` -> `src/layouts/MarketingLayout.astro` -> `src/layouts/WebLayout.astro`

- `index.astro` renders `<MarketingLayout ...>`.
- `MarketingLayout.astro` is a pass-through wrapper that renders `<WebLayout ...><slot /></WebLayout>`.
- `WebLayout.astro` owns `<html>`, `<head>`, primary nav, page shell, and footer.

## Asset import pattern

### Pattern in source
- Static assets are imported as modules in Astro components/layouts (example: `import logo from '../assets/logo.svg'` in `WebLayout.astro`).
- Components then use `logo.src` to output the resolved URL.

### Pattern in build output
- Astro emits hashed asset filenames in `dist/_astro/` for cache-busted references in HTML.
- Non-hashed copies may also appear under `dist/assets/`.
- Example from current build:
  - `dist/_astro/logo.BiM2Pwt_.svg`
  - `dist/assets/logo.svg`

## Hero mount lifecycle

### Intended lifecycle module
`src/components/hero/mountHero.ts` exports `mountHero()` which:
1. Locates `#gs-starfield` and `#gs-shootingstars` canvases.
2. Fits canvases to DPR-aware dimensions.
3. Starts RAF render loops via `drawStars`.
4. Subscribes to `window.resize` and returns an unmount function that cancels RAF loops and removes listeners.

### Current component wiring
`src/components/hero/ParallaxHero.astro`:
- Renders the hero section and both canvas nodes.
- Imports `mountHero` in inline script.
- Currently does not call `mountHero()`.
- Uses alternate logic scanning `.gs-cinematic-hero` and references `mountStarfield` / `mountShootingStars` symbols that are not defined in this file.

Result: lifecycle module exists but is not the active mount path in current rendered behavior.

## Bundle output structure

Current build output structure includes:
- `dist/index.html`
- `dist/_astro/*.css`
- `dist/_astro/*.js`

Observed files from latest local build include:
- `dist/index.html`
- `dist/_astro/index.DaxsQ9bd.css`
- `dist/_astro/_path_.C5Y_aPFQ.css`
- `dist/_astro/_path_.PUeE2N-W.css`
- `dist/_astro/page.D1uwR3nK.js`
