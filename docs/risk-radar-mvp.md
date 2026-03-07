# Risk Radar MVP — Interactive Orbital Exposure Map

## Epic
**Risk Radar MVP**

## Objective
Replace the placeholder Risk Radar page with a working interactive demo that communicates:
- systemic exposure
- volatility pressure
- signal drift
- dependency density

## Target audience
- Prospective clients evaluating operational rigor
- Technical visitors validating implementation capability
- Internal and investor-facing demo audiences

---

## RR-0 — Page scaffold + data plumbing

**Targets**
- `apps/gs-web/src/pages/risk-radar.astro`
- `apps/gs-web/public/data/risk-radar.sample.json`

**Work**
- Build page shell with four regions:
  - controls panel
  - map/canvas region
  - detail panel
  - legend
- Load sample JSON from `public/data`.

**Acceptance criteria**
- Page renders using sample data.
- Controls and panel regions are present even if initially non-functional.

---

## RR-1 — Orbital map render (SVG / D3)

**Targets**
- `apps/gs-web/src/components/risk-radar/OrbitalMap.ts`
- `apps/gs-web/src/components/risk-radar/OrbitalMap.astro`

**Visualization spec**
- Rings represent tiers (1–4).
- Nodes are positioned around rings using polar layout.
- Status uses color **plus** icon/shape (not color-only).
- Legend maps status and tier meaning.

**Acceptance criteria**
- Four rings visible.
- Nodes render with labels/tooltips.
- Responsive scaling works for mobile and desktop.

---

## RR-2 — Interaction: hover tooltip + selection drives details panel

**Targets**
- `Controls.astro`
- `DetailsPanel.astro`
- map component(s)

**Work**
- Hover/focus on node shows tooltip summary.
- Click/keyboard select sets active node and updates detail panel:
  - status
  - pressure/drift metrics
  - dependencies

**Acceptance criteria**
- Tooltip appears on hover and keyboard focus.
- Selected node is visually distinct.
- Detail panel updates correctly from active selection.

---

## RR-3 — Filters + simulate event

**Work**
- Add filters for:
  - status (`ok`, `warn`, `crit`)
  - tier
  - environment
- Add “simulate event” action to increase pressure/drift along a dependency chain.
- Animate metric/node transitions, but disable animation when reduced motion is requested.
- Add reset to baseline state.

**Acceptance criteria**
- Filters update map state without full reload.
- Simulation visibly changes metrics and node styling.
- Reset reliably restores baseline data/state.

---

## RR-4 — Accessibility polish

**Work**
- Keyboard navigation:
  - tab to map nodes (or accessible parallel list)
  - Enter/Space selects
- Respect `prefers-reduced-motion`.
- Ensure non-color indicators for status (icons/labels/patterns).
- Announce selection changes with `aria-live` in details panel.

**Acceptance criteria**
- Usable without mouse.
- Selection and state changes are understandable to screen reader users.

---

## Suggested architecture notes
- Keep visualization rendering isolated from data transforms.
- Use explicit state shape:
  - `nodes`
  - `edges`
  - `filters`
  - `selectedNodeId`
  - `simulationState`
- Keep sample data schema stable to support future API replacement.
- Prefer progressive enhancement: meaningful static fallback before hydration.

## Definition of done (MVP)
- Interactive map with real sample data, filter controls, tooltip, and detail panel.
- Keyboard and screen-reader accessible selection path.
- Reduced-motion compliant interactions.
