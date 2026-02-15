import type { Env } from '@goldshore/auth';

export function getServerEnv(locals: Record<string, unknown>): Env {
  // Astro Cloudflare adapter
  const runtime = locals.runtime as { env: Env } | undefined;
  if (runtime?.env) {
    return runtime.env;
  }
  // Fallback for dev/node
  return (process.env as unknown) as Env;
}
