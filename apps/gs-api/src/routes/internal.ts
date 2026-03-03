import { Hono } from 'hono';
import { loadSystemSyncSnapshot } from './system.config';

const internal = new Hono<{ Bindings: any }>();

/**
 * [SOP] Internal Status Endpoint
 * Aggregates system health and mail logs for the Admin Dashboard.
 */
internal.get('/inbox-status', async (c) => {
  try {
    const snapshot = await loadSystemSyncSnapshot(c.env.KV);

    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: snapshot.SERVICE_STATUS,
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
    console.error('Internal API Error:', error);
    return c.json({ success: false, error: 'Failed to retrieve internal system state' }, 500);
  }
});

export default internal;
