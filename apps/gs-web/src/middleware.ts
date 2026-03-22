import { defineMiddleware } from "astro:middleware";

import { WEB_CONTENT_SECURITY_POLICY } from "./utils/csp";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Sentinel: Add security headers to protect against common attacks
  // X-Frame-Options: Protects against Clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options: Protects against MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer-Policy: Controls how much referrer information is sent
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content-Security-Policy: Keep browser connections scoped to same-origin plus approved GoldShore APIs.
  response.headers.set("Content-Security-Policy", WEB_CONTENT_SECURITY_POLICY);

  // Strict-Transport-Security: Enforce HTTPS (HSTS)
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  return response;
});
