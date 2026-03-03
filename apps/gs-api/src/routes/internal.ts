import { Hono } from 'hono';
import { EmailInboxLogsSchema, ServiceStatusSchema } from '@goldshore/schema';
import { Env, Variables } from '../types';
import { loadSystemSyncSnapshot } from './system.config';

const internal = new Hono<{ Bindings: Env; Variables: Variables }>();

const EMPTY_SERVICES = {
  maintenance_mode: false,
  active_services: [],
  version: 'unknown'
};

const INTERNAL_ERROR_RESPONSE = {
  success: false,
  error: {
    code: 'INTERNAL_INBOX_STATUS_ERROR',
    message: 'Failed to retrieve internal inbox status'
  }
};

/**
 * [SOP] Internal Status Endpoint
 * Aggregates system health and mail logs for the Admin Dashboard.
 */
internal.get('/inbox-status', async (c) => {
  try {
    const [rawLogs, rawStatus] = await Promise.all([
      c.env.KV.get('EMAIL_INBOX_LOGS', 'json'),
      c.env.KV.get('SERVICE_STATUS', 'json')
    ]);

    const logsResult = EmailInboxLogsSchema.safeParse(rawLogs);
    const statusResult = ServiceStatusSchema.safeParse(rawStatus);

    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: statusResult.success ? statusResult.data : EMPTY_SERVICES,
      inbox: {
        count: snapshot.EMAIL_INBOX_LOGS.length,
        recent: snapshot.EMAIL_INBOX_LOGS.slice(0, 5),
      },
      routing: {
        hostCount: Object.keys(snapshot.ROUTING_TABLE).length,
      },
      orchestration: {
        preferredModel: snapshot.AI_ORCHESTRATION.preferred_model,
        queueConcurrency: snapshot.AI_ORCHESTRATION.queue_concurrency,
      },
    });
  } catch (error) {
    console.error('[internal/inbox-status] failed to fetch KV data', error);
    return c.json({
      ...INTERNAL_ERROR_RESPONSE,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

export default internal;
