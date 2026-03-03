import { Hono } from 'hono';
import { 
  EmailInboxLogsSchema, 
  ServiceStatusSchema 
} from '@goldshore/schema';

const internal = new Hono<{ Bindings: any }>();

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

export default internal;
