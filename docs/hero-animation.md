# Hero Mark Animation System (Accessible, Low CPU)

## Epic
**Hero Mark Animation**

## Objectives
- Make the hero feel premium and alive without heavy JS/WebGL.
- Respect accessibility preferences by default.
- Keep performance predictable on mobile and low-power devices.

---

## H-0 — Create `HeroLogo` component + inline SVG

**Targets**
- `apps/gs-web/src/components/hero/HeroLogo.astro`
- Replace usage in `apps/gs-web/src/pages/index.astro` (or shared hero component)

**Work**
- Inline logo mark SVG (mark only; no text).
- Add class hooks:
  - `.gs-hero-logo`
  - `.gs-logo-stroke`
  - `.gs-logo-glow`

**Acceptance criteria**
- Hero uses `HeroLogo` component.
- No layout shift introduced.

---

## H-1 — Stroke-draw intro animation

**Work**
- Implement path draw effect using `stroke-dasharray` + `stroke-dashoffset`.
- Duration target: ~1.0–1.6s with ease-out timing.

**Acceptance criteria**
- Animation runs once on page load.
- Visuals remain crisp/legible on dark backgrounds.
- No JS required for primary draw animation.

---

## H-2 — Idle glow pulse + reduced motion

**Work**
- Add subtle idle glow pulse (6–10s loop) via `filter: drop-shadow()` or gradient stop animation.
- Add reduced-motion handling:
  - disable intro and idle animation for users with reduced motion preference.

**Acceptance criteria**
- Pulse feels subtle and non-distracting.
- Reduced-motion users receive static hero mark.

---

## H-3 (Optional) — Offscreen pause via micro JS

**Work**
- Use `IntersectionObserver` to toggle `.is-paused` when logo/hero exits viewport.
- In paused state, disable animations.

**Acceptance criteria**
- Animation pauses when hero is offscreen.
- No visible glitch when returning onscreen.

---

## Implementation guidelines
- Favor CSS-first animation architecture.
- Keep JS optional and tiny (only lifecycle/pause logic when needed).
- Keep animation definitions centralized in theme/web styles, not scattered inline.
- Ensure meaningful experience remains when animation is disabled.

## Performance and accessibility guardrails
- Avoid continuous expensive paints.
- Keep effect stack minimal (few filters, no heavy blur chains).
- Validate with:
  - keyboard navigation checks
  - reduced-motion checks
  - mobile CPU sanity checks

## Definition of done
- Hero mark animation implemented with accessible defaults, reduced-motion support, and stable performance characteristics.
