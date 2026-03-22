export const GOLDSHORE_API_ORIGINS = [
  'https://api.goldshore.ai',
  'https://api-preview.goldshore.ai',
] as const;

export const BROWSER_CONNECT_SRC = [
  "'self'",
  ...GOLDSHORE_API_ORIGINS,
] as const;

export const WEB_CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://*.cloudflare.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https://*.cloudflare.com'],
  'connect-src': [...BROWSER_CONNECT_SRC],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
} as const;

export function buildContentSecurityPolicy(
  directives: Record<string, readonly string[]> = WEB_CSP_DIRECTIVES,
): string {
  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

export const WEB_CONTENT_SECURITY_POLICY = buildContentSecurityPolicy();
