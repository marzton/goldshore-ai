import { Hono } from 'hono';

interface Env {
  // Add environment variables here
}

const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) => c.json({ status: 'ok', service: 'gs-mail' }));

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>GoldShore Mail</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { text-align: center; border: 1px solid #334155; padding: 2rem; border-radius: 8px; background: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        h1 { margin-bottom: 0.5rem; color: #a78bfa; }
        p { color: #94a3b8; }
        .status { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; background: #7c3aed; color: #fff; font-size: 0.875rem; font-weight: 600; margin-top: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>GoldShore Mail</h1>
        <p>Email Routing Service</p>
        <div class="status">OPERATIONAL</div>
        <p><small>Service: gs-mail</small></p>
      </div>
    </body>
    </html>
  `);
});

// Email handling logic can be added here
// For example, an email handler function exported as default for email workers
export default {
  fetch: app.fetch,
  // email: async (message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) => {
  //   // Handle incoming email logic here
  // }
};
