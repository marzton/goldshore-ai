# UX & Accessibility Stabilization Roadmap (Gold Shore Web)

## Epic
**UX & Accessibility Stabilization**

## Goals
- Improve accessibility (WCAG-aligned patterns) and UX clarity without large rewrites.
- Establish a predictable source of truth for theme styles and component behavior.
- Convert placeholder surfaces (Risk Radar, Developer) into credible interactive demos.

## Definition of Done (Epic)
- Keyboard-only navigation works across primary flows (navigation, modals, forms).
- Screen readers correctly announce nav landmarks, dialogs, form fields, errors, and state changes.
- Visual focus is visible and consistent across interactive elements.
- `prefers-reduced-motion` is respected for animated surfaces.
- Risk Radar is a working interactive demo with sample data.
- Hero logo animation is implemented safely (low CPU, accessible defaults).

---

## Wave 0 — Foundation (2–4 PRs)

### Issue 0.1 — Theme CSS source of truth + exports alignment

**Problem**
Edits to `packages/theme/styles/*` may not be safely shipped as intended; some app imports can depend on deep paths that should be formalized through package exports.

**Targets**
- `packages/theme/package.json` (exports)
- `packages/theme/src/styles/*` (canonical authoring source)
- App imports in:
  - `apps/gs-web`
  - `apps/gs-admin`

**Acceptance criteria**
- Exactly one canonical location exists for theme CSS authoring: `packages/theme/src/styles/*`.
- Any CSS imported by apps is exported via `@goldshore/theme` package exports.
- CI/build does not fail due to missing deep import specifiers (for example `./styles/global.css`).
- Rule is documented: **do not edit `packages/theme/styles/*` directly** if that folder remains generated output.

**Suggested PR sizing**
- PR1: exports + path corrections (small)
- PR2: docs note + cleanup (optional)

---

### Issue 0.2 — Global focus ring + `:focus-visible` policy

**Targets**
- `packages/theme/src/styles/*` (global/components)

**Work**
- Ensure visible focus styles for:
  - `a`
  - `button`
  - `input`
  - `select`
  - `textarea`
  - custom interactive elements
- Use `:focus-visible` instead of broad `:focus` where appropriate to reduce pointer-noise.
- Ensure focus ring contrast is readable on dark backgrounds.

**Acceptance criteria**
- All interactive controls have a visible, consistent focus indicator.
- Focus ring appears for keyboard navigation and remains legible in dark themes.

---

### Issue 0.3 — Reduced motion baseline

**Targets**
- `packages/theme/src/styles/*`
- Hero animation styles (once implemented)
- Any transition-heavy components

**Work**
- Add/standardize `@media (prefers-reduced-motion: reduce)` behavior to disable non-essential animation and smooth scrolling.
- Ensure essential information is never conveyed only through animation.

**Acceptance criteria**
- Reduced-motion users get minimal/no motion transitions.
- UX remains fully understandable without motion effects.

---

## Wave 1 — Navigation + Modals (3–5 PRs)

### Issue 1.1 — Mobile navigation semantics + landmarks

**Problem**
Mobile menu currently includes modal triggers implemented as anchor links and is missing a clearly labeled mobile nav landmark.

**Targets**
- `apps/gs-web/src/components/SiteNav.astro`
- Shared nav component in theme (if adopted)

**Work**
- Wrap mobile links in `<nav aria-label="Mobile Primary">`.
- Convert modal triggers from `<a href="#">` to `<button type="button">`.
- Add `aria-haspopup="dialog"` to modal triggers.
- Ensure nav toggle includes:
  - `aria-controls="mobile-menu-id"`
  - accurate `aria-expanded` toggling
  - non-empty DOM child (SVG or sr-only text)

**Acceptance criteria**
- No click trigger causes scroll-to-top due to `href="#"`.
- Screen readers announce modal triggers as buttons.
- Keyboard tab order is logical; toggle opens/closes; Escape closes when implemented.
- Toggle accurately updates `aria-expanded`.

---

### Issue 1.2 — GlobalModal accessibility compliance (dialog semantics + focus)

**Problem**
Modals must behave as true dialogs for keyboard and assistive technologies.

**Targets**
- `apps/gs-web/src/components/GlobalModal.astro`
- `@goldshore/theme/runtime` only if required

**Work**
- Modal root must include:
  - `role="dialog"`
  - `aria-modal="true"`
  - `tabindex="-1"`
  - `aria-labelledby` and `aria-describedby` mapped to real elements
- Focus management:
  - store opener element on open
  - move focus to modal container or first focusable element
  - trap focus while open
  - return focus to opener on close
- Implement Escape-to-close using existing close hook.

**Acceptance criteria**
- Screen reader announces dialog role + title.
- Focus moves inside on open.
- Tab/Shift+Tab cannot escape modal while open.
- Escape closes modal.
- Focus returns to opener after close.

**Notes**
- Keep runtime wiring (open/close behavior) separate from rendering markup.
- Avoid injecting UI logic into `packages/theme/index.ts` exports surface.

---

## Wave 2 — Forms & Conversion UX (3–6 PRs)

### Issue 2.1 — Contact form required fields + validation feedback

**Targets**
- `apps/gs-web/src/pages/contact.astro`

**Work**
- Add `required` and `aria-required="true"` where needed.
- Add explicit `<label>` for each field.
- Add inline helper text for project brief (what to include).
- Add submit feedback:
  - disabled state while sending
  - success/failure message area with `aria-live="polite"`
- Add meaningful `autocomplete` attributes (for example `autocomplete="email"`).

**Acceptance criteria**
- Screen readers announce labels and required state.
- User receives visible confirmation on submit.
- Field semantics/autocomplete are correct.

---

### Issue 2.2 — Onboarding intake wizard v1 (optional)

**Targets**
- New page: `apps/gs-web/src/pages/intake.astro`
- New components: `apps/gs-web/src/components/intake/*`

**Work**
Create a multi-step form collecting:
- industry
- goals/pain points
- services of interest
- timeline

Generate a summary step and submit to existing contact endpoint (or mail worker).

**Acceptance criteria**
- Progress indicator included.
- Back/Next controls available.
- Summary can be copied.
- Keyboard-only operation is fully supported.

---

## Wave 3 — Content depth + credibility (4–10 PRs)

### Issue 3.1 — Services page expansion (cards + detail routes)

**Targets**
- `apps/gs-web/src/pages/services.astro`
- New detail routes under `apps/gs-web/src/pages/services/*`

**Work**
Each service gets:
- overview
- capability list
- tech stack
- example outcomes
- supporting SVG diagram

**Acceptance criteria**
- No thin bullet-only service pages remain.
- Each detail page includes complete metadata (title, description, OG tags).

---

### Issue 3.2 — Case studies section (anonymized)

**Targets**
- `apps/gs-web/src/pages/case-studies.astro`
- `src/content/case-studies/*` (if Astro Content Collections are used)

**Acceptance criteria**
- At least 2 case studies with measurable outcomes.
- SEO-ready structure: heading hierarchy + meta descriptions.

---

## Implementation notes (all issues)
- Keep PRs small and themed: one core concept per PR.
- Do not place UI logic into `packages/theme/index.ts` package surface.
- Keep runtime wiring (`data-gs-modal-open`) separate from modal rendering.
- Prefer incremental merges over broad rewrites to reduce regression risk.
