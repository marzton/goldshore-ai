import { Hono } from 'hono';
import { RoutingTableSchema } from '@goldshore/schema';
import { Env, Variables } from '../types';

const config = new Hono<{ Bindings: Env; Variables: Variables }>();

config.get('/routing', async (c) => {
  const table = await c.env.KV.get("ROUTING_TABLE", "json");
  const result = RoutingTableSchema.safeParse(table);
  
  return c.json({
    success: result.success,
    data: result.success ? result.data : null
  });
});

export default config;
