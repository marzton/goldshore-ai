import { Hono } from 'hono';
import { 
  EmailInboxLogsSchema, 
  ServiceStatusSchema 
} from '@goldshore/schema';

const internal = new Hono<{ Bindings: any }>();

type SyncRunPayload = {
  subdomain: string;
  actor: string;
  started_at: string;
  completed_at?: string | null;
  result: 'success' | 'error';
  drift_summary?: string | null;
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

internal.post('/sync-runs', async (c) => {
  const payload = await c.req.json<Partial<SyncRunPayload>>().catch(() => null);

  if (
    !payload?.subdomain ||
    !payload.actor ||
    !payload.started_at ||
    !payload.result ||
    !['success', 'error'].includes(payload.result)
  ) {
    return c.json({ success: false, error: 'Invalid sync run payload' }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO sync_runs (subdomain, actor, started_at, completed_at, result, drift_summary)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      payload.subdomain,
      payload.actor,
      payload.started_at,
      payload.completed_at ?? null,
      payload.result,
      payload.drift_summary ?? null
    )
    .run();

  return c.json({ success: true });
});

internal.get('/sync-runs/summary', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT
      s.subdomain,
      (
        SELECT completed_at
        FROM sync_runs
        WHERE subdomain = s.subdomain AND result = 'success'
        ORDER BY datetime(completed_at) DESC
        LIMIT 1
      ) AS last_successful_sync,
      (
        SELECT completed_at
        FROM sync_runs
        WHERE subdomain = s.subdomain AND result = 'error'
        ORDER BY datetime(completed_at) DESC
        LIMIT 1
      ) AS last_error_at,
      (
        SELECT drift_summary
        FROM sync_runs
        WHERE subdomain = s.subdomain AND result = 'error'
        ORDER BY datetime(completed_at) DESC
        LIMIT 1
      ) AS last_error
    FROM sync_runs s
    GROUP BY s.subdomain
    ORDER BY s.subdomain ASC`
  ).all();

  return c.json({ success: true, runs: results ?? [] });
});

export default internal;
