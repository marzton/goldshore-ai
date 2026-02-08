import { Hono } from 'hono';

interface Env {
  ENV: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.text('GoldShore Mail Worker'));

app.get('/health', (c) => c.json({ status: 'ok', service: 'gs-mail' }));

app.post('/webhook', async (c) => {
  // Placeholder for future webhook processing
  return c.json({ received: true });
import { EmailMessage } from "cloudflare:email";

export interface Env {
  // Add environment bindings here (KV, etc.)
}

export default {
  async email(message: EmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    // Basic email handler scaffolding
    console.log(`Received email from ${message.from} to ${message.to}`);

    // Example: Forwarding (commented out until configured)
    // await message.forward("dest@example.com");

    // Example: Rejecting
    // message.setReject("Not implemented yet");
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
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    // Basic email handling logic - can be expanded later
    console.log(`Received email from ${message.from} to ${message.to}`);
    // Example: forward to an external address or process content
    // await message.forward("support-inbox@example.com");
  async email(message: any, env: any, ctx: any) {
    // Basic email handler for Cloudflare Email Routing
    console.log(`Received email from: ${message.from}`);
    // "Install, config, manage, etc."
    // Forward to API or process?
    // For now, just log to satisfy "integration pipeline" existence.
  }
};
