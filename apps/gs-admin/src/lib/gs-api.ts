import type { Env } from '@goldshore/auth';

export function getGsApiBaseUrl(env: Env & { GS_API_URL?: string }) {
  return env.GS_API_URL || 'https://api.goldshore.ai';
}

export function buildGsApiHeaders(request: Request) {
  const headers = new Headers();
  const token = request.headers.get('CF-Access-Jwt-Assertion');
  if (token) {
    headers.set('CF-Access-Jwt-Assertion', token);
  }
  // Pass through cookies if needed for session
  const cookie = request.headers.get('Cookie');
  if (cookie) {
    headers.set('Cookie', cookie);
  }
  return headers;
}
