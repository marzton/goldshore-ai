import type { KVNamespace, Fetcher } from '@cloudflare/workers-types';

export type Env = {
  API: Fetcher;
  GATEWAY_KV: KVNamespace;
  AI: any;
  ENV: string;
  ADMIN_INTERNAL_SECRET?: string;
  CLOUDFLARE_ACCESS_AUDIENCE?: string;
  CLOUDFLARE_TEAM_DOMAIN?: string;
  API_ORIGIN?: string;
};
