import { Context, Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { verifyAccess } from '@goldshore/auth';
import { STATUS_PAGE_HTML } from './templates/status';
import { type Env } from './types';
import { integrationControls } from './middleware/integration';
import { timingSafeCompare } from './utils/timing-safe';

const app = new Hono<{ Bindings: Env }>();

const BASIC_AUTH_REALM = 'gs-gateway-admin';

const timingSafeEqual = (a: string, b: string): boolean => {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  const maxLength = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let i = 0; i < maxLength; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }

  return diff === 0;
};

const unauthorizedBasicAuthResponse = (c: Context<{ Bindings: Env }>, message = 'Unauthorized') => {
  c.header('WWW-Authenticate', `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`);
  return c.json({ error: message }, 401);
};

const parseBasicAuth = (authorization: string | undefined): { user: string; pass: string } | null => {
  if (!authorization) {
    return null;
  }

  const [scheme, token, ...rest] = authorization.trim().split(/\s+/);
  if (rest.length > 0 || !scheme || !token || scheme.toLowerCase() !== 'basic') {
    return null;
  }

  let decoded: string;
  try {
    decoded = atob(token);
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex < 0) {
    return null;
  }

  return {
    user: decoded.slice(0, separatorIndex),
    pass: decoded.slice(separatorIndex + 1)
  };
};

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
    'X-Audit-Trace-Id'
  ],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true
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

    const authorized = await verifyAccess(c.req.raw, c.env);
    if (!authorized) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
});


// Optional second factor for /admin routes
app.use('*', async (c, next) => {
  if (!(c.req.path === '/admin' || c.req.path.startsWith('/admin/'))) {
    await next();
    return;
  }

  const adminToken = c.env.ADMIN_TOKEN;
  if (!adminToken) {
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization') || '';
  const expected = `Bearer ${adminToken}`;
  if (authHeader !== expected) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await next();
});

// Integration controls: data classification, secrets access, and audit trail enforcement
app.use('*', integrationControls);

const adminBasicAuth = async (c: Context<{ Bindings: Env }>, next: () => Promise<void>) => {
  const adminUser = c.env.ADMIN_USER;
  const adminPass = c.env.ADMIN_PASS;

  if (!adminUser || !adminPass) {
    return c.json({
      error: 'Admin access is temporarily unavailable. Operators must set ADMIN_USER and ADMIN_PASS.'
    }, 503);
  }

  const credentials = parseBasicAuth(c.req.header('authorization'));
  if (!credentials) {
    return unauthorizedBasicAuthResponse(c, 'Malformed or missing Basic Authorization header');
  }

  if (!timingSafeEqual(credentials.user, adminUser) || !timingSafeEqual(credentials.pass, adminPass)) {
    return unauthorizedBasicAuthResponse(c, 'Invalid admin credentials');
  }

  await next();
};

app.use('/admin', adminBasicAuth);
app.use('/admin/*', adminBasicAuth);

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

app.get('/admin', (c) => {
  const configuredAdminToken = c.env.ADMIN_TOKEN;

  if (!configuredAdminToken) {
    return c.json({ error: 'Admin access not configured' }, 503);
  }

  const providedAdminToken = c.req.header('x-admin-token');
  const authorized = timingSafeCompare(providedAdminToken, configuredAdminToken);

  if (!authorized) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  return c.json({ message: 'Admin access granted' });
});

app.get('/user/login', (c) => c.json({ message: 'Gateway Login Placeholder' }));
app.post('/v1/chat', (c) => c.json({ message: 'Gateway Chat Placeholder' }));

app.use('/admin/*', async (c, next) => {
  if (!c.env.ADMIN_INTERNAL_SECRET) {
    return c.json(
      {
        error: 'Admin route unavailable: ADMIN_INTERNAL_SECRET is not configured. Contact an operator.'
      },
      503
    );
  }

  await next();
});

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
