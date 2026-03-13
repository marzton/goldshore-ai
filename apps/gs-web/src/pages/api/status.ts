import type { APIRoute } from 'astro';

type HealthStatus = 'operational' | 'degraded' | 'maintenance';

const toHealthStatus = (value: string | undefined): HealthStatus => {
  if (!value) return 'operational';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'degraded' || normalized === 'maintenance') {
    return normalized;
  }
  return 'operational';
};

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = locals.runtime?.env as
    | { GS_SYSTEM_STATUS?: string; GS_SYSTEM_LATENCY?: string }
    | undefined;

  const status = toHealthStatus(runtimeEnv?.GS_SYSTEM_STATUS);

  const payload = {
    status,
    latency: runtimeEnv?.GS_SYSTEM_LATENCY ?? '12ms',
    lastUpdated: new Date().toISOString(),
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
};
