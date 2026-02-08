import { Hono } from 'hono';
import { EmailMessage } from "cloudflare:email";

interface Env {
  ENV: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.text('GoldShore Mail Worker'));

app.get('/health', (c) => c.json({ status: 'ok', service: 'gs-mail' }));

app.post('/webhook', async (c) => {
  // Placeholder for future webhook processing
  return c.json({ received: true });
});

export default {
  fetch: app.fetch,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async email(message: EmailMessage, _env: Env, _ctx: ExecutionContext): Promise<void> {
    // Basic email handler scaffolding
    console.log(`Received email from ${message.from} to ${message.to}`);

    // Example: Forwarding (commented out until configured)
    // await message.forward("dest@example.com");

    // Example: Rejecting
    // message.setReject("Not implemented yet");
  }
};
