// apps/goldshore-admin/src/middleware.ts

import { defineMiddleware } from 'astro:middleware';
import { verifyCfAccessJwt } from '@goldshore/auth';

/**
 * Astro middleware to protect all routes in the admin dashboard.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Get the Cloudflare Turnstile token from the form data
  const teamDomain = context.locals.runtime?.env?.CF_TEAM_DOMAIN;
  const audience = context.locals.runtime?.env?.CF_ACCESS_AUD;

  if (!teamDomain || !audience) {
    console.error('Missing Cloudflare Access environment variables');
    return new Response('Internal Server Error: App is misconfigured', { status: 500 });
  }

  const user = await verifyCfAccessJwt(context.request, teamDomain, audience);

  if (!user) {
    // If the user is not authenticated, return a 401 Unauthorized response.
    return new Response('Unauthorized: Invalid or missing token', { status: 401 });
  }

  // For the admin dashboard, we can also enforce that the user
  // belongs to the 'admin' group.
  if (!user.groups || !user.groups.includes('admin')) {
      return new Response('Forbidden: You do not have permission to access this resource', { status: 403 });
  }

  // Store the user object in the request context so it can be accessed from pages.
  context.locals.user = user;

  // Proceed to the next middleware or the requested page.
  return next();
});
