import { Hono } from 'hono';
import { verifyAccess } from '@goldshore/auth';

type Env = {
  CLOUDFLARE_TEAM_DOMAIN: string;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.text('gs-mail active'));

app.get('/health', (c) => c.json({ status: 'ok', service: 'gs-mail' }));

app.use('/admin/*', async (c, next) => {
  const authorized = await verifyAccess(c.req.raw, c.env);
  if (!authorized) {
    return c.text('Unauthorized', 401);
  }
  await next();
});

app.get('/admin/status', (c) => c.json({ admin: true }));

export default app;
