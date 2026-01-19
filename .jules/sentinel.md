# Sentinel Journal

## 2025-12-16 - Unprotected Internal API Exposure
**Vulnerability:** The `gs-api` worker (`api.goldshore.ai`) was configured with a Cloudflare Access "bypass" policy but lacked application-level authentication. This exposed the internal API publicly.
**Learning:** Infrastructure-as-Code (`desired-state.yaml`) assumed "bypass" meant "handle auth elsewhere" (e.g., via Gateway), but the API worker didn't implement it. Reliance on network-layer security alone (which was disabled) caused a gap.
**Prevention:** Always implement "Defense in Depth". Internal APIs should verify authentication tokens (e.g., Service Tokens or JWTs) even if they are expected to be behind a gateway. Never assume upstream protection is sufficient.

## 2025-12-17 - Client-side XSS in DocsSearch
**Vulnerability:** `DocsSearch.astro` used `innerHTML` to render search results, which could allow XSS if the search API returned malicious titles or URLs.
**Learning:** Even in server-rendered frameworks like Astro, client-side scripts inside components are vulnerable to traditional DOM XSS patterns when handling API responses.
**Prevention:** Use `textContent` or `document.createElement` when rendering dynamic data in client scripts, avoiding `innerHTML` unless absolutely necessary and sanitized.

## 2025-12-18 - Missing Audience Validation in Auth
**Vulnerability:** The shared `verifyAccess` utility checked the Token Issuer but ignored the Audience claim. This allowed a valid Cloudflare Access token from *any* application in the GoldShore organization to authenticate against *any other* internal service using this library.
**Learning:** Checking the Issuer alone is insufficient in a multi-app environment sharing an Identity Provider tenant.
**Prevention:** Always validate the `aud` (Audience) claim to ensure the token was issued specifically for the target service. Updated `@goldshore/auth` to enforce this when `CLOUDFLARE_ACCESS_AUDIENCE` is present in the environment.

## 2025-12-19 - Server-side XSS in DocsSidebar
**Vulnerability:** `DocsSidebar.astro` used `set:html` with a manually constructed HTML string for links, which would allow XSS if a documentation page title contained malicious scripts.
**Learning:** Even internal content (like content collections) should be treated as untrusted to enforce "Defense in Depth". Avoiding manual HTML string construction prevents this class of bugs entirely.
**Prevention:** Use Astro's native expression syntax `{variable}` instead of `set:html` or `Fragment` whenever possible. It automatically handles escaping.

## 2026-01-09 - Missing Security Headers in Admin App
**Vulnerability:** The `apps/admin` application (dashboard) lacked standard HTTP security headers (`X-Frame-Options`, `HSTS`, `X-Content-Type-Options`), making it potentially vulnerable to clickjacking and MIME sniffing.
**Learning:** When creating new Astro apps in a monorepo, middleware (and thus security headers) is not automatically inherited from other apps.
**Prevention:** Enforce a standard `middleware.ts` template for all new Astro applications or move security headers to the infrastructure layer (Cloudflare `_headers` or Gateway rules) if consistent application-level enforcement is prone to oversight.
