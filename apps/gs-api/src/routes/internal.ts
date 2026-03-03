import { Hono } from 'hono';
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

export default internal;
