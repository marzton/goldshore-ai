import { Hono } from 'hono';
<<<<<<< HEAD
=======
<<<<<<< HEAD
import {
  EmailInboxLogsSchema,
  ServiceStatusSchema,
} from '@goldshore/schema';

const internal = new Hono<{ Bindings: any }>();

const DNS_SYNC_RUN_INDEX_KEY = 'dns_sync_runs_index';

type DnsSyncRun = {
  runId: string;
  actor: string;
  startedAt: string;
  endedAt: string;
  success: boolean;
  driftStatus: 'in_sync' | 'drifted';
  results: Array<{
    hostname: string;
    checkUrl: string;
    startedAt: string;
    endedAt: string;
    statusCode: number | null;
    success: boolean;
    driftStatus: 'in_sync' | 'drifted';
    driftNotes: string[];
  }>;
};

const parseDnsSyncRun = (value: unknown): DnsSyncRun | null => {
  if (!value || typeof value !== 'object') return null;
  const run = value as DnsSyncRun;
  if (!run.runId || !Array.isArray(run.results)) return null;
  return run;
};

/**
 * [SOP] Internal Status Endpoint
 * Aggregates system health and mail logs for the Admin Dashboard.
 */
internal.get('/inbox-status', async (c) => {
  try {
    // 1. Concurrent fetch for performance
    const [rawLogs, rawStatus] = await Promise.all([
      c.env.KV.get("EMAIL_INBOX_LOGS", "json"),
      c.env.KV.get("SERVICE_STATUS", "json")
    ]);

    // 2. Defensive Validation against your verified schemas
    const logsResult = EmailInboxLogsSchema.safeParse(rawLogs);
    const statusResult = ServiceStatusSchema.safeParse(rawStatus);

    // 3. Structured Response
    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      // Fallback to empty state if validation fails or data is missing
      services: statusResult.success ? statusResult.data : { maintenance_mode: false, active_services: [], version: "unknown" },
      inbox: {
        count: logsResult.success ? logsResult.data.length : 0,
        recent: logsResult.success ? logsResult.data.slice(0, 5) : []
      }
    });
  } catch (error) {
    console.error("Internal API Error:", error);
    return c.json({ success: false, error: "Failed to retrieve internal system state" }, 500);
  }
});

internal.get('/dns-sync-status', async (c) => {
  const controlLogs = c.env.CONTROL_LOGS ?? c.env.KV;
  const [serviceStatusRaw, runIndexRaw] = await Promise.all([
    c.env.KV.get('SERVICE_STATUS', 'json'),
    controlLogs.get(DNS_SYNC_RUN_INDEX_KEY, 'json'),
  ]);

  const statusResult = ServiceStatusSchema.safeParse(serviceStatusRaw);
  const runKeys = Array.isArray(runIndexRaw) ? runIndexRaw.filter((key): key is string => typeof key === 'string') : [];
  const runsRaw = await Promise.all(runKeys.slice(0, 20).map((key) => controlLogs.get(key, 'json')));
  const runs = runsRaw
    .map(parseDnsSyncRun)
    .filter((run): run is DnsSyncRun => Boolean(run))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const latestRun = runs[0] ?? null;
  const inferredLastSync = statusResult.success ? statusResult.data.last_sync ?? null : null;
  const verifiedLastSync = latestRun?.endedAt ?? inferredLastSync;

  return c.json({
    success: true,
    checkedAt: new Date().toISOString(),
    latestRun,
    runs,
    masterConfigReport: {
      lastSyncTimestampVerified: verifiedLastSync,
      syncSource: latestRun ? 'durable' : inferredLastSync ? 'inferred' : 'none',
      driftStatusComputed: latestRun?.driftStatus ?? 'unknown',
    },
  });
});

=======
>>>>>>> 2513239f97c889fa6a258a9de2085481dc7def4c
import { EmailInboxLogsSchema, ServiceStatusSchema } from '../../../../packages/schema/src/system.ts';

const internal = new Hono<{ Bindings: SystemEnv }>();

internal.get('/inbox-status', async (c) => {
  try {
    const [rawLogs, rawStatus] = await Promise.all([
      c.env.KV.get('EMAIL_INBOX_LOGS', 'text'),
      c.env.KV.get('SERVICE_STATUS', 'text'),
    ]);

    const parsedLogs = rawLogs ? JSON.parse(rawLogs) : [];
    const parsedStatus = rawStatus ? JSON.parse(rawStatus) : {};

    const logsResult = EmailInboxLogsSchema.safeParse(parsedLogs);
    const statusResult = ServiceStatusSchema.partial().safeParse(parsedStatus);

    const logs = logsResult.success ? logsResult.data : [];
    const services = statusResult.success ? statusResult.data : {};

    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      services,
      inbox: {
        count: logs.length,
        recent: logs.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Failed to retrieve inbox logs', error);
    return c.json({ success: false, error: 'Failed to retrieve inbox logs' }, 500);
  }
});

<<<<<<< HEAD
=======
>>>>>>> 9a7cd1bf7c1ad35699a74d37fff8bae63408bf13
>>>>>>> 2513239f97c889fa6a258a9de2085481dc7def4c
export default internal;
