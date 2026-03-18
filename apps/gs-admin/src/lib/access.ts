import { verifyAccessWithClaims } from "@goldshore/auth";

export interface AccessResult {
  ok: boolean;
  error: string | null;
  status: number;
  payload?: any;
}

export async function requireAdminAccess(request: Request, env: any): Promise<AccessResult> {
  const payload = await verifyAccessWithClaims(request, env);

  if (!payload) {
    return {
      ok: false,
      error: "Unauthorized: Missing or invalid Cloudflare Access JWT",
      status: 401
    };
  }

  // Fail closed by default: check for 'admin' role explicitly
  const roles = payload.roles || payload.role || [];
  const isAdmin = Array.isArray(roles) ? roles.includes("admin") : roles === "admin";

  if (!isAdmin) {
    return {
      ok: false,
      error: "Forbidden: Insufficient permissions (admin role required)",
      status: 403
    };
  }

  return { ok: true, error: null, status: 200, payload };
}
