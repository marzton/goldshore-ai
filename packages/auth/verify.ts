import { createRemoteJWKSet, jwtVerify } from "jose";

export interface Env {
    // Add bindings if needed here
}

const JWKS = createRemoteJWKSet(
  new URL("https://goldshore.cloudflareaccess.com/cdn-cgi/access/certs")
);

export async function verifyAccess(req: Request, env: Env) {
  const token = req.headers.get("CF-Access-Jwt-Assertion");
  if (!token) return false;

  try {
    await jwtVerify(token, JWKS, {
      issuer: "https://goldshore.cloudflareaccess.com",
    });
    return true;
  } catch (e) {
    console.error("Token verification failed", e);
    return false;
  }

}
