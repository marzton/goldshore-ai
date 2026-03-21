import {
  buildAdminSession,
  hasAdminPermission,
  verifyAccessWithClaims,
  type AccessTokenPayload,
  type AdminPermission,
} from '../../../../packages/auth/index.ts';

type AdminAuthEnv = {
  CLOUDFLARE_ACCESS_AUDIENCE?: string;
  CLOUDFLARE_TEAM_DOMAIN?: string;
};

type VerifyAccessWithClaims = typeof verifyAccessWithClaims;

type AdminAuthDependencies = {
  verifyAccessWithClaims: VerifyAccessWithClaims;
};

const defaultDependencies: AdminAuthDependencies = {
  verifyAccessWithClaims,
};

const getUnauthorizedResponse = () =>
  new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });

const getForbiddenResponse = () =>
  new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });

const getMisconfiguredResponse = () =>
  new Response(JSON.stringify({ error: 'Admin authentication is not configured.' }), {
    status: 503,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });

export const authorizeAdminRequest = async (
  request: Request,
  env: AdminAuthEnv,
  requiredPermission: AdminPermission,
  dependencies: AdminAuthDependencies = defaultDependencies,
) => {
  if (!env?.CLOUDFLARE_ACCESS_AUDIENCE) {
    console.error('Admin authentication is not configured: missing CLOUDFLARE_ACCESS_AUDIENCE.');
    return {
      authorized: false as const,
      response: getMisconfiguredResponse(),
    };
  }

  const claims = (await dependencies.verifyAccessWithClaims(request, env)) as AccessTokenPayload | null;
  if (!claims) {
    return {
      authorized: false as const,
      response: getUnauthorizedResponse(),
    };
  }

  const session = buildAdminSession(claims);
  if (!hasAdminPermission(session.permissions, requiredPermission)) {
    return {
      authorized: false as const,
      response: getForbiddenResponse(),
    };
  }

  return {
    authorized: true as const,
    claims,
    session,
  };
};
