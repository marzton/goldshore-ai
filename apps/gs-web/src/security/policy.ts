const cspDirectives = [
  "default-src 'self'",
  "script-src 'self'",
  "script-src-elem 'self' 'unsafe-inline'",
  "script-src-attr 'none'",
  "style-src 'self' https://fonts.googleapis.com https://unpkg.com",
  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
  "style-src-attr 'unsafe-inline'",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'"
] as const;

export const CONTENT_SECURITY_POLICY = cspDirectives.join('; ');

// Meta CSP is only a fallback for deployments that cannot set HTTP response headers.
// frame-ancestors is ignored in meta and remains authoritative as an HTTP header.
export const CSP_META_FALLBACK = cspDirectives
  .filter((directive) => !directive.startsWith('frame-ancestors'))
  .join('; ');
