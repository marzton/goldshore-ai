const SELF = "'self'";
const UNSAFE_INLINE = "'unsafe-inline'";
const NONE = "'none'";

export const GOLDSHORE_API_ORIGINS = [
  'https://api.goldshore.ai',
  'https://api-preview.goldshore.ai',
] as const;

/**
 * Browser runtime call sites that currently require cross-origin `connect-src`.
 *
 * - `src/components/TryItConsole.astro` calls `PUBLIC_API` from the browser.
 * - Preview deployments point `PUBLIC_API` at `https://api-preview.goldshore.ai`.
 *
 * Same-origin browser calls such as `/api/contact` and `/api/docs-search` remain covered by `'self'`.
 * Server-side Astro fetches (for example `src/pages/[...path].astro`) do not use `connect-src`.
 */
export const WEB_CONNECT_SRC = [
  SELF,
  ...GOLDSHORE_API_ORIGINS,
] as const;

export const BROWSER_CONNECT_SRC = [
  SELF,
  ...GOLDSHORE_API_ORIGINS,
] as const;

export const WEB_CSP_DIRECTIVES = {
  'default-src': [SELF],
  'script-src': [SELF, UNSAFE_INLINE, 'https://*.cloudflare.com'],
  'style-src': [SELF, UNSAFE_INLINE, 'https://fonts.googleapis.com', 'https://unpkg.com'],
  'font-src': [SELF, 'https://fonts.gstatic.com'],
  'img-src': [SELF, 'data:', 'https://*.cloudflare.com'],
  'connect-src': [...BROWSER_CONNECT_SRC],
  'frame-ancestors': [NONE],
  'object-src': [NONE],
  'base-uri': [SELF],
} as const;

export function serializeCsp(directives: Record<string, readonly string[]>): string {
  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

export function buildContentSecurityPolicy(
  directives: Record<string, readonly string[]> = WEB_CSP_DIRECTIVES,
): string {
  return serializeCsp(directives);
}

const BASE_CSP_DIRECTIVES = {
  'default-src': [SELF],
  'script-src': [SELF, UNSAFE_INLINE],
  'style-src': [SELF, UNSAFE_INLINE, 'https://fonts.googleapis.com'],
  'font-src': [SELF, 'https://fonts.gstatic.com'],
  'img-src': [SELF, 'data:'],
  'connect-src': [...WEB_CONNECT_SRC],
  'object-src': [NONE],
  'base-uri': [SELF],
} as const;

const HEADER_CSP_DIRECTIVES = {
  ...BASE_CSP_DIRECTIVES,
  'style-src': [...BASE_CSP_DIRECTIVES['style-src'], 'https://unpkg.com'],
  'frame-ancestors': [NONE],
};

export const WEB_CONTENT_SECURITY_POLICY = buildContentSecurityPolicy();
export const WEB_META_CSP = serializeCsp(BASE_CSP_DIRECTIVES);
export const WEB_HEADERS_CSP = serializeCsp(HEADER_CSP_DIRECTIVES);
