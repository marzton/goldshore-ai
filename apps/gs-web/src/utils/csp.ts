export function serializeCsp(directives: ContentSecurityPolicyDirectives): string {
  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

const SELF = "'self'";
const UNSAFE_INLINE = "'unsafe-inline'";
const NONE = "'none'";

type ContentSecurityPolicyDirectives = Record<string, readonly string[]>;

export const GOLDSHORE_API_ORIGINS = [
  'https://api.goldshore.ai',
  'https://api-preview.goldshore.ai',
] as const;

/**
 * Approved external GoldShore API origins for browser runtime requests.
 *
 * Keep this list limited to browser-visible `PUBLIC_API` targets. Server-side Astro
 * fetches can talk to additional origins without expanding browser `connect-src`.
 */
export const WEB_CONNECT_SRC = [SELF, ...GOLDSHORE_API_ORIGINS] as const;

export const BROWSER_CONNECT_SRC = WEB_CONNECT_SRC;

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

/**
 * Serializes a Content Security Policy directive object into a single string.
 * @param directives Object mapping CSP directives to an array of allowed sources.
 * @returns The serialized CSP string.
 */
export function serializeCsp(directives: ContentSecurityPolicyDirectives): string {
  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Meta CSP is consumed by `src/layouts/WebLayout.astro`.
 * Keep it limited to directives supported by `<meta http-equiv="Content-Security-Policy">`.
 */
const WEB_META_DIRECTIVES = {
  ...WEB_CSP_DIRECTIVES,
  'frame-ancestors': undefined,
} as const;

/**
 * Header CSP is consumed by runtime headers in `src/middleware.ts` and mirrored in `public/_headers`.
 * Header delivery can enforce `frame-ancestors`, which meta CSP cannot.
 */
const WEB_HEADER_DIRECTIVES = {
  ...WEB_CSP_DIRECTIVES,
  'frame-ancestors': [NONE],
} as const;

export function buildContentSecurityPolicy(
  directives: ContentSecurityPolicyDirectives,
): string;
  return serializeCsp(directives ?? WEB_CSP_DIRECTIVES);
}
  directives?: Record<string, readonly string[]>,
export const WEB_CONTENT_SECURITY_POLICY = buildContentSecurityPolicy();
  return serializeCsp(directives ?? WEB_CSP_DIRECTIVES);
export const WEB_HEADERS_CSP = serializeCsp(HEADER_CSP_DIRECTIVES);
