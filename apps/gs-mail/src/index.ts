import { Hono } from 'hono';
import { EmailInboxLogsSchema, type EmailLog } from '../../../packages/schema/src/system.ts';

/**
 * Combined Environment Interface
 */
interface Env {
  GS_CONFIG: KVNamespace;
  ENV?: string;
  MAIL_FORWARD_TO?: string; // Standardized to match your scaffolding
  FORWARD_TO?: string;      // Support for existing alias
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
  c.json({ 
    status: 'ok', 
    service: 'gs-mail', 
    env: c.env.ENV ?? 'production',
    version: VERSION 
  }),
);

app.get('/system/info', (c) =>
  c.json({
    service: 'gs-mail',
    runtime: 'cloudflare-worker',
    kv_bound: !!c.env.GS_CONFIG,
  }),
);

// --- Email Event Handler (SMTP Traffic) ---

export default {
  fetch: app.fetch,
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

    // 2. Construct & Validate Log Entry
    const newEntry = {
      id: crypto.randomUUID(),
      from: sender,
      to: recipient,
      subject: subject,
      timestamp: new Date().toISOString(),
    };

    const validation = EmailLogSchema.safeParse(newEntry);
    
    // 3. Persistence Logic (Asynchronous)
    if (validation.success) {
      ctx.waitUntil(
        (async () => {
          try {
            const rawLogs = await env.GS_CONFIG.get('EMAIL_INBOX_LOGS');
            let currentLogs: Array<typeof validation.data> = [];

            if (rawLogs) {
              try {
                const parsedLogs = JSON.parse(rawLogs);
                const parseResult = EmailInboxLogsSchema.safeParse(parsedLogs);
                if (parseResult.success) {
                  currentLogs = parseResult.data;
                } else {
                  console.error('❌ Existing EMAIL_INBOX_LOGS payload failed schema validation:', parseResult.error);
                }
              } catch (err) {
                console.error('❌ Failed to parse EMAIL_INBOX_LOGS payload:', err);
              }
            }

            // Prepend and truncate to 100 per SOP
            const updatedLogs = [validation.data, ...currentLogs].slice(0, 100);

            await env.GS_CONFIG.put('EMAIL_INBOX_LOGS', JSON.stringify(updatedLogs));
            console.info(`✅ Logged email: ${sender} -> ${recipient}`);
          } catch (err) {
            console.error('❌ KV Persistence Error:', err);
          }
        })()
      );
    } else {
      console.error('🚨 Schema Validation Failed for inbound mail:', validation.error);
    }

    // 4. Forwarding Logic
    const forwardTo = (env.MAIL_FORWARD_TO || env.FORWARD_TO)?.trim();
    if (forwardTo && isEmailLike(forwardTo)) {
      await message.forward(forwardTo);
    } else {
      console.warn('⚠️ Forwarding skipped: Target missing or invalid.');
    }
  }
};
