import type { MiddlewareHandler } from 'astro';
import { getContentSecurityPolicy } from './security/policy';

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Astro-rendered responses get their authoritative header policy here. Static
  // files that bypass middleware keep any required headers in public/_headers.
  context.locals.securityPolicySource = 'response-header';

  const response = await next();
  response.headers.set('Content-Security-Policy', getContentSecurityPolicy(context.url.pathname));
import { HTML_CONTENT_SECURITY_POLICY } from './security/policy';

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Response headers are authoritative for Astro-rendered HTML. Static files
  // that can bypass middleware keep their own platform config in public/_headers.
  (context.locals as { securityPolicySource?: 'response-header' }).securityPolicySource = 'response-header';

  const response = await next();
  response.headers.set('Content-Security-Policy', HTML_CONTENT_SECURITY_POLICY);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
};
