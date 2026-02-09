import { defineMiddleware } from "astro:middleware";

const API_BASE = import.meta.env.PUBLIC_API;

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAssetRoute =
    pathname.startsWith('/_astro') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/fonts');

  if (!isAssetRoute) {
    const sessionCookie = context.cookies.get('gs_admin_session');
    const accessHeader = context.request.headers.get('CF-Access-Jwt-Assertion');

    if (!sessionCookie && API_BASE && accessHeader) {
      const response = await fetch(`${API_BASE}/admin/session`, {
        method: 'POST',
        headers: {
          'CF-Access-Jwt-Assertion': accessHeader
        },
        credentials: 'include'
      });

      if (response.ok) {
        const payload = await response.json();
        if (payload.sessionId) {
          const isSecure = context.url.protocol === 'https:';
          context.cookies.set('gs_admin_session', payload.sessionId, {
            path: '/',
            httpOnly: true,
            secure: isSecure,
            sameSite: isSecure ? 'none' : 'lax',
            maxAge: payload.ttlSeconds ?? 60 * 60 * 8
          });
        }
      }
    }

    const hasSession = Boolean(context.cookies.get('gs_admin_session'));
    const hasAccessHeader = Boolean(accessHeader);

    if (!hasSession && !hasAccessHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const response = await next();

  // Sentinel: Add security headers to protect against common attacks
  // X-Frame-Options: Protects against Clickjacking - DENY for admin panel
  response.headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options: Protects against MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer-Policy: Controls how much referrer information is sent
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Strict-Transport-Security: Enforce HTTPS (HSTS)
  // max-age=31536000 (1 year), includeSubDomains, preload
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Permissions-Policy: Restrict access to sensitive features not needed in admin dashboard
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");

  return response;
});
