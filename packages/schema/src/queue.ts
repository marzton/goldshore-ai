export interface GoldShoreTask {
  id: string;
  source: string;
  action: string;
  payload: unknown;
  priority?: number;
}
