import { Hono } from 'hono';
import { Env, Variables } from '../types';
import { withContractHeaders } from './contract';

const health = new Hono<{ Bindings: Env; Variables: Variables }>();

health.get('/', async (c) => {
  const isDeep = c.req.query('type') === 'deep';
  const timestamp = new Date().toISOString();

  const healthData: any = withContractHeaders(
    {
      status: 'ok',
      service: 'gs-api',
      timestamp,
      version: '2026.03.03',
    },
    c.env.API_VERSION,
  );

  if (isDeep) {
    try {
      const kvCheck = await c.env.KV.get('SERVICE_STATUS');
      healthData.kv = kvCheck !== null ? 'connected' : 'empty';

      const dbCheck = await c.env.DB.prepare('SELECT 1').first();
      healthData.db = dbCheck ? 'connected' : 'error';
    } catch {
      healthData.status = 'error';
      healthData.error = 'Dependency check failed';
    }
  }

  return c.json(healthData, healthData.status === 'ok' ? 200 : 500);
});

export default health;
