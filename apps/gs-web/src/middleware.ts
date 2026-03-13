import { defineMiddleware } from "astro:middleware";

const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: https://goldshore.ai",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://api.goldshore.ai https://api-preview.goldshore.ai",
  "form-action 'self'",
  'upgrade-insecure-requests'
].join('; ');

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  response.headers.set('Content-Security-Policy-Report-Only', cspReportOnly);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
});
