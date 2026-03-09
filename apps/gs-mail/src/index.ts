import { Hono } from 'hono';
import {
  EmailInboxLogsSchema,
  EmailLogSchema,
  type EmailLog,
} from '../../../packages/schema/src/system';

interface Env {
  GS_CONFIG: KVNamespace;
  ENV?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM_EMAIL?: string;
  MAIL_PROVIDER?: string;
  GS_MAIL_API_TOKEN?: string;
  MAIL_ALLOWED_ORIGINS?: string;
  MAIL_FORWARD_TO?: string;
  FORWARD_TO?: string;
  MAIL_BLOCKED_SENDERS?: string;
  FORM_INTAKE_AUTH_TOKEN?: string;
  MAIL_FROM_EMAIL?: string;
  MAIL_FROM_NAME?: string;
  MAIL_FROM_DOMAIN?: string;
  RESEND_API_KEY?: string;
  POSTMARK_SERVER_TOKEN?: string;
}

type IntakeRecipient = {
  email: string;
  name?: string;
};

type IntakePayload = {
  submission: {
    id: string;
    formType: string;
    email?: string;
  };
  recipients: IntakeRecipient[];
  subject: string;
  text: string;
  html: string;
};

const VERSION = '2026.03.05-forms-intake-provider-mail';
const RESEND_API_URL = 'https://api.resend.com/emails';
const POSTMARK_API_URL = 'https://api.postmarkapp.com/email';

const app = new Hono<{ Bindings: Env }>();
const VERSION = '2026.03.06-mail-intake-resend';
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

const isValidEmail = (value?: string): value is string =>
  Boolean(value && /.+@.+\..+/.test(value));

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
  headers.set('access-control-allow-methods', 'POST, OPTIONS');
  headers.set('access-control-allow-headers', 'authorization, content-type');
  headers.set('access-control-max-age', '600');
  return headers;
};

const hasVerifiedFromDomain = (fromEmail: string, fromDomain: string) =>
  fromEmail.toLowerCase().endsWith(`@${fromDomain.toLowerCase()}`);

const sendViaProvider = async (
  env: Env,
  to: IntakeRecipient[],
  subject: string,
  text: string,
  html: string,
  replyTo?: string,
) => {
  const fromEmail = env.MAIL_FROM_EMAIL?.trim();
  const fromName = env.MAIL_FROM_NAME?.trim() || 'GoldShore';
  const fromDomain = env.MAIL_FROM_DOMAIN?.trim();

  if (
    !fromEmail ||
    !fromDomain ||
    !hasVerifiedFromDomain(fromEmail, fromDomain) ||
    to.length === 0
  ) {
    return { attempted: false, reason: 'missing_mail_configuration' };
  }

  if (env.RESEND_API_KEY?.trim()) {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: to.map((recipient) => recipient.email),
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'resend',
      body: await response.text(),
    };
  }

  if (env.POSTMARK_SERVER_TOKEN?.trim()) {
    const response = await fetch(POSTMARK_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN.trim(),
      },
      body: JSON.stringify({
        From: `${fromName} <${fromEmail}>`,
        To: to.map((recipient) => recipient.email).join(','),
        Subject: subject,
        TextBody: text,
        HtmlBody: html,
        ...(replyTo ? { ReplyTo: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'postmark',
      body: await response.text(),
    };
  }

  return { attempted: false, reason: 'missing_provider_credentials' };
};

const isAuthorized = (request: Request, token?: string) => {
  if (!token?.trim()) return false;
  const authHeader = request.headers.get('authorization') ?? '';
  return authHeader === `Bearer ${token.trim()}`;
};

const hasVerifiedFromDomain = (fromEmail: string, fromDomain: string) =>
  fromEmail.toLowerCase().endsWith(`@${fromDomain.toLowerCase()}`);

const sendViaProvider = async (
  env: Env,
  to: IntakeRecipient[],
  subject: string,
  text: string,
  html: string,
  replyTo?: string,
) => {
  const fromEmail = env.MAIL_FROM_EMAIL?.trim();
  const fromName = env.MAIL_FROM_NAME?.trim() || 'GoldShore';
  const fromDomain = env.MAIL_FROM_DOMAIN?.trim();

  if (
    !fromEmail ||
    !fromDomain ||
    !hasVerifiedFromDomain(fromEmail, fromDomain) ||
    to.length === 0
  ) {
    return { attempted: false, reason: 'missing_mail_configuration' };
  }

  if (env.RESEND_API_KEY?.trim()) {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: to.map((recipient) => recipient.email),
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'resend',
      body: await response.text(),
    };
  }

  if (env.POSTMARK_SERVER_TOKEN?.trim()) {
    const response = await fetch(POSTMARK_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN.trim(),
      },
      body: JSON.stringify({
        From: `${fromName} <${fromEmail}>`,
        To: to.map((recipient) => recipient.email).join(','),
        Subject: subject,
        TextBody: text,
        HtmlBody: html,
        ...(replyTo ? { ReplyTo: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'postmark',
      body: await response.text(),
    };
  }

  return { attempted: false, reason: 'missing_provider_credentials' };
};

const isAuthorized = (request: Request, token?: string) => {
  if (!token?.trim()) return false;
  const authHeader = request.headers.get('authorization') ?? '';
  return authHeader === `Bearer ${token.trim()}`;
};

const hasVerifiedFromDomain = (fromEmail: string, fromDomain: string) =>
  fromEmail.toLowerCase().endsWith(`@${fromDomain.toLowerCase()}`);

const sendViaProvider = async (
  env: Env,
  to: IntakeRecipient[],
  subject: string,
  text: string,
  html: string,
  replyTo?: string,
) => {
  const fromEmail = env.MAIL_FROM_EMAIL?.trim();
  const fromName = env.MAIL_FROM_NAME?.trim() || 'GoldShore';
  const fromDomain = env.MAIL_FROM_DOMAIN?.trim();

  if (
    !fromEmail ||
    !fromDomain ||
    !hasVerifiedFromDomain(fromEmail, fromDomain) ||
    to.length === 0
  ) {
    return { attempted: false, reason: 'missing_mail_configuration' };
  }

  if (env.RESEND_API_KEY?.trim()) {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: to.map((recipient) => recipient.email),
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'resend',
      body: await response.text(),
    };
  }

  if (env.POSTMARK_SERVER_TOKEN?.trim()) {
    const response = await fetch(POSTMARK_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN.trim(),
      },
      body: JSON.stringify({
        From: `${fromName} <${fromEmail}>`,
        To: to.map((recipient) => recipient.email).join(','),
        Subject: subject,
        TextBody: text,
        HtmlBody: html,
        ...(replyTo ? { ReplyTo: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'postmark',
      body: await response.text(),
    };
  }

  return { attempted: false, reason: 'missing_provider_credentials' };
};

const isAuthorized = (request: Request, token?: string) => {
  if (!token?.trim()) return false;
  const authHeader = request.headers.get('authorization') ?? '';
  return authHeader === `Bearer ${token.trim()}`;
};

const hasVerifiedFromDomain = (fromEmail: string, fromDomain: string) =>
  fromEmail.toLowerCase().endsWith(`@${fromDomain.toLowerCase()}`);

const sendViaProvider = async (
  env: Env,
  to: IntakeRecipient[],
  subject: string,
  text: string,
  html: string,
  replyTo?: string,
) => {
  const fromEmail = env.MAIL_FROM_EMAIL?.trim();
  const fromName = env.MAIL_FROM_NAME?.trim() || 'GoldShore';
  const fromDomain = env.MAIL_FROM_DOMAIN?.trim();

  if (
    !fromEmail ||
    !fromDomain ||
    !hasVerifiedFromDomain(fromEmail, fromDomain) ||
    to.length === 0
  ) {
    return { attempted: false, reason: 'missing_mail_configuration' };
  }

  if (env.RESEND_API_KEY?.trim()) {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: to.map((recipient) => recipient.email),
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'resend',
      body: await response.text(),
    };
  }

  if (env.POSTMARK_SERVER_TOKEN?.trim()) {
    const response = await fetch(POSTMARK_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN.trim(),
      },
      body: JSON.stringify({
        From: `${fromName} <${fromEmail}>`,
        To: to.map((recipient) => recipient.email).join(','),
        Subject: subject,
        TextBody: text,
        HtmlBody: html,
        ...(replyTo ? { ReplyTo: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'postmark',
      body: await response.text(),
    };
  }

  return { attempted: false, reason: 'missing_provider_credentials' };
};

const isAuthorized = (request: Request, token?: string) => {
  if (!token?.trim()) return false;
  const authHeader = request.headers.get('authorization') ?? '';
  return authHeader === `Bearer ${token.trim()}`;
};

const hasVerifiedFromDomain = (fromEmail: string, fromDomain: string) =>
  fromEmail.toLowerCase().endsWith(`@${fromDomain.toLowerCase()}`);

const sendViaProvider = async (
  env: Env,
  to: IntakeRecipient[],
  subject: string,
  text: string,
  html: string,
  replyTo?: string,
) => {
  const fromEmail = env.MAIL_FROM_EMAIL?.trim();
  const fromName = env.MAIL_FROM_NAME?.trim() || 'GoldShore';
  const fromDomain = env.MAIL_FROM_DOMAIN?.trim();

  if (
    !fromEmail ||
    !fromDomain ||
    !hasVerifiedFromDomain(fromEmail, fromDomain) ||
    to.length === 0
  ) {
    return { attempted: false, reason: 'missing_mail_configuration' };
  }

  if (env.RESEND_API_KEY?.trim()) {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: to.map((recipient) => recipient.email),
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'resend',
      body: await response.text(),
    };
  }

  if (env.POSTMARK_SERVER_TOKEN?.trim()) {
    const response = await fetch(POSTMARK_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN.trim(),
      },
      body: JSON.stringify({
        From: `${fromName} <${fromEmail}>`,
        To: to.map((recipient) => recipient.email).join(','),
        Subject: subject,
        TextBody: text,
        HtmlBody: html,
        ...(replyTo ? { ReplyTo: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'postmark',
      body: await response.text(),
    };
  }

  return { attempted: false, reason: 'missing_provider_credentials' };
};

const isAuthorized = (request: Request, token?: string) => {
  if (!token?.trim()) return false;
  const authHeader = request.headers.get('authorization') ?? '';
  return authHeader === `Bearer ${token.trim()}`;
};

const hasVerifiedFromDomain = (fromEmail: string, fromDomain: string) =>
  fromEmail.toLowerCase().endsWith(`@${fromDomain.toLowerCase()}`);

const sendViaProvider = async (
  env: Env,
  to: IntakeRecipient[],
  subject: string,
  text: string,
  html: string,
  replyTo?: string,
) => {
  const fromEmail = env.MAIL_FROM_EMAIL?.trim();
  const fromName = env.MAIL_FROM_NAME?.trim() || 'GoldShore';
  const fromDomain = env.MAIL_FROM_DOMAIN?.trim();

  if (
    !fromEmail ||
    !fromDomain ||
    !hasVerifiedFromDomain(fromEmail, fromDomain) ||
    to.length === 0
  ) {
    return { attempted: false, reason: 'missing_mail_configuration' };
  }

  if (env.RESEND_API_KEY?.trim()) {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: to.map((recipient) => recipient.email),
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'resend',
      body: await response.text(),
    };
  }

  if (env.POSTMARK_SERVER_TOKEN?.trim()) {
    const response = await fetch(POSTMARK_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN.trim(),
      },
      body: JSON.stringify({
        From: `${fromName} <${fromEmail}>`,
        To: to.map((recipient) => recipient.email).join(','),
        Subject: subject,
        TextBody: text,
        HtmlBody: html,
        ...(replyTo ? { ReplyTo: replyTo } : {}),
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      provider: 'postmark',
      body: await response.text(),
    };
  }

  return { attempted: false, reason: 'missing_provider_credentials' };
};

const isAuthorized = (request: Request, token?: string) => {
  if (!token?.trim()) return false;
  const authHeader = request.headers.get('authorization') ?? '';
  return authHeader === `Bearer ${token.trim()}`;
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

app.post('/v1/forms/intake', async (c) => {
  if (!isAuthorized(c.req.raw, c.env.FORM_INTAKE_AUTH_TOKEN)) {
    return c.json({ ok: false, error: 'unauthorized' }, 401);
  }

  const payload = (await c.req.json().catch(() => null)) as IntakePayload | null;
  if (!payload?.subject || !payload?.text || !payload?.html || !Array.isArray(payload?.recipients)) {
    return c.json({ ok: false, error: 'invalid_payload' }, 400);
  }

  const recipients = payload.recipients.filter((recipient) => isEmailLike(recipient.email));
  if (recipients.length === 0) {
    return c.json({ ok: false, error: 'no_valid_recipients' }, 400);
  }

  const replyTo = payload.submission?.email;
  const result = await sendViaProvider(
    c.env,
    recipients,
    payload.subject,
    payload.text,
    payload.html,
    replyTo && isEmailLike(replyTo) ? replyTo : undefined,
  );

  if (!result.attempted || !result.ok) {
    return c.json({ ok: false, result }, 502);
  }

  return c.json({ ok: true, result });
});

export default {
  fetch: app.fetch,

  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const sender = message.from;
    const recipient = message.to;
    const subject = message.headers.get('subject') || 'No Subject';

    const blocked =
      env.MAIL_BLOCKED_SENDERS?.split(',').map((item) => item.trim()) || [];
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
      console.error('Schema validation failed for inbound mail:', parsedEntry.error);
      return;
    }
  }

  const payload = (await c.req.json().catch(() => null)) as IntakePayload | null;
  const recipients = payload?.recipients?.filter((recipient) => isValidEmail(recipient.email));
  const subject = payload?.subject?.trim();
  const text = payload?.text?.trim();
  const html = payload?.html?.trim();

  if (!recipients?.length || !subject || !text || !html) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_payload' }), { status: 400, headers });
  }

  const result = await sendViaResend(c.env, {
    ...payload,
    recipients,
    subject,
    text,
    html,
  });

  if (!result.ok) {
    return new Response(JSON.stringify(result), { status: 502, headers });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
});

    ctx.waitUntil(
      (async () => {
        try {
          const existingLogs = await readInboxLogs(env.GS_CONFIG);
          const updatedLogs = [parsedEntry.data, ...existingLogs].slice(0, 100);
          await env.GS_CONFIG.put('EMAIL_INBOX_LOGS', JSON.stringify(updatedLogs));
        } catch (error) {
          console.error('KV persistence error:', error);
        }
      })(),
    );

    const forwardTo = (env.MAIL_FORWARD_TO || env.FORWARD_TO)?.trim();
    if (forwardTo && isEmailLike(forwardTo)) {
      await message.forward(forwardTo);
      return;
    }
    const newLogs = [logEntry, ...currentLogs].slice(0, 100);
    await env.GS_CONFIG.put('EMAIL_INBOX_LOGS', JSON.stringify(newLogs));
  };

  ctx.waitUntil(persistLog());
}

    console.warn('Forwarding skipped: target missing or invalid.');
  },
};
