export type ComponentStatus =
  | 'operational'
  | 'degraded'
  | 'outage'
  | 'maintenance';

export type StatusComponent = {
  id: string;
  name: string;
  status: ComponentStatus;
  detail: string;
};

export type StatusSnapshot = {
  source: 'local';
  summaryOwner: string;
  lastUpdated: string;
  nextUpdateBy?: string;
  components: StatusComponent[];
};

export const statusSnapshot: StatusSnapshot = {
  source: 'local',
  summaryOwner:
    'GoldShore operations team (manual updates until live status endpoint is wired)',
  lastUpdated: '2026-03-21T10:30:00Z',
  nextUpdateBy:
    'Status page will be updated manually for incidents and scheduled maintenance until automated health feeds are connected.',
  components: [
    {
      id: 'api-gateway',
      name: 'API Gateway',
      status: 'operational',
      detail:
        'Request routing, auth checks, and edge caching are operating normally.',
    },
    {
      id: 'web-application',
      name: 'Web Application',
      status: 'operational',
      detail:
        'Public web experiences and authenticated dashboards are serving normally.',
    },
    {
      id: 'background-workers',
      name: 'Background Workers',
      status: 'operational',
      detail:
        'Queue processing, automation jobs, and async notifications are operating normally.',
    },
  ],
};

const severityOrder: Record<ComponentStatus, number> = {
  operational: 0,
  maintenance: 1,
  degraded: 2,
  outage: 3,
};

const statusLabels: Record<ComponentStatus, string> = {
  operational: 'Operational',
  maintenance: 'Maintenance',
  degraded: 'Degraded performance',
  outage: 'Service outage',
};

export function getOverallStatus(
  components: StatusComponent[],
): ComponentStatus {
  return components.reduce<ComponentStatus>((currentWorst, component) => {
    return severityOrder[component.status] > severityOrder[currentWorst]
      ? component.status
      : currentWorst;
  }, 'operational');
}

export function getStatusLabel(status: ComponentStatus): string {
  return statusLabels[status];
}

export function getStatusSummary(components: StatusComponent[]): string {
  const overallStatus = getOverallStatus(components);

  if (overallStatus === 'outage') {
    return 'One or more systems are currently experiencing an outage.';
  }

  if (overallStatus === 'degraded') {
    return 'Some systems are experiencing degraded performance.';
  }

  if (overallStatus === 'maintenance') {
    return 'Scheduled maintenance is in progress for some systems.';
  }

  return 'All monitored systems are currently operational.';
}
