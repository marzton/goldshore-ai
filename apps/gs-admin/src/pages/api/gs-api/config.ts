import type { APIRoute } from 'astro';
import { normalizeApiRuntimeConfig } from '@goldshore/schema';
import { requireAdminAccess } from '../../../lib/access';
import { getGsApiBaseUrl, buildGsApiHeaders } from '../../../lib/gs-api';
import { getServerEnv } from '../../../lib/server-env';

const buildErrorResponse = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export const GET: APIRoute = async ({ request, locals }) => {
  const env = getServerEnv(locals as Record<string, unknown>);
  const access = await requireAdminAccess(request, env);

  if (!access.ok) {
    return buildErrorResponse(access.status, access.error);
  }

  const response = await fetch(`${getGsApiBaseUrl(env)}/system/config`, {
    headers: buildGsApiHeaders(request)
  });

  const payload = await response.json().catch(() => null);

  return new Response(JSON.stringify({
    config: normalizeApiRuntimeConfig(payload?.config),
    source: payload?.source ?? { key: 'SERVICE_STATUS.api_config' }
  }), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const env = getServerEnv(locals as Record<string, unknown>);
  const access = await requireAdminAccess(request, env);

  if (!access.ok) {
    return buildErrorResponse(access.status, access.error);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return buildErrorResponse(400, 'Invalid configuration payload.');
  }

  const response = await fetch(`${getGsApiBaseUrl(env)}/system/config`, {
    method: 'PUT',
    headers: buildGsApiHeaders(request),
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => null);

  return new Response(JSON.stringify({
    config: normalizeApiRuntimeConfig(payload?.config),
    source: payload?.source ?? { key: 'SERVICE_STATUS.api_config' }
  }), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  });
};
