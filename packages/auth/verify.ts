import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export interface Env {
    // Sentinel: Added support for Audience verification to prevent auth bypass
    CLOUDFLARE_ACCESS_AUDIENCE?: string;
    // Sentinel: Added support for dynamic team domain
    CLOUDFLARE_TEAM_DOMAIN?: string;
}

// Sentinel: Default to existing hardcoded values if not provided in Env
const DEFAULT_TEAM_DOMAIN = "goldshore.cloudflareaccess.com";

// Cache JWKS sets by domain to avoid recreation on every request while supporting multiple domains if needed
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export interface Dependencies {
    createRemoteJWKSet: typeof createRemoteJWKSet;
    jwtVerify: typeof jwtVerify;
}

function getJwks(domain: string, deps: Dependencies) {
    if (!jwksCache.has(domain)) {
        jwksCache.set(domain, deps.createRemoteJWKSet(new URL(`https://${domain}/cdn-cgi/access/certs`)));
    }
    return jwksCache.get(domain)!;
}

export type AccessTokenPayload = JWTPayload & {
  email?: string;
  groups?: string[] | string;
  roles?: string[] | string;
  role?: string;
};

export async function verifyAccessWithClaims(
    req: Request,
    env: Env,
    // Dependencies injected for testing
    deps: Dependencies = defaultDeps
) {
  const token = req.headers.get("CF-Access-Jwt-Assertion");
  if (!token) return null;

  const teamDomain = (env && env.CLOUDFLARE_TEAM_DOMAIN) || DEFAULT_TEAM_DOMAIN;
  const JWKS = getJwks(teamDomain, deps);

  try {
    const options: { issuer: string; audience?: string } = {
      issuer: `https://${teamDomain}`,
    };

    // Sentinel: Verify audience if provided.
    // This is a CRITICAL security enhancement to prevent a token from one app being used in another.
    if (env && env.CLOUDFLARE_ACCESS_AUDIENCE) {
        options.audience = env.CLOUDFLARE_ACCESS_AUDIENCE;
    }

    const { payload } = await deps.jwtVerify(token, JWKS, options);
    return payload as AccessTokenPayload;
  } catch (e) {
    console.error("Token verification failed", e);
    return null;
  }
}

// Retain alias for backwards compatibility if needed, but verifyAccessWithClaims is now the main one.
// We can remove verifyAccessWithClaimsInternal entirely as verifyAccessWithClaims now supports injection.

export async function verifyAccess(req: Request, env: Env) {
  const payload = await verifyAccessWithClaims(req, env);
  return Boolean(payload);
}
