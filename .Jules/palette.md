# Palette's Journal

## 2025-12-14 - Polymorphic Button Accessibility
**Learning:** Found usage of `<a>` tags with `href="#"` for button-like actions in Admin UI, which breaks accessibility and semantics (no native `disabled` support).
**Action:** Refactored `GSButton` to be polymorphic (renders `<button>` when no `href`), enabling native `disabled` state and keyboard interaction.

## 2025-12-15 - Interactive API Console Fix
**Learning:** Found the "Try It" console in API docs was attempting to use server-side variables in client-side handlers (`onclick="send()"`), making it completely non-functional. Astro components separate server-frontmatter from client-scripts.
**Action:** Rewrote `TryItConsole.astro` using standard DOM manipulation in a `<script>` tag, enabling functional API testing. Added loading states, status badges, and response timing for a better developer experience.

## 2025-12-19 - Contact Form Accessibility
**Learning:** Standard HTML forms often lack explicit association between helper text and inputs, making them opaque to screen reader users. `aria-describedby` is the semantic bridge needed.
**Action:** Enhanced Contact Form with `autocomplete` attributes for faster completion and linked helper text via `aria-describedby` for robust accessibility.

## 2025-12-20 - Navigation State Consistency
**Learning:** Visual active states (CSS classes) often lack the corresponding semantic `aria-current="page"` attribute, leaving screen reader users unaware of their current location. Also, "Index" pages often fail to highlight in navigation because of slug mismatches (undefined vs 'index').
**Action:** Enforced pairing of visual active classes with `aria-current="page"` and ensured root pages pass explicit context to navigation components.
