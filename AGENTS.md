# Agent Instructions

This file contains instructions for AI agents working in this repository.

## Tagging for Review

To request a review of an error or issue, please use the following tags in your comments or pull request descriptions:

*   **@Jules-Bot `[review-request]`**: For a general code review.
*   **@Jules-Bot `[error-analysis]`**: For help in diagnosing and fixing a specific error.
*   **@Jules-Bot `[issue-repro]`**: For assistance in reproducing a reported issue.

Please provide as much context as possible when using these tags, including:

*   A clear description of the issue or the code to be reviewed.
*   Steps to reproduce the error or issue.
*   Any relevant logs or error messages.
*   The expected outcome.

## Consolidated Route Map (gs-website cutover)

GoldShore web properties are being consolidated into a single Cloudflare Pages deployment.

* **Canonical Pages project name:** `gs-website`
* **Legacy projects being sunset:** `goldshore-web`, `gs-web`
* **Canonical app target for web UI work:** `apps/gs-web`

When reviewing, planning, or proposing fixes:

1. Prefer updates that align legacy paths and content into the unified `gs-website` structure.
2. Treat the cinematic HUD-style home experience as the landing-page baseline.
3. Keep shared HUD elements (e.g., system-status pill and terminal-style agent panel) in reusable layout components, not page-specific one-offs.
4. Preserve existing URL compatibility with redirect/proxy rules (for example via `public/_redirects`), and prefer `200` proxy rewrites for live API/status fetch endpoints to avoid CORS regressions.
5. Avoid introducing new references to sunset project names unless required for migration notes.

### Migration orientation

Use this mapping as the default north star for content/layout migration discussions:

| Content Type | Legacy Location | Unified Target |
|---|---|---|
| Cinematic Hero | Preview branch artifacts | `src/components/Hero.astro` |
| System HUD | Preview branch artifacts | `src/layouts/HUDLayout.astro` |
| Markdown Docs | `goldshore-web/docs` (or equivalent) | `src/content/docs/*.md` |
| Redirect rules | Dashboard/manual rules | `public/_redirects` |
