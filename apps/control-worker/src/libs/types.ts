export interface ControlEnv {
  CONTROL_LOGS: KVNamespace;
  STATE: R2Bucket;
  API: Fetcher;
  GATEWAY: Fetcher;
  CLOUDFLARE_ACCESS_AUDIENCE?: string;
  CLOUDFLARE_TEAM_DOMAIN?: string;
}
