import { Hono } from 'hono';
import { Env, Variables } from '../types';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.get('/github/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) return c.json({ error: 'Missing code' }, 400);

  const clientId = c.env.GITHUB_CLIENT_ID;
  if (!clientId) return c.json({ error: 'OAuth not configured' }, 500);
  const clientSecret = c.env.GITHUB_CLIENT_SECRET;

  // Process OAuth callback
  return c.json({ success: true, clientId });
});

export default app;
