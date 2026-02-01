import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { checkAuth } from './auth';

type Env = {
  API: Fetcher;
  GATEWAY_KV: KVNamespace;
  AI: any;
  ENV: string;
  // Sentinel: Added support for Audience verification to prevent auth bypass
  CLOUDFLARE_ACCESS_AUDIENCE?: string;
  // Sentinel: Added support for dynamic team domain
  CLOUDFLARE_TEAM_DOMAIN?: string;
};

const API_ORIGIN = 'https://api.goldshore.ai';
const app = new Hono<{ Bindings: Env }>();
const INTEGRATION_PATH_PREFIXES = ['/integrations', '/market-streams'];
const DATA_CLASSIFICATIONS = new Set(['public', 'internal', 'confidential', 'restricted']);
const SECRETS_ACCESS_POLICIES = new Set([
  'none',
  'read-only',
  'read-write',
  'broker-credentials',
  'market-data'
]);

const isIntegrationRequest = (path: string) =>
  INTEGRATION_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));

// Sentinel: Add security headers to all responses (X-Frame-Options, X-XSS-Protection, etc.)
app.use('*', secureHeaders());

// Sentinel: Add CORS protection
app.use('*', cors({
  origin: '*', // Public gateway
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'CF-Access-Jwt-Assertion'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

// Authentication Middleware
app.use('*', async (c, next) => {
    // Skip auth for health check, root, and OPTIONS requests
    if (c.req.path === '/health' || c.req.path === '/' || c.req.method === 'OPTIONS') {
        await next();
        return;
    }

    const authorized = await checkAuth(c.req.raw, c.env);
    if (!authorized) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
});

// Integration controls: data classification, secrets access, and audit trail enforcement
app.use('*', async (c, next) => {
  if (!isIntegrationRequest(c.req.path) || c.req.method === 'OPTIONS') {
    await next();
    return;
  }

  const classification = c.req.header('X-Data-Classification')?.toLowerCase();
  if (!classification || !DATA_CLASSIFICATIONS.has(classification)) {
    return c.json(
      {
        error: 'Invalid data classification.',
        allowed: Array.from(DATA_CLASSIFICATIONS)
      },
      400
    );
  }

  const secretsPolicy = c.req.header('X-Secrets-Access-Policy')?.toLowerCase();
  if (!secretsPolicy || !SECRETS_ACCESS_POLICIES.has(secretsPolicy)) {
    return c.json(
      {
        error: 'Invalid secrets access policy.',
        allowed: Array.from(SECRETS_ACCESS_POLICIES)
      },
      400
    );
  }

  const auditTraceId = c.req.header('X-Audit-Trace-Id');
  if (!auditTraceId) {
    return c.json({ error: 'Missing audit trace id.' }, 400);
  }

  const auditEntry = {
    traceId: auditTraceId,
    classification,
    secretsPolicy,
    method: c.req.method,
    path: c.req.path,
    timestamp: new Date().toISOString(),
    cfRay: c.req.header('CF-Ray') ?? null,
    actor: c.req.header('CF-Access-User-Email') ?? 'unknown'
  };

  if (c.env.GATEWAY_KV) {
    await c.env.GATEWAY_KV.put(`audit:${auditTraceId}`, JSON.stringify(auditEntry), {
      expirationTtl: 60 * 60 * 24 * 30
    });
  } else {
    console.warn('GATEWAY_KV is not configured for audit logging.', auditEntry);
  }

  await next();
});

app.get('/health', (c) => c.json({ status: 'ok', service: 'gs-gateway' }));
app.get('/templates', (c) =>
  c.json({
    service: 'gs-gateway',
    description: 'Gateway template routes for routing, auth, and AI dispatch.',
    modules: [
      {
        name: 'routing',
        purpose: 'Proxy requests to gs-api or partner services with consistent observability.'
      },
      {
        name: 'ai-dispatch',
        purpose: 'Send AI requests to Gemini, ChatGPT, Jules, or Cloudflare AI Gateway.'
      },
      {
        name: 'market-streams',
        purpose: 'Broker market data connections for Alpaca, Thinkorswim, and other feeds.'
      }
    ],
    nextSteps: [
      'Add per-route rate limits and request shaping.',
      'Define queue-backed workflows for bursty workloads.',
      'Publish route maps to admin dashboards.'
    ]
  })
);

// Root Status Page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>GoldShore Gateway</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { text-align: center; border: 1px solid #334155; padding: 2rem; border-radius: 8px; background: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        h1 { margin-bottom: 0.5rem; color: #38bdf8; }
        p { color: #94a3b8; }
        .status { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; background: #059669; color: #fff; font-size: 0.875rem; font-weight: 600; margin-top: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>GoldShore Gateway</h1>
        <p>Intelligent Routing & Security Layer</p>
        <div class="status">SYSTEM OPERATIONAL</div>
        <p><small>Service: gs-gateway</small></p>
      </div>
    </body>
    </html>
  `);
});

// Example specific routes
app.get('/user/login', (c) => c.json({ message: 'Gateway Login Placeholder' }));
app.post('/v1/chat', (c) => c.json({ message: 'Gateway Chat Placeholder' }));

// Forwarding fallback
app.all('*', async (c) => {
    // If we have an API binding, use it (recommended for Service Bindings)
    if (c.env.API) {
        return c.env.API.fetch(c.req.raw);
    }

    // Fallback logic for environments without Service Bindings
    if (API_ORIGIN) {
        const url = new URL(c.req.url);
        const targetUrl = new URL(url.pathname + url.search, API_ORIGIN);
        return fetch(targetUrl.toString(), c.req.raw);
    }

    // Fallback to fetch if no binding (e.g. local dev without binding simulation)
    return c.text('Upstream API not configured', 500);
});

export default app;
