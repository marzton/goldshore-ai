type HealthStatus = 'operational' | 'degraded' | 'maintenance';

interface StatusPayload {
  status?: string;
  latency?: string;
  lastUpdated?: string;
}

const STATUS_LABEL: Record<HealthStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  maintenance: 'Maintenance',
};

const applyStatus = (rawStatus: string | undefined, textNode: Element, dotNode: HTMLElement | null) => {
  const normalized = (rawStatus ?? 'operational').trim().toLowerCase() as HealthStatus;
  const status: HealthStatus =
    normalized === 'degraded' || normalized === 'maintenance' ? normalized : 'operational';

  textNode.textContent = `System Status: ${STATUS_LABEL[status]}`;

  if (dotNode) {
    dotNode.dataset.status = status;
  }
};

export async function updateSystemStatus() {
  const statusEl = document.querySelector('[data-gs-system-status]');
  const dotEl = document.querySelector<HTMLElement>('[data-gs-status-dot]');

  if (!statusEl) return;

  try {
    const res = await fetch('/api/status', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return;
    }

    const data = (await res.json()) as StatusPayload;
    applyStatus(data.status, statusEl, dotEl);
  } catch {
    // keep server-rendered fallback text if network/status endpoint is unavailable
  }
}

void updateSystemStatus();
