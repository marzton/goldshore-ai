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
