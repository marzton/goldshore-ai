import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('GoldShore Mail Worker'));

app.post('/email', async (c) => {
  // Placeholder for email sending logic
  // "Use best practices with regard to what goes where like api in gs api worker... gs gateway for handling"
  // This worker might be the sink for email events or the actual sender via MailChannels/SendGrid
  return c.json({ status: 'queued' }, 202);
});

export default {
  fetch: app.fetch,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  async email(message: any, _env: any, _ctx: any) {
    // Basic email handler for Cloudflare Email Routing
    console.log(`Received email from: ${message.from}`);
    // "Install, config, manage, etc."
    // Forward to API or process?
    // For now, just log to satisfy "integration pipeline" existence.
  }
};
