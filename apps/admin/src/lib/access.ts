import { verifyAccessWithClaims, type AccessTokenPayload } from '@goldshore/auth';
import type { AdminServerEnv } from './server-env';

const DEFAULT_ADMIN_ROLES = ['admin', 'ops', 'owner', 'infra'];

const getRequiredRoles = (env: AdminServerEnv) => {
  const configured = env.ADMIN_GS_API_ROLES?.split(',').map((role) => role.trim()).filter(Boolean);
  return configured && configured.length > 0 ? configured : DEFAULT_ADMIN_ROLES;
};

const extractRoles = (claims: AccessTokenPayload) => {
  const roles = new Set<string>();
  const candidates = [claims.roles, claims.role, claims.groups];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      candidate.forEach((value) => roles.add(value));
    } else if (typeof candidate === 'string') {
      roles.add(candidate);
    }
  }
  return Array.from(roles).map((role) => role.toLowerCase());
};

const isAuthorizedRole = (claims: AccessTokenPayload, requiredRoles: string[]) => {
  const roles = extractRoles(claims);
  if (roles.length === 0) {
    return false;
  }
  const required = requiredRoles.map((role) => role.toLowerCase());
  return roles.some((role) => required.includes(role));
};

export type AdminAccessResult =
  | { ok: true; claims: AccessTokenPayload; requiredRoles: string[] }
  | { ok: false; status: number; error: string; requiredRoles: string[] };

export const requireAdminAccess = async (
  request: Request,
  env: AdminServerEnv
): Promise<AdminAccessResult> => {
  const claims = await verifyAccessWithClaims(request, env);
  const requiredRoles = getRequiredRoles(env);

  if (!claims) {
    return { ok: false, status: 401, error: 'Unauthorized', requiredRoles };
  }

  if (!isAuthorizedRole(claims, requiredRoles)) {
    return { ok: false, status: 403, error: 'Forbidden', requiredRoles };
  }

  return { ok: true, claims, requiredRoles };
};
