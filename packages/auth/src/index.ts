// packages/auth/src/index.ts

import type { MiddlewareHandler } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

// Define the shape of the Cloudflare Access JWT payload
export interface AccessTokenPayload extends JWTPayload {
  email: string;
  groups: string[];
  // You can add other claims like 'name', 'country', 'custom', etc. as needed.
  // See: https://developers.cloudflare.com/cloudflare-one/identity/users/validating-json/#payload
}

// Re-export the payload type for convenience in other packages
export type AccessUser = AccessTokenPayload;

// --- JWT Verification ---

// Cache for the JWK set to avoid fetching it on every request
let jwkSet: ReturnType<typeof createRemoteJWKSet>;

function getJwkSet(teamDomain: string) {
  if (!jwkSet) {
    const certsUrl = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;
    jwkSet = createRemoteJWKSet(new URL(certsUrl));
  }
  return jwkSet;
}

/**
 * Verifies the Cloudflare Access JWT from the request headers.
 *
 * @param request The incoming Request object.
 * @param teamDomain Your Cloudflare Zero Trust team domain.
 * @param audience The Application Audience (AUD) tag.
 * @returns The verified token payload, or null if verification fails.
 */
export async function verifyCfAccessJwt(
  request: Request,
  teamDomain: string,
  audience: string
): Promise<AccessTokenPayload | null> {
  const jwt = request.headers.get('CF-Access-JWT-Assertion');
  if (!jwt) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(jwt, getJwkSet(teamDomain), {
      issuer: `https://${teamDomain}.cloudflareaccess.com`,
      audience: audience,
    });
    return payload as AccessTokenPayload;
  } catch (err) {
    console.error('JWT Verification Failed:', err);
    return null;
  }
}

// --- Hono Middleware ---

// This type allows us to add a `user` property to the Hono context
export type AuthContext = {
  Variables: {
    user?: AccessUser;
  };
};

/**
 * Creates a Hono middleware for Cloudflare Access authentication.
 *
 * @param options Configuration options for the middleware.
 * @param options.teamDomain Your Cloudflare Zero Trust team domain.
 * @param options.audience The Application Audience (AUD) tag for your app.
 * @returns A Hono MiddlewareHandler.
 */
export const createAuthMiddleware = (options: {
  teamDomain: string;
  audience: string;
}): MiddlewareHandler<AuthContext> => {
  return async (c, next) => {
    const user = await verifyCfAccessJwt(c.req.raw, options.teamDomain, options.audience);
    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'Missing or invalid token' }, 401);
    }
    c.set('user', user);
    await next();
  };
};

/**
 * Creates a Hono middleware to protect routes by requiring a specific role (group).
 * This middleware must run *after* the auth middleware.
 *
 * @param role The role (Access group) required to access the route.
 * @returns A Hono MiddlewareHandler.
 */
export const requireRole = (role: string): MiddlewareHandler<AuthContext> => {
  return async (c, next) => {
    const user = c.get('user');
    if (!user || !user.groups || !user.groups.includes(role)) {
      return c.json({ error: 'Forbidden', message: 'You do not have permission to access this resource' }, 403);
    }
    await next();
  };
};
