import { Hono } from 'hono';

interface IntakeRecipient {
  email: string;
  name?: string;
}

interface IntakePayload {
  submission?: {
    id?: string;
    formType?: string;
    name?: string;
    email?: string;
    company?: string;
    message?: string;
    receivedAt?: string;
  };
  recipients?: IntakeRecipient[];
  subject?: string;
  text?: string;
  html?: string;
}

interface Env {
  GS_CONFIG: KVNamespace;
  ENV?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM_EMAIL?: string;
  MAIL_PROVIDER?: string;
  GS_MAIL_API_TOKEN?: string;
  MAIL_ALLOWED_ORIGINS?: string;
}

const app = new Hono<{ Bindings: Env }>();
const VERSION = '2026.03.06-mail-intake-resend';
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

const isValidEmail = (value?: string): value is string =>
  Boolean(value && /.+@.+\..+/.test(value));

const parseAllowedOrigins = (rawOrigins: string | undefined): string[] => {
  const defaults = ['https://goldshore.ai'];
  if (!rawOrigins?.trim()) return defaults;
  return [...new Set([...defaults, ...rawOrigins.split(',').map((value) => value.trim()).filter(Boolean)])];
};

const resolveOrigin = (request: Request, env: Env): string | null => {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  if (origin.includes('.pages.dev')) {
    return origin;
  }

  const allowlist = parseAllowedOrigins(env.MAIL_ALLOWED_ORIGINS);
  return allowlist.includes(origin) ? origin : null;
};

const corsHeaders = (request: Request, env: Env): Headers => {
  const headers = new Headers(JSON_HEADERS);
  const origin = resolveOrigin(request, env);
  if (origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'origin');
  }
  headers.set('access-control-allow-methods', 'POST, OPTIONS');
  headers.set('access-control-allow-headers', 'authorization, content-type');
  headers.set('access-control-max-age', '600');
  return headers;
};

const buildReplyTo = (submission: IntakePayload['submission']) => {
  if (!submission?.email || !isValidEmail(submission.email)) return undefined;
  return submission.name
    ? `${submission.name} <${submission.email}>`
    : submission.email;
};

const sendViaResend = async (
  env: Env,
  payload: Required<Pick<IntakePayload, 'recipients' | 'subject' | 'text' | 'html'>> & IntakePayload,
) => {
  if (!env.RESEND_API_KEY) {
    return { ok: false, error: 'missing_resend_api_key' };
  }

  const from = env.MAIL_FROM_EMAIL?.trim() || 'onboarding@goldshore.ai';
  if (!isValidEmail(from)) {
    return { ok: false, error: 'invalid_sender' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: payload.recipients.map((recipient) => recipient.email),
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      reply_to: buildReplyTo(payload.submission),
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: 'provider_error',
      status: response.status,
      details: await response.text(),
    };
  }

  return { ok: true };
};

app.options('/v1/forms/intake', (c) =>
  new Response(null, { status: 204, headers: corsHeaders(c.req.raw, c.env) }),
);

app.post('/v1/forms/intake', async (c) => {
  const headers = corsHeaders(c.req.raw, c.env);
  const authHeader = c.req.header('authorization') || '';
  const expectedToken = c.env.GS_MAIL_API_TOKEN?.trim();

  if (expectedToken) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token || token !== expectedToken) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers });
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

app.get('/health', (c) =>
  new Response(
    JSON.stringify({
      ok: true,
      service: 'gs-mail',
      version: VERSION,
      env: c.env.ENV ?? 'prod',
    }),
    { headers: JSON_HEADERS },
  ),
);

export default {
  fetch: app.fetch,
};
