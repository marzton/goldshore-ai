export type MetricPoint = {
  label: string;
  value: number;
  display: string;
};

export type ChartMetrics = {
  title: string;
  description: string;
  summary: string;
  trend: string;
  series: MetricPoint[];
};

export type CloudflareMetrics = {
  highlights: {
    totalRequests: string;
    cacheHitRate: string;
    threatsBlocked: string;
    dnsChanges: string;
export function getCloudflareContext(locals: any) {
  return locals.runtime?.env || process.env;
}

export async function getCloudflareMetrics() {
  return {
    requests: 0,
    bandwidth: 0,
    threats: 0,
    pageViews: 0
  };
}
