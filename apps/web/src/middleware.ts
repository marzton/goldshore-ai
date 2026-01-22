import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Sentinel: Add security headers to protect against common attacks
  // X-Frame-Options: Protects against Clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options: Protects against MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer-Policy: Controls how much referrer information is sent
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Strict-Transport-Security: Enforce HTTPS (HSTS)
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Content-Security-Policy: Restrict resources to trusted sources
  // Note: 'unsafe-inline' is currently required for scripts and styles due to Astro architecture and external fonts.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' https://api.goldshore.ai https://gw.goldshore.ai",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];
  response.headers.set("Content-Security-Policy", csp.join("; "));

  return response;
});
