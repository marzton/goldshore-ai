import type { MiddlewareHandler } from 'astro';
import { CONTENT_SECURITY_POLICY } from './security/policy';

export const onRequest: MiddlewareHandler = async (context, next) => {
  // HTML responses get their security policy from middleware. Static platform-served
  // files use public/_headers because they can bypass Astro middleware entirely.
  context.locals.securityPolicySource = 'response-header';

  const response = await next();
  response.headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
};
