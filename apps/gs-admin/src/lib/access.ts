import jwtDecode from 'jwt-decode';

export async function requireAdminAccess(request: Request, env: any) {
  const token =
    request.headers.get('Cf-Access-Jwt-Assertion') ||
    request.headers.get('cf-access-jwt-assertion');

  if (!token) {
    return {
      ok: false,
      error: 'Missing Cloudflare Access token',
      status: 401,
    };
  }

  let claims: any;
  try {
    claims = jwtDecode<any>(token);
  } catch {
    return {
      ok: false,
      error: 'Invalid Cloudflare Access token',
      status: 401,
    };
  }

  const requiredRole =
    (env && (env.ADMIN_ROLE as string)) || 'admin';
  const roles = (claims && (claims.roles as unknown)) || [];

  if (!Array.isArray(roles) || !roles.includes(requiredRole)) {
    return {
      ok: false,
      error: 'Forbidden: insufficient role',
      status: 403,
    };
  }
  return { ok: true, error: null, status: 200 };
}
