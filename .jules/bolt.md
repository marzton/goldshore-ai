## 2024-05-23 - [Input Performance]
**Learning:** Found un-debounced search input in `DocsSearch.astro` triggering API calls on every keystroke.
**Action:** Always check input event listeners for missing debounce/throttle, especially when they trigger network requests.

## 2024-05-23 - [Image Optimization]
**Learning:** Found eager loading on below-the-fold images (footer logo).
**Action:** Always apply `loading="lazy"` and `decoding="async"` to images that are not in the initial viewport to prioritize LCP resources.

## 2024-06-03 - [LCP & Dead Code]
**Learning:** Found duplicate/broken implementation in `TryItConsole.astro` and missing `fetchpriority="high"` on LCP image.
**Action:** Always check for duplicate implementations in components and ensure LCP images are prioritized.
