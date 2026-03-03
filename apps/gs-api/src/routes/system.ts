import { Hono } from 'hono';
import { ServiceStatusSchema } from '@goldshore/schema';
import { Env, Variables } from '../types';

const system = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * [SOP] System Configuration & Status
 * Provides versioning and active service metadata.
 */
system.get('/status', async (c) => {
  const rawStatus = await c.env.KV.get("SERVICE_STATUS", "json");
  
  // Defensive validation using shared schema
  const result = ServiceStatusSchema.safeParse(rawStatus);
  
  if (!result.success) {
    return c.json({
      status: 'degraded',
      error: 'Invalid service status configuration',
      version: '2026.03.03'
    }, 500);
  }

  return c.json({
    status: 'operational',
    ...result.data
  });
});

export default system;
