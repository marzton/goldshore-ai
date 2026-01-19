import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { verifyAccess } from '@goldshore/auth';
import users from './routes/users';
import health from './routes/health';
import ai from './routes/ai';
import user from './routes/user';
import system from './routes/system';

type Env = {
  API_KV: KVNamespace;
  DB: D1Database;
  ASSETS: R2Bucket;
  AI: any;
};

const app = new Hono<{ Bindings: Env }>();

// Sentinel: Add security headers to all responses (X-Frame-Options, X-XSS-Protection, etc.)
app.use('*', secureHeaders());

// Sentinel: Security Middleware
// Add security headers to all responses (X-Frame-Options, X-XSS-Protection, etc.)
app.use('*', secureHeaders());

// Enforce CORS to allow legitimate browser clients (if any) and handle preflight
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'CF-Access-Jwt-Assertion'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

// Enforce Authentication (Defense in Depth)
app.use('*', async (c, next) => {
  // Allow health checks and CORS preflight
  // We use startsWith to allow health check sub-paths if they exist
  if (c.req.path === '/health' || c.req.path.startsWith('/health/') || c.req.method === 'OPTIONS') {
    await next();
    return;
  }

  // Verify Cloudflare Access JWT
  // This protects the API even if the network layer (Cloudflare Access) is bypassed or misconfigured
  const authorized = await verifyAccess(c.req.raw, c.env);
  if (!authorized) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

app.get('/', (c) => c.text('GoldShore API'));

// Core routes
app.route('/health', health);
app.route('/ai', ai);
app.route('/users', users);
app.route('/user', user);
app.route('/system', system);

// V1 Routes
const v1 = new Hono<{ Bindings: Env }>();

v1.route('/users', users);
v1.get('/agents', (c) => c.json({ agents: ['agent-alpha', 'agent-beta'] }));
v1.get('/models', (c) => c.json({ models: ['gpt-4', 'claude-3'] }));
v1.get('/logs', (c) => c.json({ logs: ['log1', 'log2'] }));

app.route('/v1', v1);

export default app;
