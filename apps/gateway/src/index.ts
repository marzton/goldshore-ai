import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { checkAuth } from './auth';
import { STATUS_PAGE_HTML } from './templates/status';

type Env = {
  API: Fetcher;
  GATEWAY_KV: KVNamespace;
  AI: any;
  ENV: string;
  CLOUDFLARE_ACCESS_AUDIENCE?: string;
  CLOUDFLARE_TEAM_DOMAIN?: string;
  API_ORIGIN?: string;
};

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
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'CF-Access-Jwt-Assertion',
    'X-Data-Classification',
    'X-Secrets-Access-Policy',
    'X-Audit-Trace-Id'
  ],
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

    if (!c.env.CLOUDFLARE_ACCESS_AUDIENCE) {
        console.warn('SECURITY WARNING: CLOUDFLARE_ACCESS_AUDIENCE is not set. Audience verification is disabled.');
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

  const auditTraceId = c.req.header('X-Audit-Trace-Id')?.trim();
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
  return c.html(STATUS_PAGE_HTML);
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
    if (c.env.API_ORIGIN) {
        const url = new URL(c.req.url);
        const targetUrl = new URL(url.pathname + url.search, c.env.API_ORIGIN);
        return fetch(targetUrl.toString(), c.req.raw);
    }

    // Fallback to fetch if no binding (e.g. local dev without binding simulation)
    return c.text('Upstream API not configured', 500);
});

export default app;
