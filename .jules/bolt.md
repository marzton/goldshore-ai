## 2024-05-23 - [Input Performance]
**Learning:** Found un-debounced search input in `DocsSearch.astro` triggering API calls on every keystroke.
**Action:** Always check input event listeners for missing debounce/throttle, especially when they trigger network requests.
