import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export interface Env {
    // Sentinel: Added support for Audience verification to prevent auth bypass
    CLOUDFLARE_ACCESS_AUDIENCE?: string;
    // Sentinel: Added support for dynamic team domain
    CLOUDFLARE_TEAM_DOMAIN?: string;
}

// Cache JWKS sets by domain to avoid recreation on every request while supporting multiple domains if needed
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(domain: string) {
    if (!jwksCache.has(domain)) {
        jwksCache.set(domain, createRemoteJWKSet(new URL(`https://${domain}/cdn-cgi/access/certs`)));
    }
    return jwksCache.get(domain)!;
}

export type AccessTokenPayload = JWTPayload & {
  email?: string;
  groups?: string[] | string;
  roles?: string[] | string;
  role?: string;
};

export async function verifyAccessWithClaims(req: Request, env: Env) {
  const token = req.headers.get("CF-Access-Jwt-Assertion");
  if (!token) return null;

  const teamDomain = env?.CLOUDFLARE_TEAM_DOMAIN;
  if (!teamDomain) {
    console.error("CLOUDFLARE_TEAM_DOMAIN environment variable is not set.");
    return null;
  }
  const JWKS = getJwks(teamDomain);

  try {
    const options: { issuer: string; audience?: string } = {
      issuer: `https://${teamDomain}`,
    };

    // Sentinel: Verify audience if provided.
    // This is a CRITICAL security enhancement to prevent a token from one app being used in another.
    if (env && env.CLOUDFLARE_ACCESS_AUDIENCE) {
        options.audience = env.CLOUDFLARE_ACCESS_AUDIENCE;
    }

    const { payload } = await jwtVerify(token, JWKS, options);
    return payload as AccessTokenPayload;
  } catch (e) {
    console.error("Token verification failed", e);
    return null;
  }
}

export async function verifyAccess(req: Request, env: Env) {
  const payload = await verifyAccessWithClaims(req, env);
  return Boolean(payload);
}
