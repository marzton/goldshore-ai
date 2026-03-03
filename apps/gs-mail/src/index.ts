import { Hono } from 'hono';
import { EmailInboxLogsSchema, EmailLogSchema } from '../../packages/schema/src/system';

/**
 * Combined Environment Interface
 */
interface Env {
  GS_CONFIG: KVNamespace;
  ENV?: string;
  MAIL_FORWARD_TO?: string; // Standardized to match your scaffolding
  FORWARD_TO?: string;      // Support for existing alias
  MAIL_BLOCKED_SENDERS?: string;
}

const VERSION = '2026.03.03-integrated-mail-persistent';
const app = new Hono<{ Bindings: Env }>();
const isEmailLike = (value: string) => /.+@.+\..+/.test(value);

// --- Hono API Routes (Web Traffic) ---

app.get('/', (c) => c.text('GoldShore Mail Worker - PERSISTENT ACTIVE'));

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

  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    const sender = message.from;
    const recipient = message.to;
    const subject = message.headers.get('subject') || 'No Subject';

    // 1. Basic Filtering (Defense in Depth)
    const blocked = env.MAIL_BLOCKED_SENDERS?.split(',').map(s => s.trim()) || [];
    if (blocked.includes(sender)) {
      message.setReject(`Sender ${sender} is blocked.`);
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
            const rawLogs = await env.GS_CONFIG.get('EMAIL_INBOX_LOGS', 'json');
            const parseResult = EmailInboxLogsSchema.safeParse(rawLogs);
            const currentLogs = parseResult.success ? parseResult.data : [];

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
