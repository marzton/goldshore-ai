import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export interface Env {
  CLOUDFLARE_ACCESS_AUDIENCE?: string;
  CLOUDFLARE_TEAM_DOMAIN?: string;
}

const DEFAULT_TEAM_DOMAIN = "goldshore.cloudflareaccess.com";

export interface Dependencies {
  createRemoteJWKSet: typeof createRemoteJWKSet;
  jwtVerify: typeof jwtVerify;
}

export const deps: Dependencies = {
  createRemoteJWKSet,
  jwtVerify
};

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(domain: string, runtimeDeps: Dependencies) {
  if (!jwksCache.has(domain)) {
    jwksCache.set(domain, runtimeDeps.createRemoteJWKSet(new URL(`https://${domain}/cdn-cgi/access/certs`)));
  }
  return jwksCache.get(domain)!;
}

export type AccessTokenPayload = JWTPayload & {
  email?: string;
  groups?: string[] | string;
  roles?: string[] | string;
  role?: string;
};

export async function verifyAccessWithClaimsInternal(req: Request, env: Env, runtimeDeps: Dependencies) {
  const token = req.headers.get("CF-Access-Jwt-Assertion");
  if (!token) return null;

  const teamDomain = env.CLOUDFLARE_TEAM_DOMAIN || DEFAULT_TEAM_DOMAIN;
  const JWKS = getJwks(teamDomain, runtimeDeps);

  try {
    const options: { issuer: string; audience?: string } = {
      issuer: `https://${teamDomain}`
    };

    if (env.CLOUDFLARE_ACCESS_AUDIENCE) {
      options.audience = env.CLOUDFLARE_ACCESS_AUDIENCE;
    }

    const { payload } = await runtimeDeps.jwtVerify(token, JWKS, options);
    return payload as AccessTokenPayload;
  } catch (e) {
    console.error('Token verification failed', e);
    return null;
  }
}

export async function verifyAccessWithClaims(req: Request, env: Env) {
  return verifyAccessWithClaimsInternal(req, env, deps);
}

export async function verifyAccess(req: Request, env: Env) {
  const payload = await verifyAccessWithClaims(req, env);
  return Boolean(payload);
}
