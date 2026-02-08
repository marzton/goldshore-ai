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
});

export default {
  fetch: app.fetch,
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    // Basic email handling logic - can be expanded later
    console.log(`Received email from ${message.from} to ${message.to}`);
    // Example: forward to an external address or process content
    // await message.forward("support-inbox@example.com");
  }
};
