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
## 2025-12-24 - Documentation Search UX
**Learning:** Documentation search bars are high-frequency targets for power users. A simple visual hint (`⌘K`) combined with a global shortcut significantly reduces friction and aligns with industry standards (e.g., Algolia DocSearch, MDN).
**Action:** Enhanced `DocsSearch.astro` with a `⌘K` keyboard shortcut, added visual hints using semantic `<kbd>` tags, and improved the "No results" state to reduce user frustration.
## 2024-05-21 - Active Navigation State
**Learning:** The documentation sidebar relied solely on text color to indicate the active page, failing WCAG 1.4.1 (Use of Color). Visual indicators must be redundant (color + shape/weight).
**Action:** Implemented `aria-current="page"` for semantic indication and added a left border + font weight change to `DocsSidebar` links for robust visual accessibility.
## 2025-12-24 - Nested Route Navigation
**Learning:** Basic equality checks (`currentPath === link.href`) fail for nested application routes (e.g. `/admin/settings/security` vs `/admin/settings`), causing the parent nav item to lose its active state.
**Action:** Implemented a robust `isActive` utility in Sidebar components that uses `startsWith` logic (with trailing slash normalization) to maintain context for users deep in a section.
## 2026-01-02 - Semantic Sticky Navigation
**Learning:** Sidebars in long documentation pages often lose context when scrolling. Sticky positioning combined with explicit `aria-current="page"` provides persistent context for both sighted and screen reader users.
**Action:** Apply `position: sticky` and `aria-current` to all sidebar navigation components to improve wayfinding.

## 2025-05-24 - Accessible Tabs
**Learning:** Tab interfaces often neglect keyboard navigation, failing WAI-ARIA standards. Users expect Arrow keys to switch tabs, not just Tab key (which should only land on the *active* tab).
**Action:** Implemented "roving tabindex" in `Tabs` component: only the active tab is focusable (`tabindex="0"`), others are skipped (`tabindex="-1"`). Arrow keys move focus and selection.

## 2026-05-25 - Code Block Feedback
**Learning:** Standard Markdown rendering in Astro (`.md` files) often bypasses custom component mappings defined in `.astro` pages, limiting the ability to enhance code blocks with interactive features like copy buttons.
**Action:** Implemented a robust `MDXCodeBlock` component with global event delegation for copy functionality and accessibility (ARIA labels, focus states). Used manual `MDXCodeBlock` in `.astro` pages where `.md` limitations prevented automatic replacement.
