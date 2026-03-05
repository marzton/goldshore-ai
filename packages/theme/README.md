# @goldshore/theme

Design tokens, base styles, and shared components for GoldShore apps.

## Usage

Import the theme in your application entry point or layout:

```astro
import '@goldshore/theme';
```

Assets such as the Penrose mark are available at:

```astro
import logo from '@goldshore/theme/assets/penrose-logo.svg';
```

## Supported CSS Import Paths

The package exposes the following public CSS entry points:

- `@goldshore/theme` (aggregated default theme stylesheet)
- `@goldshore/theme/index.css`
- `@goldshore/theme/styles/global.css`
- `@goldshore/theme/styles/tokens.css`
- `@goldshore/theme/styles/base.css`
- `@goldshore/theme/styles/layout.css`
- `@goldshore/theme/styles/components.css`
- `@goldshore/theme/styles/motion.css`
- `@goldshore/theme/styles/*` for additional files under `styles`

## Structure

- `styles/tokens.css`: colors, spacing, radii, typography, and shadows.
- `styles/base.css`: resets, typography, links, lists, and form defaults.
- `styles/components.css`: buttons, cards, tables, badges, grids, and hero/section helpers.
- `styles/layout.css`: layout primitives for the web and admin shells.
- `src/theme-manager.ts`: helper to load, apply, and persist theme preferences.
- `assets/`: Penrose logo assets for headers and sidebars.

## Responsive Guidance

- Use `gs-section`, `gs-grid`, and `gs-card` classes for consistent spacing.
- Keep navigation + menu styling inside layouts, not individual pages.
- Templates in `apps/gs-web` and `apps/gs-admin` demonstrate recommended usage.

## Integration Notes

Theme tokens are shared by public web, admin, and Cloudflare Worker templates to ensure consistent
visual language across AI tooling, market data dashboards, and ecommerce experiences.

## Theme Authoring Rules

- Canonical source for authored styles is `styles/*`.
- Published style entrypoints are exposed via `@goldshore/theme` and `@goldshore/theme/styles/*` exports.
- `index.css` should only aggregate canonical files from `styles/*`.
- All public style imports must resolve through declared `exports` paths (for example `@goldshore/theme/styles/*`).
