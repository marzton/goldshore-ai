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
  charts: {
    traffic: ChartMetrics;
    cache: ChartMetrics;
    security: ChartMetrics;
    dns: ChartMetrics;
  };
  refreshedAt: string;
  source: 'live' | 'mock';
  note: string;
};

const fallbackMetrics: CloudflareMetrics = {
  highlights: {
    totalRequests: '18.4M',
    cacheHitRate: '86.7%',
    threatsBlocked: '1,284',
    dnsChanges: '14',
  },
  charts: {
    traffic: {
      title: 'Traffic Volume',
      description: 'Requests served across GoldShore zones.',
      summary: '+6.4% week over week',
      trend: 'up',
      series: [
        { label: 'Mon', value: 62, display: '6.2M' },
        { label: 'Tue', value: 74, display: '7.4M' },
        { label: 'Wed', value: 68, display: '6.8M' },
        { label: 'Thu', value: 79, display: '7.9M' },
        { label: 'Fri', value: 71, display: '7.1M' },
        { label: 'Sat', value: 58, display: '5.8M' },
        { label: 'Sun', value: 64, display: '6.4M' },
      ],
    },
    cache: {
      title: 'Cache Hit Rate',
      description: 'Edge cache effectiveness by day.',
      summary: 'Stable within 84% - 89% band',
      trend: 'steady',
      series: [
        { label: 'Mon', value: 84, display: '84%' },
        { label: 'Tue', value: 86, display: '86%' },
        { label: 'Wed', value: 89, display: '89%' },
        { label: 'Thu', value: 87, display: '87%' },
        { label: 'Fri', value: 88, display: '88%' },
        { label: 'Sat', value: 85, display: '85%' },
        { label: 'Sun', value: 86, display: '86%' },
      ],
    },
    security: {
      title: 'Security Events',
      description: 'Mitigated threats and WAF actions.',
      summary: 'Peak 312 events on Thursday',
      trend: 'up',
      series: [
        { label: 'Mon', value: 142, display: '142' },
        { label: 'Tue', value: 196, display: '196' },
        { label: 'Wed', value: 214, display: '214' },
        { label: 'Thu', value: 312, display: '312' },
        { label: 'Fri', value: 238, display: '238' },
        { label: 'Sat', value: 101, display: '101' },
        { label: 'Sun', value: 81, display: '81' },
      ],
    },
    dns: {
      title: 'DNS Changes',
      description: 'Record updates tracked across zones.',
      summary: 'Most changes from automation rollouts',
      trend: 'down',
      series: [
        { label: 'Mon', value: 5, display: '5' },
        { label: 'Tue', value: 3, display: '3' },
        { label: 'Wed', value: 2, display: '2' },
        { label: 'Thu', value: 1, display: '1' },
        { label: 'Fri', value: 1, display: '1' },
        { label: 'Sat', value: 0, display: '0' },
        { label: 'Sun', value: 2, display: '2' },
      ],
    },
  },
  refreshedAt: new Date().toISOString(),
  source: 'mock',
  note: 'Live metrics unavailable; showing read-only defaults.',
};

const mergeMetrics = (payload: Partial<CloudflareMetrics>): CloudflareMetrics => ({
  ...fallbackMetrics,
  ...payload,
  highlights: {
    ...fallbackMetrics.highlights,
    ...payload.highlights,
  },
  charts: {
    ...fallbackMetrics.charts,
    ...payload.charts,
  },
});

export const getCloudflareMetrics = async (
  options: { endpoint?: string; fetcher?: typeof fetch } = {},
): Promise<CloudflareMetrics> => {
  const { endpoint = 'https://ops.goldshore.ai/cloudflare/metrics', fetcher = fetch } = options;

  try {
    const response = await fetcher(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return mergeMetrics({
        note: `Backend responded with ${response.status}; using cached defaults.`,
      });
    }

    const payload = (await response.json()) as Partial<CloudflareMetrics>;
    return mergeMetrics({
      ...payload,
      refreshedAt: payload.refreshedAt ?? new Date().toISOString(),
      source: payload.source ?? 'live',
      note: payload.note ?? 'Live metrics pulled from secure backend.',
    });
  } catch {
    return mergeMetrics({
      note: 'Secure backend unavailable; presenting mock data.',
      source: 'mock',
    });
  }
};
