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
  };
};

type RuntimeLocals = {
  runtime?: {
    env?: Record<string, string | undefined>;
  };
};

export function getCloudflareContext(locals: RuntimeLocals) {
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
