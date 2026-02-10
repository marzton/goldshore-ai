import { Hono } from 'hono';

interface Env {
  ENV?: string;
  MAIL_FORWARD_TO?: string;
  MAIL_ALLOWED_RECIPIENTS?: string;
  MAIL_BLOCKED_SENDERS?: string;
}

const VERSION = '2026.02.10-mail-worker-fix';

const app = new Hono<{ Bindings: Env }>();

const splitCsv = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

const isEmailLike = (value: string) => /.+@.+\..+/.test(value);

app.get('/', (c) => c.text('GoldShore Mail Worker'));

app.get('/health', (c) =>
  c.json({ status: 'ok', service: 'gs-mail', env: c.env.ENV ?? 'unknown' }),
);

app.get('/system/info', (c) =>
  c.json({
    service: 'gs-mail',
    runtime: 'cloudflare-worker',
    env: c.env.ENV ?? 'unknown',
  }),
);

app.get('/version', (c) => c.json({ version: VERSION }));

app.post('/webhook', async (c) => {
  // Reserved for future provider hooks.
  return c.json({ received: true });
});

export default {
  fetch: app.fetch,
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const sender = message.from.trim().toLowerCase();
    const recipient = message.to.trim().toLowerCase();

    const blockedSenders = splitCsv(env.MAIL_BLOCKED_SENDERS);
    if (blockedSenders.includes(sender)) {
      message.setReject('Sender is blocked.');
      return;
    }

    const allowedRecipients = splitCsv(env.MAIL_ALLOWED_RECIPIENTS);
    if (
      allowedRecipients.length > 0 &&
      !allowedRecipients.includes(recipient)
    ) {
      message.setReject('Recipient address not accepted.');
      return;
    }

    const forwardTo = env.MAIL_FORWARD_TO?.trim();
    if (!forwardTo || !isEmailLike(forwardTo)) {
      message.setReject('Mail forwarding is not configured.');
      return;
    }

    await message.forward(forwardTo);
  },
};
