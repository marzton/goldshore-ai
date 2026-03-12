import { Hono } from 'hono';
import {
  EmailInboxLogsSchema,
  EmailLogSchema,
  type EmailLog,
} from '../../../packages/schema/src/system';

interface Env {
  GS_CONFIG: KVNamespace;
  ENV?: string;
  MAIL_FORWARD_TO?: string;
  FORWARD_TO?: string;
  MAIL_BLOCKED_SENDERS?: string;
}

const VERSION = '2026.03.03-mail-inbox-log';
const app = new Hono<{ Bindings: Env }>();
const isEmailLike = (value: string) => /.+@.+\..+/.test(value);

const readInboxLogs = async (kv: KVNamespace): Promise<EmailLog[]> => {
  const rawLogs = await kv.get('EMAIL_INBOX_LOGS', 'text');
  if (!rawLogs) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawLogs);
    const validated = EmailInboxLogsSchema.safeParse(parsed);
    if (!validated.success) {
      console.error('❌ Existing EMAIL_INBOX_LOGS payload failed schema validation:', validated.error);
      return [];
    }

    return validated.data;
  } catch (error) {
    console.error('❌ Failed to parse EMAIL_INBOX_LOGS payload:', error);
    return [];
  }
};

app.get('/', (c) => c.text('GoldShore Mail Worker'));
app.get('/health', (c) => c.json({ status: 'ok', service: 'gs-mail', env: c.env.ENV ?? 'production', version: VERSION }));
app.get('/system/info', (c) => c.json({ service: 'gs-mail', runtime: 'cloudflare-worker', kv_bound: !!c.env.GS_CONFIG }));
app.get('/version', (c) => c.json({ version: VERSION }));

export default {
  fetch: app.fetch,

  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    const sender = message.from;
    const recipient = message.to;
    const subject = message.headers.get('subject') || 'No Subject';

    const blocked = env.MAIL_BLOCKED_SENDERS?.split(',').map((item) => item.trim()) || [];
    if (blocked.includes(sender)) {
      message.setReject(`Sender ${sender} is blocked.`);
      return;
    }

    const parsedEntry = EmailLogSchema.safeParse({
      id: crypto.randomUUID(),
      from: sender,
      to: recipient,
      subject,
      timestamp: new Date().toISOString(),
    });

    if (!parsedEntry.success) {
      console.error('🚨 Schema validation failed for inbound mail:', parsedEntry.error);
      return;
    }

    ctx.waitUntil(
      (async () => {
        try {
          const existingLogs = await readInboxLogs(env.GS_CONFIG);
          const updatedLogs = [parsedEntry.data, ...existingLogs].slice(0, 100);
          await env.GS_CONFIG.put('EMAIL_INBOX_LOGS', JSON.stringify(updatedLogs));
          console.info(`✅ Logged email: ${sender} -> ${recipient}`);
        } catch (error) {
          console.error('❌ KV persistence error:', error);
        }
      })(),
    );

    const forwardTo = (env.MAIL_FORWARD_TO || env.FORWARD_TO)?.trim();
    if (forwardTo && isEmailLike(forwardTo)) {
      await message.forward(forwardTo);
      return;
    }

    console.warn('⚠️ Forwarding skipped: target missing or invalid.');
  },
};
