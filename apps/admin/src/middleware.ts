import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Sentinel: Add security headers to protect the admin panel
  // X-Frame-Options: Protects against Clickjacking (DENY for admin panel)
  response.headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options: Protects against MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer-Policy: Controls how much referrer information is sent
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Strict-Transport-Security: Enforce HTTPS (HSTS)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  return response;
});
