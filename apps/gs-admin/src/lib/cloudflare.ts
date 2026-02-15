export async function getCloudflareMetrics() {
  return {
    source: 'mock',
    refreshedAt: new Date().toISOString(),
    note: 'Mock data generated for build verification',
    highlights: {
      totalRequests: '1.2M',
      cacheHitRate: '85%',
      threatsBlocked: '12k',
      dnsChanges: '5'
    },
    charts: {
      requests: {
        title: 'Requests',
        summary: 'Steady',
        trend: 'steady',
        description: 'Requests per day',
        series: [
          { label: 'Mon', value: 100, display: '100k', percent: 80 },
          { label: 'Tue', value: 120, display: '120k', percent: 100 },
          { label: 'Wed', value: 110, display: '110k', percent: 90 }
        ]
      }
    }
  };
}
