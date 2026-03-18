import { verifyAccessWithClaims, buildAdminSession } from "@goldshore/auth";

export async function requireAdminAccess(request: Request, env: any) {
  const claims = await verifyAccessWithClaims(request, env);

  if (!claims) {
    return { ok: false, error: "Unauthorized: Invalid or missing Access JWT", status: 401 };
  }

  const session = buildAdminSession(claims);

  if (session.roles.length === 0) {
    return { ok: false, error: "Forbidden: Insufficient permissions", status: 403 };
  }

  return { ok: true, session, status: 200 };
}
