# Sprint 1 Release Gate

## Route QA (Desktop + Mobile)

- [x] `/` renders with finalized messaging hierarchy and CTA behavior.
- [x] `/contact` submits through API route and displays accessible status messaging.
- [x] `/thank-you` is reachable from successful contact submission path.

## Accessibility Basics

- [x] Labels are present for all required contact fields.
- [x] Focus order follows DOM order through hero and form controls.
- [x] Keyboard-only submit path works (`Tab` + `Enter/Space`).
- [x] Status updates are readable and announced via `aria-live`.

## Contact/API Reliability

- [x] Validation errors return a consistent JSON contract.
- [x] Success returns a consistent JSON contract for SPA submissions.
- [x] Persistence is attempted before outbound email and remains authoritative.
- [x] Structured logs exist for validation failure, spam block, persistence failure, and outbound email attempts.

## Sign-off

- [x] Content — Approved (2026-04-04)
- [x] Frontend — Approved (2026-04-04)
- [x] Product — Approved (2026-04-04)
