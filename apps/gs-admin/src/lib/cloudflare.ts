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

export type CloudflareHighlights = {
  totalRequests: string;
  cacheHitRate: string;
  threatsBlocked: string;
  dnsChanges: string;
};

export type CloudflareCharts = {
  traffic: ChartMetrics;
  cache: ChartMetrics;
  threats: ChartMetrics;
  dns: ChartMetrics;
};

export type CloudflareMetrics = {
  source: 'live' | 'mock';
  refreshedAt: string;
  note: string;
  highlights: CloudflareHighlights;
  charts: CloudflareCharts;
};

export function getCloudflareContext(locals: any) {
  return locals.runtime?.env || process.env;
}

export async function getCloudflareMetrics(): Promise<CloudflareMetrics> {
  return {
    source: 'mock',
    refreshedAt: new Date().toISOString(),
    note: 'Demo metrics while Cloudflare API integration is being finalized.',
    highlights: {
      totalRequests: '12.4M',
      cacheHitRate: '92.8%',
      threatsBlocked: '18.2K',
      dnsChanges: '14',
    },
    charts: {
      traffic: {
        title: 'Traffic Volume',
        description: 'Request totals by day for the last week.',
        summary: '+11%',
        trend: 'up',
        series: [
          { label: 'Mon', value: 1400000, display: '1.4M' },
          { label: 'Tue', value: 1560000, display: '1.56M' },
          { label: 'Wed', value: 1710000, display: '1.71M' },
          { label: 'Thu', value: 1650000, display: '1.65M' },
          { label: 'Fri', value: 1880000, display: '1.88M' },
          { label: 'Sat', value: 1760000, display: '1.76M' },
          { label: 'Sun', value: 1820000, display: '1.82M' },
        ],
      },
      cache: {
        title: 'Cache Performance',
        description: 'Edge cache hit rate trends over seven days.',
        summary: 'Stable',
        trend: 'neutral',
        series: [
          { label: 'Mon', value: 91, display: '91%' },
          { label: 'Tue', value: 92, display: '92%' },
          { label: 'Wed', value: 93, display: '93%' },
          { label: 'Thu', value: 92, display: '92%' },
          { label: 'Fri', value: 94, display: '94%' },
          { label: 'Sat', value: 93, display: '93%' },
          { label: 'Sun', value: 92, display: '92%' },
        ],
      },
      threats: {
        title: 'Security Events',
        description: 'Blocked threats across WAF and bot protection layers.',
        summary: '-6%',
        trend: 'down',
        series: [
          { label: 'Mon', value: 2900, display: '2.9K' },
          { label: 'Tue', value: 2800, display: '2.8K' },
          { label: 'Wed', value: 2700, display: '2.7K' },
          { label: 'Thu', value: 2600, display: '2.6K' },
          { label: 'Fri', value: 2500, display: '2.5K' },
          { label: 'Sat', value: 2400, display: '2.4K' },
          { label: 'Sun', value: 2300, display: '2.3K' },
        ],
      },
      dns: {
        title: 'DNS Change Activity',
        description: 'Recent DNS record updates and propagation events.',
        summary: '+2 changes',
        trend: 'up',
        series: [
          { label: 'Mon', value: 1, display: '1' },
          { label: 'Tue', value: 3, display: '3' },
          { label: 'Wed', value: 2, display: '2' },
          { label: 'Thu', value: 2, display: '2' },
          { label: 'Fri', value: 1, display: '1' },
          { label: 'Sat', value: 3, display: '3' },
          { label: 'Sun', value: 2, display: '2' },
        ],
      },
    },
  };
}
