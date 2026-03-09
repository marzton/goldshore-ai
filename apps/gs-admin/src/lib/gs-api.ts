export type RuntimeEnv = Record<string, unknown> & {
  GS_API_URL?: string;
  PUBLIC_API?: string;
  API_ORIGIN?: string;
};

export function getGsApiBaseUrl(env: RuntimeEnv): string {
  return env.GS_API_URL || env.PUBLIC_API || env.API_ORIGIN || '';
}

export function buildGsApiHeaders(request: Request): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': request.headers.get('Authorization') || '',
  };
}
