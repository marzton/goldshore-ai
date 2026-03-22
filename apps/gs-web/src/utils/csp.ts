const SELF = "'self'";
const UNSAFE_INLINE = "'unsafe-inline'";
const NONE = "'none'";

export type ContentSecurityPolicyDirectives = Readonly<
  Record<string, readonly string[]>
>;

/**
 * Approved external GoldShore API origins for browser runtime requests.
 *
 * Keep this list limited to browser-visible `PUBLIC_API` targets. Server-side Astro
 * fetches can talk to additional origins without expanding browser `connect-src`.
 */
export const GOLDSHORE_API_ORIGINS = [
  'https://api.goldshore.ai',
  'https://api-preview.goldshore.ai',
] as const;

/**
 * Browser runtime call sites that currently require `connect-src` coverage:
 *
 * - `src/components/TryItConsole.astro` calls `${PUBLIC_API}${path}` from the browser.
 * - Same-origin browser requests such as `/api/contact` and `/api/docs-search` stay on `'self'`.
 * - `src/pages/[...path].astro` uses `PUBLIC_API` server-side during Astro rendering, so it is
 *   intentionally excluded from browser `connect-src`.
 *
 * Future AI agents: extend `GOLDSHORE_API_ORIGINS` only when adding a new browser-side fetch target
 * that cannot stay same-origin.
 */
export const WEB_CONNECT_SRC = [SELF, ...GOLDSHORE_API_ORIGINS] as const;

const WEB_SHARED_CSP_DIRECTIVES = {
  'default-src': [SELF],
  'script-src': [SELF, UNSAFE_INLINE],
  'style-src': [SELF, UNSAFE_INLINE, 'https://fonts.googleapis.com', 'https://unpkg.com'],
  'font-src': [SELF, 'https://fonts.gstatic.com'],
  'img-src': [SELF, 'data:'],
  'connect-src': [...WEB_CONNECT_SRC],
  'object-src': [NONE],
  'base-uri': [SELF],
} as const satisfies ContentSecurityPolicyDirectives;

/**
 * Meta CSP is consumed by `src/layouts/WebLayout.astro`.
 * Keep it limited to directives supported by `<meta http-equiv="Content-Security-Policy">`.
 */
const WEB_META_DIRECTIVES = {
  ...WEB_SHARED_CSP_DIRECTIVES,
} as const satisfies ContentSecurityPolicyDirectives;

/**
 * Header CSP is consumed by runtime headers in `src/middleware.ts` and mirrored in `public/_headers`.
 * Header delivery can enforce `frame-ancestors`, which meta CSP cannot.
 */
const WEB_HEADER_DIRECTIVES = {
  ...WEB_SHARED_CSP_DIRECTIVES,
  'frame-ancestors': [NONE],
} as const satisfies ContentSecurityPolicyDirectives;

export function buildContentSecurityPolicy(
  directives: ContentSecurityPolicyDirectives,
): string {
  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Stable legacy export retained for call sites that expect the main web CSP string.
 * This matches the header policy because header delivery is the canonical enforcement path.
 */
export const WEB_CONTENT_SECURITY_POLICY = buildContentSecurityPolicy(
  WEB_HEADER_DIRECTIVES,
);
export const WEB_META_CSP = buildContentSecurityPolicy(WEB_META_DIRECTIVES);
export const WEB_HEADERS_CSP = buildContentSecurityPolicy(WEB_HEADER_DIRECTIVES);
