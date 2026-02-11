// apps/goldshore-web/src/middleware.ts

import { defineMiddleware } from 'astro:middleware';
import { verifyCfAccessJwt } from '@goldshore/auth';

/**
 * Astro middleware for the public-facing web application.
 * This middleware identifies authenticated users but does not block anonymous access.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const teamDomain = context.locals.runtime?.env?.CF_TEAM_DOMAIN;
  const audience = context.locals.runtime?.env?.CF_ACCESS_AUD;

  if (teamDomain && audience) {
    const user = await verifyCfAccessJwt(context.request, teamDomain, audience);
    if (user) {
      // If the user is authenticated, store their identity in the request context.
      context.locals.user = user;
    }
  } else {
    // This can happen during the build process or if the environment is misconfigured.
    // We'll log a warning but allow the request to proceed.
    console.warn('Missing Cloudflare Access environment variables. User authentication will not be available.');
  }

  // Proceed to the next middleware or the requested page.
  return next();
});
