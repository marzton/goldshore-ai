import { Hono } from 'hono';
<<<<<<< main-HEAD-2
import {
  EmailInboxLogsSchema,
  EmailLogSchema,
  type EmailLog,
} from '../../../packages/schema/src/system';
=======
import { EmailInboxLogsSchema, type EmailLog } from '../../../packages/schema/src/system.ts';
>>>>>>> chore/working-copy

interface Env {
  GS_CONFIG: KVNamespace;
  ENV?: string;
  MAIL_FORWARD_TO?: string;
  FORWARD_TO?: string;
  MAIL_BLOCKED_SENDERS?: string;
  GS_CONFIG: KVNamespace;
}

const VERSION = '2026.03.03-mail-inbox-log';
<<<<<<< main-HEAD-2
=======

>>>>>>> chore/working-copy
const app = new Hono<{ Bindings: Env }>();
const isEmailLike = (value: string) => /.+@.+\..+/.test(value);

const readInboxLogs = async (kv: KVNamespace): Promise<EmailLog[]> => {
  const rawLogs = await kv.get('EMAIL_INBOX_LOGS', 'text');
<<<<<<< main-HEAD-2
  if (!rawLogs) {
    return [];
  }
=======
  if (!rawLogs) return [];
>>>>>>> chore/working-copy

  try {
    const parsed = JSON.parse(rawLogs);
    const validated = EmailInboxLogsSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn('Invalid EMAIL_INBOX_LOGS shape detected. Resetting mailbox log.');
      return [];
    }
<<<<<<< main-HEAD-2

=======
>>>>>>> chore/working-copy
    return validated.data;
  } catch (error) {
    console.warn('Unable to parse EMAIL_INBOX_LOGS. Resetting mailbox log.', error);
    return [];
  }
};

app.get('/', (c) => c.text('GoldShore Mail Worker'));

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'gs-mail',
    env: c.env.ENV ?? 'production',
    version: VERSION,
  }),
);

app.get('/system/info', (c) =>
  c.json({
    service: 'gs-mail',
    runtime: 'cloudflare-worker',
    kv_bound: !!c.env.GS_CONFIG,
  }),
);

// Persistence present; code hygiene risk due to merge duplication has been removed in this unified handler.
export default {
  fetch: app.fetch,
<<<<<<< main-HEAD-2

  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    const sender = message.from;
    const recipient = message.to;
    const subject = message.headers.get('subject') || 'No Subject';

    const blocked = env.MAIL_BLOCKED_SENDERS?.split(',').map((item) => item.trim()) || [];
    if (blocked.includes(sender)) {
      message.setReject(`Sender ${sender} is blocked.`);
=======
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
>>>>>>> chore/working-copy
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
