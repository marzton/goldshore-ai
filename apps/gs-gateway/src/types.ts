import type { KVNamespace, Fetcher, Queue, D1Database } from '@cloudflare/workers-types';

export type Env = {
  API: Fetcher;
  GATEWAY_KV: KVNamespace;
  AI: any;
  JOBS_QUEUE: Queue;
  DB: D1Database;
  ENV: string;
  CLOUDFLARE_ACCESS_AUDIENCE?: string;
  CLOUDFLARE_TEAM_DOMAIN?: string;
  API_ORIGIN?: string;
};
