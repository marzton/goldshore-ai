const INLINE_SCRIPT_PATH_PREFIXES = ['/contact', '/developer', '/intake', '/templates'] as const;
const INLINE_SCRIPT_PATHS = ['/apps/risk-radar'] as const;

const STYLE_SOURCES = ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'] as const;

const baseDirectives = [
  "default-src 'self'",
  `style-src ${STYLE_SOURCES.join(' ')}`,
  `style-src-elem ${STYLE_SOURCES.join(' ')}`,
  "style-src-attr 'unsafe-inline'",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'"
] as const;
const HTML_CSP_DIRECTIVES = [
  "default-src 'self'",
  // WebLayout still renders inline script/style blocks, so HTML keeps the
  // minimum inline allowances needed until those blocks are externalized.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'"
] as const;

const scriptDirectives = (pathname: string) => {
  const allowsInlineScripts =
    INLINE_SCRIPT_PATHS.includes(pathname as (typeof INLINE_SCRIPT_PATHS)[number]) ||
    INLINE_SCRIPT_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  return [
    allowsInlineScripts ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
    "script-src-attr 'none'"
  ] as const;
};

const buildDirectives = (pathname: string) => [
  baseDirectives[0],
  ...scriptDirectives(pathname),
  ...baseDirectives.slice(1)
];

const joinDirectives = (directives: readonly string[]) => directives.join('; ');

// HTTP response headers are authoritative for Astro-rendered HTML. Route-specific
// relaxations live here so middleware and the layout's meta fallback stay aligned.
export const getContentSecurityPolicy = (pathname: string) => joinDirectives(buildDirectives(pathname));

// Meta CSP is only a fallback for environments that cannot set HTTP response headers.
// frame-ancestors is ignored in meta and remains authoritative as an HTTP header.
export const getMetaContentSecurityPolicy = (pathname: string) =>
  joinDirectives(buildDirectives(pathname).filter((directive) => !directive.startsWith('frame-ancestors')));
export const HTML_CONTENT_SECURITY_POLICY = HTML_CSP_DIRECTIVES.join('; ');

// Meta CSP is only a fallback for deployments where response headers are not
// available. frame-ancestors remains header-only because browsers ignore it in
// meta CSP.
export const HTML_CSP_META_FALLBACK = HTML_CSP_DIRECTIVES
  .filter((directive) => !directive.startsWith('frame-ancestors'))
  .join('; ');

export const STATIC_RISK_RADAR_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "script-src-attr 'none'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'"
].join('; ');
