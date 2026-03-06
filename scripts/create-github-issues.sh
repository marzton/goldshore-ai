#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-goldshore/goldshore-ai}"

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI is required" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

create_issue() {
  local title="$1"
  local labels="$2"
  local body="$3"

  echo "Creating: ${title}"
  gh issue create -R "$REPO" --title "$title" --label "$labels" --body "$body"
}

create_issue "EPIC: UX & Accessibility Stabilization (Gold Shore Web)" "epic,ux,a11y,gs-web,theme" "Goals
- Improve accessibility (WCAG-aligned patterns) and UX clarity without large rewrites.
- Establish a predictable source of truth for theme styles and component behavior.
- Convert placeholder surfaces (Risk Radar, Developer) into credible interactive demos.

Definition of Done
- Keyboard-only navigation works across primary flows (nav, modal, forms).
- Screen readers correctly announce nav landmarks, dialogs, form fields, errors, and states.
- Visual focus is visible and consistent.
- prefers-reduced-motion is respected.
- Risk Radar is a working interactive demo with sample data.
- Hero logo animation is implemented safely (low CPU, accessible).

Work breakdown (linked issues)
- 0.1 Theme CSS source of truth and exports alignment
- 0.2 Global focus ring + :focus-visible policy
- 0.3 Reduced motion baseline
- 1.1 Mobile navigation semantics + landmarks
- 1.2 GlobalModal accessibility compliance
- 2.1 Contact form required fields + validation feedback
- RR-* Risk Radar MVP series
- H-* Hero animation series

@Jules-Bot [review-request]"

create_issue "Theme CSS source of truth and exports alignment" "theme,css,build,ux,a11y" "Problem
Edits to packages/theme/styles/... may not ship; confusion between packages/theme/styles/ vs packages/theme/src/styles/ causes CSS changes to not apply consistently.

Targets
- packages/theme/package.json (exports)
- packages/theme/src/styles/* (canonical)
- apps/gs-web, apps/gs-admin imports

Tasks
- Declare canonical CSS source: packages/theme/src/styles/
- Ensure CSS consumed by apps is available via @goldshore/theme exports
- Document rule: do not edit packages/theme/styles/* directly if built output

Acceptance Criteria
- Exactly one canonical location to edit theme CSS (src/styles/)
- All app imports use exported package paths
- CI builds without missing specifier failures (e.g., ./styles/global.css)
- Short docs note with rule + examples

Suggested PR sizing
- PR1: exports + import path corrections
- PR2: docs note + optional cleanup

@Jules-Bot [review-request]"

create_issue "Global focus ring + :focus-visible policy" "theme,a11y,ux" "Targets
- packages/theme/src/styles/* (global/components)

Tasks
- Add consistent focus styling for a, button, input, select, textarea
- Include custom clickable elements (role/button patterns)
- Use :focus-visible (not :focus) to reduce mouse noise
- Ensure ring contrast on dark backgrounds

Acceptance Criteria
- Focus visible for all interactive elements across gs-web + gs-admin
- No regressions for mouse interaction
- Contrast expectations met on dark UI

@Jules-Bot [review-request]"

create_issue "Reduced motion baseline across web + theme" "theme,a11y,performance,ux" "Targets
- packages/theme/src/styles/*
- Hero animation styles
- Transition-heavy components

Tasks
- Add @media (prefers-reduced-motion: reduce) rules:
  - disable non-essential animations
  - disable smooth scrolling
  - shorten/disable transitions
- Ensure no essential info depends on animation

Acceptance Criteria
- Reduced motion disables non-essential animations site-wide
- Hero animation respects reduced motion

@Jules-Bot [review-request]"

create_issue "gs-web mobile navigation semantics + landmarks" "gs-web,ux,a11y,nav" "Problem
Mobile menu has modal triggers as anchors and missing labeled nav landmark; button styles regress in some builds.

Targets
- apps/gs-web/src/components/SiteNav.astro
- Theme styles for .gs-mobile-links and child button

Tasks
- Wrap mobile links in <nav aria-label=\"Mobile Primary\">
- Convert modal triggers from <a href=\"#\"> to <button type=\"button\">
- Add aria-haspopup=\"dialog\" for modal triggers
- Ensure nav toggle has aria-controls, aria-expanded, non-empty accessible label
- Fix mobile menu button styling parity in production build

Acceptance Criteria
- No scroll-to-top click behavior from href=\"#\"
- Screen readers announce modal triggers as buttons
- Keyboard flow is logical; aria-expanded accurate
- Buttons render intended theme styling in mobile menu

@Jules-Bot [review-request]"

create_issue "GlobalModal accessibility compliance (dialog semantics + focus)" "theme,a11y,ux,modal" "Problem
Modal must behave as an accessible dialog with robust keyboard/screen-reader behavior.

Targets
- packages/theme/src/components/GlobalModal.astro

Tasks
- Ensure modal root includes role=\"dialog\", aria-modal=\"true\", tabindex=\"-1\"
- Wire aria-labelledby / aria-describedby to real elements
- Focus behavior:
  - store opener on open
  - focus modal container or first focusable
  - trap focus (Tab / Shift+Tab)
  - return focus to opener on close
- Escape-to-close support

Acceptance Criteria
- SR announces dialog + title
- Focus moves into modal and remains trapped
- Escape closes modal
- Focus returns to trigger on close

Notes
- Keep runtime wiring separate from rendering
- Avoid UI logic in packages/theme/index.ts

@Jules-Bot [review-request]"

create_issue "gs-web contact form: required fields + validation feedback" "gs-web,ux,a11y,forms" "Targets
- apps/gs-web/src/pages/contact.astro

Tasks
- Add required and aria-required where needed
- Add explicit label for each field
- Add inline help for project brief field
- Submit UX: disabled state while sending; success/failure aria-live=\"polite\" region
- Add meaningful autocomplete attributes

Acceptance Criteria
- SR announces labels and required state
- Visible success/failure feedback exists
- Keyboard-only form completion works cleanly

@Jules-Bot [review-request]"

create_issue "EPIC: Risk Radar MVP (Interactive Orbital Exposure Map)" "epic,gs-web,ux,viz,demo" "Objective
Replace placeholder Risk Radar page with a working interactive demo for:
- systemic exposure
- volatility pressure
- signal drift
- dependency density

Child Issues
- RR-0 Page scaffold + data plumbing
- RR-1 Orbital map render (SVG/D3)
- RR-2 Interaction: tooltip + select -> details panel
- RR-3 Filters + simulate event
- RR-4 Accessibility polish

@Jules-Bot [review-request]"

create_issue "RR-0: Risk Radar page scaffold + data plumbing" "gs-web,demo,viz" "Targets
- apps/gs-web/src/pages/risk-radar.astro
- apps/gs-web/public/data/risk-radar.sample.json

Tasks
- Build layout: controls panel, map canvas, detail panel, legend
- Load sample JSON from /public/data

Acceptance Criteria
- Page renders with sample data
- Controls/panels exist even before full interactivity

@Jules-Bot [review-request]"

create_issue "RR-1: Orbital map render (SVG/D3)" "gs-web,viz,demo" "Targets
- apps/gs-web/src/components/risk-radar/OrbitalMap.ts
- apps/gs-web/src/components/risk-radar/OrbitalMap.astro

Spec
- 4 rings = tiers 1-4
- Nodes around rings (polar layout)
- Status via color + icon/shape (not color alone)
- Legend for status/tier meaning

Acceptance Criteria
- 4 rings visible
- Nodes render with labels/tooltips
- Responsive scaling mobile/desktop

@Jules-Bot [review-request]"

create_issue "RR-2: Interaction (tooltip + select -> details panel)" "gs-web,viz,ux" "Tasks
- Hover/focus tooltip for node summary
- Click selects node and populates details panel
  - status
  - pressure/drift metrics
  - dependencies

Acceptance Criteria
- Tooltip appears on hover/focus
- Selected node visually distinct
- Details panel updates correctly

@Jules-Bot [review-request]"

create_issue "RR-3: Filters + simulate event behavior" "gs-web,viz,ux,demo" "Tasks
- Filters: status (ok/warn/crit), tier, env
- Simulate event:
  - increase pressure/drift across dependency chain
  - animate transition (disabled for reduced motion)
- Reset to baseline

Acceptance Criteria
- Filters update map without reload
- Simulate visibly changes metrics and node styles
- Reset restores baseline

@Jules-Bot [review-request]"

create_issue "RR-4: Risk Radar accessibility polish" "gs-web,a11y,viz" "Tasks
- Keyboard navigation to nodes (or alternate list)
- Enter selects node
- Reduced motion disables transitions
- Non-color indicators for status
- aria-live updates for selection changes

Acceptance Criteria
- Usable without mouse
- SR announcements sensible for selection changes

@Jules-Bot [review-request]"

create_issue "EPIC: Hero Mark Animation (Accessible, low CPU)" "epic,gs-web,ux,performance,a11y" "Objective
Deliver premium animated hero mark with low CPU overhead and robust accessibility.

Child Issues
- H-0 Create HeroLogo component + inline SVG
- H-1 Stroke-draw intro animation
- H-2 Idle glow pulse + reduced motion
- H-3 Pause when offscreen (optional micro JS)

@Jules-Bot [review-request]"

create_issue "H-0: Create HeroLogo component and inline SVG" "gs-web,ux" "Targets
- apps/gs-web/src/components/hero/HeroLogo.astro
- Replace usage in apps/gs-web/src/pages/index.astro (or hero layout)

Tasks
- Inline mark SVG (no text)
- Add hooks: .gs-hero-logo, .gs-logo-stroke, .gs-logo-glow

Acceptance Criteria
- Hero uses new component
- No layout shift

@Jules-Bot [review-request]"

create_issue "H-1: Stroke-draw intro animation (CSS only)" "gs-web,ux,performance" "Tasks
- Use stroke-dasharray + stroke-dashoffset to draw outline
- Duration ~1.0–1.6s, ease-out
- CSS-only, no JS required

Acceptance Criteria
- Runs once on load
- Looks clean on dark backgrounds
- No JS dependency

@Jules-Bot [review-request]"

create_issue "H-2: Idle glow pulse + reduced motion support" "gs-web,a11y,performance" "Tasks
- Add subtle glow pulse (6–10s loop) via CSS
- Disable all animation when prefers-reduced-motion is set

Acceptance Criteria
- Pulse remains subtle
- Reduced motion disables animation reliably

@Jules-Bot [review-request]"

create_issue "H-3: Pause hero animation when offscreen (optional micro JS)" "gs-web,performance" "Tasks
- Use IntersectionObserver to toggle .is-paused
- Disable animations while paused

Acceptance Criteria
- Animation stops when hero offscreen
- No visible glitches when returning

@Jules-Bot [review-request]"

create_issue "EPIC: Cloudflare Deployments & Cross-App Integration (prod + preview)" "epic,cloudflare,deployment,infra,integration" "Objective
Production + preview deployments for:
- Workers: gs-gateway, gs-control, gs-api, gs-mail
- Pages: gs-web, gs-admin

Also enforce cross-app integration:
- Front-end env wiring
- Worker service bindings
- Shared config safety

Definition of Done
- Every service has production (main) and preview (PR) deployment
- Canonical env names: dev, preview, prod
- Standard frontend vars: PUBLIC_API, PUBLIC_GATEWAY (+ optional PUBLIC_CONTROL, PUBLIC_MAIL)
- Worker bindings align by environment
- Preview never leaks to production origins/resources unintentionally

Child Issues
- CF-0 through CF-7

@Jules-Bot [review-request]"

create_issue "CF-0: Establish canonical environment + domain contract doc" "cloudflare,infra,docs,integration" "Problem
Preview/prod URLs and bindings are scattered across Wrangler files and workflows.

Targets
- docs/architecture/domains-and-env.md (new) or update docs/domains-and-auth.md

Tasks
Document canonical hostnames and ownership for prod + preview:
Prod:
- goldshore.ai (gs-web)
- admin.goldshore.ai (gs-admin)
- api.goldshore.ai (gs-api)
- gw.goldshore.ai (+ optional gateway.goldshore.ai)
- ops.goldshore.ai (gs-control)
- mail.goldshore.ai or internal-only (gs-mail)

Preview:
- preview.goldshore.ai (or CF Pages preview-web domain)
- preview-admin.goldshore.ai (or preview admin pages domain)
- api-preview.goldshore.ai
- gw-preview.goldshore.ai
- ops-preview.goldshore.ai
- mail-preview.goldshore.ai (if exposed)

Acceptance Criteria
- One doc defines all env hostnames and deployment ownership
- Workflows align with the documented contract

@Jules-Bot [review-request]"

create_issue "CF-1: Standardize Wrangler env blocks across workers (dev/preview/prod)" "cloudflare,workers,infra" "Targets
- apps/gs-gateway/wrangler.toml
- apps/gs-control/wrangler.toml
- apps/gs-api/wrangler.toml
- apps/gs-mail/wrangler.toml

Tasks
- Ensure each has env.preview and env.prod (plus dev where needed)
- Standardize worker naming across envs
- Ensure preview routes/domains are preview-only
- Duplicate required bindings per env (no fragile top-level inheritance)

Acceptance Criteria
- wrangler deploy --env preview deploys preview worker/routes
- wrangler deploy --env prod deploys production worker/routes
- Preview does not use prod KV/R2/D1 unless explicitly intended

@Jules-Bot [review-request]"

create_issue "CF-2: gs-web Pages production + preview deploy env parity" "cloudflare,pages,gs-web,integration" "Targets
- .github/workflows/deploy-gs-web.yml
- .github/workflows/preview-gs-web.yml
- apps/gs-web build env usage

Tasks
- Prod build env:
  - PUBLIC_API=https://api.goldshore.ai
  - PUBLIC_GATEWAY=https://gw.goldshore.ai
  - PUBLIC_ENV=production
- Preview build env:
  - PUBLIC_API=https://api-preview.goldshore.ai
  - PUBLIC_GATEWAY=https://gw-preview.goldshore.ai
  - PUBLIC_ENV=preview
- Consistent metadata vars:
  - PUBLIC_BUILD_TIMESTAMP
  - PUBLIC_COMMIT_HASH

Acceptance Criteria
- Prod web calls prod backends only
- Preview web calls preview backends only
- No mixed-environment calls

@Jules-Bot [review-request]"

create_issue "CF-3: gs-admin Pages production + preview deploy env parity" "cloudflare,pages,gs-admin,integration" "Targets
- .github/workflows/deploy-gs-admin.yml
- .github/workflows/preview-gs-admin.yml
- apps/gs-admin build env usage

Tasks
- Ensure prod sets prod API/gateway env vars
- Ensure preview sets preview API/gateway env vars
- Include PUBLIC_ENV and build metadata vars consistently

Acceptance Criteria
- Admin preview uses preview backends only
- Admin prod uses prod backends only

@Jules-Bot [review-request]"

create_issue "CF-4: gs-gateway <-> gs-api service binding parity across envs" "cloudflare,workers,integration" "Problem
Gateway must route to same-environment API only.

Targets
- apps/gs-gateway/wrangler.toml
- apps/gs-api/wrangler.toml

Tasks
- Ensure service binding API points to gs-api preview in preview env and prod in prod env
- Ensure API_ORIGIN matches environment
- Verify preview hostname routes are present

Acceptance Criteria
- gw-preview never hits prod api
- gw (prod) targets prod api

@Jules-Bot [review-request]"

create_issue "CF-5: gs-control bindings and preview control-plane capability" "cloudflare,workers,ops,integration" "Targets
- apps/gs-control/wrangler.toml
- preview/prod workflows for control

Tasks
- Add preview env route (ops-preview.goldshore.ai/* or equivalent)
- Bind preview control to preview gateway/api
- Keep secrets out of repo and sourced from CI/Cloudflare secrets

Acceptance Criteria
- Preview control operates only on preview stack
- Production control operates only on production stack

@Jules-Bot [review-request]"

create_issue "CF-6: gs-mail production + preview deployment and env-safe integration" "cloudflare,workers,mail,integration" "Inputs
- Existing worker uses nodejs_compat
- KV binding GS_CONFIG
- Vars include ENV and MAIL_FORWARD_TO

Tasks
- Add env.preview block and preview worker name (e.g., gs-mail-preview)
- Decide exposure model:
  - internal-only (preferred), or
  - route (mail-preview.goldshore.ai/*) if required
- Ensure MAIL_FORWARD_TO is env-safe
- Validate KV strategy:
  - separate namespaces preferred, or
  - strict key prefixing (prod:*, preview:*) if shared

Acceptance Criteria
- wrangler deploy --env preview works
- Preview does not unintentionally forward to prod destinations
- KV keys/namespaces are env-safe

@Jules-Bot [review-request]"

create_issue "CF-7: Shared integration env contract module + runtime validation" "integration,dx,gs-web,gs-admin,gs-gateway,gs-api,theme" "Problem
Env var names and URL logic are duplicated/hardcoded across apps.

Targets
- packages/config or packages/utils/env contract module
- Frontend + worker consumers

Tasks
- Define shared contract for:
  - Frontend: PUBLIC_API, PUBLIC_GATEWAY, PUBLIC_ENV, PUBLIC_BUILD_TIMESTAMP, PUBLIC_COMMIT_HASH
  - Workers: API_ORIGIN and any required internal origins
- Add zod (or equivalent) runtime/build-time validation with fail-fast behavior

Acceptance Criteria
- Frontends fail build when required PUBLIC_* vars are missing
- Workers fail deploy/build when required vars are missing
- Env var names are centralized and reused

@Jules-Bot [review-request]"

echo "Done."
