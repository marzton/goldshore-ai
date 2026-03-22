import type { AdminServerEnv } from './server-env';

export const getGsApiBaseUrl = (env: AdminServerEnv) => {
  const baseUrl = env.GS_API_URL || env.PUBLIC_API || 'https://api.goldshore.ai';
  return baseUrl.replace(/\/$/, '');
};

export const buildGsApiHeaders = (request: Request) => {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  const accessToken = request.headers.get('CF-Access-Jwt-Assertion');
  if (accessToken) {
    headers.set('CF-Access-Jwt-Assertion', accessToken);
  }

  return headers;
};
