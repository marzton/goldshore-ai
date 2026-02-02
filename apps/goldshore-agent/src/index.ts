import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';

type Env = {
  AI: any;
};

const app = new Hono<{ Bindings: Env }>();

// Sentinel: Add security headers to all responses (Defense in Depth)
app.use('*', secureHeaders());

// Sentinel: Add CORS protection (Permissive for now, but explicit)
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 600,
}));

// Sentinel: TODO - Add Authentication Middleware (CRITICAL)
// Currently this service is unprotected. Needs @goldshore/auth integration.

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>GoldShore Agent</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { text-align: center; border: 1px solid #334155; padding: 2rem; border-radius: 8px; background: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        h1 { margin-bottom: 0.5rem; color: #f472b6; }
        p { color: #94a3b8; }
        .status { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; background: #db2777; color: #fff; font-size: 0.875rem; font-weight: 600; margin-top: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>GoldShore Agent</h1>
        <p>AI Autonomous Service</p>
        <div class="status">STANDBY</div>
        <p><small>Service: gs-agent</small></p>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (c) => c.json({ status: 'ok', service: 'gs-agent' }));

export default app;
