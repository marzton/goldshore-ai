export interface ControlEnv {
  CONTROL_LOGS: KVNamespace;
  STATE: R2Bucket;
  API: Fetcher;
  GATEWAY: Fetcher;
}
