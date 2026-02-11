# Design System Token Audit

## Theme/token definitions discovered

### Shared packages
- `packages/theme/src/styles/tokens.css` – canonical `--gs-*` design tokens (color, spacing, typography, radius, shadow, breakpoints).
- `packages/theme/index.css` – imports/reset/base/component/layout layers.
- `packages/theme/src/styles/base.css` – global typography + utility classes consuming tokens.
- `packages/theme/src/styles/components.css` – shared component primitives (`.gs-button`, `.gs-card`, badges, form controls).
- `packages/theme/src/styles/layout.css` – shell/layout patterns and admin scaffolding.
- `packages/theme/src/styles/primitives.css` – new shared visual primitives for glass, hero, and lux card surfaces.
- `packages/ui/components/*.astro` – Astro primitives (`Button`, `Card`, `Badge`, etc.) that consume `gs-*` classes from theme CSS.

### App-level styles
- `apps/gs-web/src/styles/global.css` – imports `@goldshore/theme` and app effects.
- `apps/gs-web/src/styles/gs-effects.css` – motion/depth effect tokens (`--gs-shadow-layered-*`, parallax offsets).
- `apps/gs-web/src/styles/home.css` – homepage-specific surfaces/gradients now wired to tokenized RGB vars.
- `apps/gs-web/public/apps/risk-radar/styles.css` – static app stylesheet migrated to use global `--gs-*` tokens.
- `astro-goldshore/apps/web/src/styles/global.css` – legacy app global style consuming `@theme/tokens.css`.

### Root `src/`
- `src/styles/global.css` – legacy site tokens now sourced from shared `packages/theme` aliases.

### Tailwind
- `tailwind.config.mjs` – no token extensions yet; global scanning includes `apps/`, `src/`, and `packages/`.

## Consolidation outcome
- Source of truth: `packages/theme/src/styles/tokens.css`.
- Legacy aliases (`--accent`, `--gray-dark`, `--space-*`, etc.) now map to shared token namespace to avoid breakage while migrating.
- Shared visual primitives were extracted to `packages/theme/src/styles/primitives.css` for re-use.

## Guardrails
- ESLint now blocks hard-coded hex / px literals in JS/TS contexts.
- Stylelint now enforces token usage for color and spacing-related CSS declarations.
