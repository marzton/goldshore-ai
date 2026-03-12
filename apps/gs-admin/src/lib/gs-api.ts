const DEFAULT_API_ORIGIN = 'https://api.goldshore.ai';

type ApiEnv = {
  GS_API_URL?: string;
  PUBLIC_API?: string;
  API_ORIGIN?: string;
};

export function getGsApiBaseUrl(env: ApiEnv) {
  return env.GS_API_URL || env.PUBLIC_API || env.API_ORIGIN || DEFAULT_API_ORIGIN;
}

export function buildGsApiHeaders(request: Request) {
  return {
    'Content-Type': 'application/json',
    'Authorization': request.headers.get('Authorization') || ''
  };
}
