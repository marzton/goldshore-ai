import { Hono } from 'hono';
import { EmailInboxLogsSchema, type EmailLog } from '../../../packages/schema/src/system.ts';

interface Env {
  ENV?: string;
  MAIL_FORWARD_TO?: string;
  MAIL_ALLOWED_RECIPIENTS?: string;
  MAIL_BLOCKED_SENDERS?: string;
  GS_CONFIG: KVNamespace;
}

const VERSION = '2026.03.03-mail-inbox-log';

const app = new Hono<{ Bindings: Env }>();

const isEmailLike = (value: string) => /.+@.+\..+/.test(value);

const readInboxLogs = async (kv: KVNamespace): Promise<EmailLog[]> => {
  const rawLogs = await kv.get('EMAIL_INBOX_LOGS', 'text');
  if (!rawLogs) return [];

  try {
    const parsed = JSON.parse(rawLogs);
    const validated = EmailInboxLogsSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn('Invalid EMAIL_INBOX_LOGS shape detected. Resetting mailbox log.');
      return [];
    }
    return validated.data;
  } catch (error) {
    console.warn('Unable to parse EMAIL_INBOX_LOGS. Resetting mailbox log.', error);
    return [];
  }
};

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async email(message: EmailMessage, _env: Env, _ctx: ExecutionContext): Promise<void> {
    // Basic email handler scaffolding
    console.log(`Received email from ${message.from} to ${message.to}`);

    const forwardTo = _env.MAIL_FORWARD_TO?.trim();
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    console.log(`Received email from ${message.from} to ${message.to}`);

    const emailLog: EmailLog = {
      id: crypto.randomUUID(),
      from: message.from,
      to: message.to,
      subject: message.headers.get('subject') || 'No Subject',
      timestamp: new Date().toISOString(),
    };

    try {
      const logs = await readInboxLogs(env.GS_CONFIG);
      logs.unshift(emailLog);
      await env.GS_CONFIG.put('EMAIL_INBOX_LOGS', JSON.stringify(logs.slice(0, 100)));
      console.log(`✅ Logged email from ${message.from} to GS_CONFIG`);
    } catch (error) {
      console.error('❌ Failed to log email to KV:', error);
    }

    const forwardTo = env.MAIL_FORWARD_TO?.trim();
    if (!forwardTo || !isEmailLike(forwardTo)) {
      return;
    }

    await message.forward(forwardTo);
export default {
  async fetch(request: Request) {
    return new Response("Hello from gs-mail");
  },
};
