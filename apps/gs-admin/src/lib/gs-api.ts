export function getGsApiBaseUrl(env: any) {
  return env.API_ORIGIN || 'https://api.goldshore.ai';
}

export function buildGsApiHeaders(request: Request) {
  return {
    'Content-Type': 'application/json',
    'Authorization': request.headers.get('Authorization') || '',
  };
}
