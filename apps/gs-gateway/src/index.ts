import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { verifyAccess } from '@goldshore/auth';
import { STATUS_PAGE_HTML } from './templates/status';
import { type Env } from './types';
import { integrationControls } from './middleware/integration';

const app = new Hono<{ Bindings: Env }>();
const textEncoder = new TextEncoder();

const ALLOWED_ORIGINS = [
  'https://goldshore.ai',
  'https://www.goldshore.ai',
  'https://admin.goldshore.ai',
  'https://gw.goldshore.ai',
  'https://api.goldshore.ai'
];

// Sentinel: Add security headers to all responses (X-Frame-Options, X-XSS-Protection, etc.)
app.use('*', secureHeaders());

// Sentinel: Add CORS protection
app.use('*', cors({
  origin: (origin, c) => {
    // Development overrides
    if (c.env.ENV !== 'production') {
      if (origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
        return origin;
      }
    }

    // Strict origin check for production (and dev non-localhost)
    if (ALLOWED_ORIGINS.includes(origin)) {
      return origin;
    }

    return null; // Block unknown origins
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'CF-Access-Jwt-Assertion',
    'X-Data-Classification',
    'X-Secrets-Access-Policy',
    'X-Audit-Trace-Id',
    'X-GS-Admin-Key'
  ],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true
}));

const timingSafeAdminKeyMatch = (expectedKey: string, providedHeader: string | null): boolean => {
  const expectedBytes = textEncoder.encode(expectedKey);
  const providedBytes = textEncoder.encode(providedHeader ?? '');
  let mismatch = expectedBytes.length ^ providedBytes.length;

  // Use constant-time style byte comparison so admin key checks do not leak useful timing differences.
  for (let i = 0; i < expectedBytes.length; i += 1) {
    mismatch |= expectedBytes[i] ^ (providedBytes[i] ?? 0);
  }

  return mismatch === 0;
};

app.use('/admin*', async (c, next) => {
  if (!c.env.GS_ADMIN_KEY) {
    return c.json({ error: 'Admin key not configured' }, 500);
  }

  const adminKey = c.req.header('X-GS-Admin-Key') ?? null;
  const expectedLength = textEncoder.encode(c.env.GS_ADMIN_KEY).length;
  const providedLength = textEncoder.encode(adminKey ?? '').length;
  const isWellFormed = adminKey !== null && providedLength === expectedLength;
  const isMatch = timingSafeAdminKeyMatch(c.env.GS_ADMIN_KEY, adminKey);

  if (!isWellFormed || !isMatch) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await next();
});

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

    const authorized = await verifyAccess(c.req.raw, c.env);
    if (!authorized) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
});

// Integration controls: data classification, secrets access, and audit trail enforcement
app.use('*', integrationControls);

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
