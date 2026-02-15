import type { APIRoute } from 'astro';
import { buildLeadAutoResponder } from '../../emails/leadAutoResponder';
import { isValidEmail } from '../../utils/security';

const CONTACT_TTL_SECONDS = 60 * 60 * 24 * 90;

type Submission = {
  id: string;
  formType: string;
  name: string;
  email: string;
  company: string;
  role: string;
  website: string;
  teamSize: string;
  industry: string;
  timeline: string;
  budget: string;
  goals: string;
  message: string;
  receivedAt: string;
  ipAddress?: string;
  userAgent?: string;
};

const storeInKv = async (
  kv: KVNamespace,
  submission: Submission,
  autoResponder: ReturnType<typeof buildLeadAutoResponder>
) => {
  await kv.put(`contact:${submission.id}`, JSON.stringify({ submission, autoResponder }), {
    expirationTtl: CONTACT_TTL_SECONDS,
    metadata: {
      formType: submission.formType,
    },
  });
};

const storeInD1 = async (
  db: D1Database,
  submission: Submission,
  autoResponder: ReturnType<typeof buildLeadAutoResponder>
) => {
  await db
    .prepare(
      `INSERT INTO lead_submissions (
        id,
        form_type,
        name,
        email,
        company,
        role,
        website,
        team_size,
        industry,
        timeline,
        budget,
        goals,
        message,
        received_at,
        ip_address,
        user_agent,
        auto_responder_subject,
        auto_responder_text,
        auto_responder_html
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      submission.id,
      submission.formType,
      submission.name || null,
      submission.email || null,
      submission.company || null,
      submission.role || null,
      submission.website || null,
      submission.teamSize || null,
      submission.industry || null,
      submission.timeline || null,
      submission.budget || null,
      submission.goals || null,
      submission.message || null,
      submission.receivedAt,
      submission.ipAddress || null,
      submission.userAgent || null,
      autoResponder.subject,
      autoResponder.text,
      autoResponder.html
    )
    .run();
};

const extractString = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value.trim() : '';

const safeRedirect = (redirectTo: string | null, origin: string) => {
  if (!redirectTo) return new URL('/thank-you', origin);
  const trimmed = redirectTo.trim();
  if (!trimmed.startsWith('/')) return new URL('/thank-you', origin);
  return new URL(trimmed, origin);
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('form')) {
    return new Response('Unsupported payload.', { status: 415 });
  }

  const formData = await request.formData();
  const formType = extractString(formData.get('formType')) || 'contact';
  const redirectTo = extractString(formData.get('redirectTo'));

  const submission: Submission = {
    id: crypto.randomUUID(),
    formType,
    name: extractString(formData.get('name')),
    email: extractString(formData.get('email')),
    company: extractString(formData.get('company')),
    role: extractString(formData.get('role')),
    website: extractString(formData.get('website')),
    teamSize: extractString(formData.get('teamSize')),
    industry: extractString(formData.get('industry')),
    timeline: extractString(formData.get('timeline')),
    budget: extractString(formData.get('budget')),
    goals: extractString(formData.get('goals')),
    message: extractString(formData.get('message')),
    receivedAt: new Date().toISOString(),
    ipAddress: request.headers.get('CF-Connecting-IP') ?? undefined,
    userAgent: request.headers.get('User-Agent') ?? undefined,
  };

  if (submission.email && !isValidEmail(submission.email)) {
    return new Response('Invalid email address.', { status: 400 });
  }

  const env = locals.runtime?.env as Env | undefined;

  if (!env?.KV && !env?.DB) {
    return new Response('Storage unavailable.', { status: 503 });
  }

  const autoResponder = buildLeadAutoResponder({
    name: submission.name,
    formType: submission.formType,
  });

  const storageTasks: Promise<unknown>[] = [];
  if (env?.KV) storageTasks.push(storeInKv(env.KV, submission, autoResponder));
  if (env?.DB) storageTasks.push(storeInD1(env.DB, submission, autoResponder));

  const storageResults = await Promise.allSettled(storageTasks);
  const storedSuccessfully = storageResults.some((result) => result.status === 'fulfilled');

  if (!storedSuccessfully) {
    console.error('Contact submission storage failed.', storageResults);
    return new Response('Storage unavailable.', { status: 503 });
  }

  const redirectUrl = safeRedirect(redirectTo, new URL(request.url).origin);
  return Response.redirect(redirectUrl, 303);
};

export const GET: APIRoute = async () =>
  new Response('Method not allowed.', { status: 405 });
