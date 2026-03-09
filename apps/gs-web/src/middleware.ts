import { defineMiddleware } from "astro:middleware";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "connect-src 'self' https://api.goldshore.ai https://api-preview.goldshore.ai",
];

const contentSecurityPolicy = cspDirectives.join('; ');
const cspHeaderName = import.meta.env.CSP_ENFORCE
  ? 'Content-Security-Policy'
  : 'Content-Security-Policy-Report-Only';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  response.headers.set(cspHeaderName, contentSecurityPolicy);

  // X-Frame-Options: Protects against clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options: Protects against MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy: Controls how much referrer information is sent
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict-Transport-Security: Enforce HTTPS (HSTS)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Disable powerful browser features we do not use
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
});
