import { verifyAccessWithClaims, getAdminRoles, type Env } from '@goldshore/auth';

export async function requireAdminAccess(request: Request, env: Env) {
  const claims = await verifyAccessWithClaims(request, env);

  if (!claims) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const roles = getAdminRoles(claims);
  if (roles.length === 0) {
    return { ok: false, status: 403, error: 'Forbidden: Insufficient permissions' };
  }

  return { ok: true, claims, roles };
}
