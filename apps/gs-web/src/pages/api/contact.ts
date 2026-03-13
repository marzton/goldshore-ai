import type { APIRoute } from 'astro';
import { buildLeadAutoResponder } from '../../emails/leadAutoResponder';
import { isValidEmail } from '../../utils/security';
import type { Submission } from '../../services/contact/types';
import {
  extractString,
  isSpamSubmission,
  validateRequiredFields,
  safeRedirect,
} from '../../services/contact/validation';
import {
  normalizeFormConfig,
  fetchFormConfig,
  logSubmissionStatus,
  storeInKv,
  storeInD1,
} from '../../services/contact/storage';

const DEFAULT_CONTACT_TTL_SECONDS = 60 * 60 * 24 * 90;

export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('form')) {
    return new Response('Unsupported payload.', { status: 415 });
  }

  const formData = await request.formData();
  const formType = extractString(formData.get('formType')) || 'contact';
  const redirectTo = extractString(formData.get('redirectTo'));
  const isSpam = isSpamSubmission(formData);

  const submission: Submission = {
    id: crypto.randomUUID(),
    formType,
    status: 'new',
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

  if (isSpam) {
    const redirectUrl = safeRedirect(redirectTo, new URL(request.url).origin);
    return Response.redirect(redirectUrl, 303);
  }

  if (submission.email && !isValidEmail(submission.email)) {
    return new Response('Invalid email address.', { status: 400 });
  }

  const env = locals.runtime?.env as Env | undefined;

  if (!env?.KV && !env?.DB) {
    return new Response('Storage unavailable.', { status: 503 });
  }

  const formConfig = env?.DB ? await fetchFormConfig(env.DB, formType) : normalizeFormConfig(null, formType);

  if (formConfig.status !== 'active') {
    if (env?.DB) {
      await logSubmissionStatus(env.DB, submission.id, formType, 'blocked', 'Form is not accepting submissions.', {
        status: formConfig.status
      });
    }
    return new Response('Form is not accepting submissions.', { status: 403 });
  }

  const missingFields = validateRequiredFields(submission, formConfig.fields);
  if (missingFields.length > 0) {
    if (env?.DB) {
      await logSubmissionStatus(env.DB, submission.id, formType, 'rejected', 'Missing required fields.', {
        fields: missingFields.map((field) => field.name)
      });
    }
    return new Response('Missing required fields.', { status: 400 });
  }

  const ttl = env?.CONTACT_TTL_SECONDS ? parseInt(env.CONTACT_TTL_SECONDS, 10) : DEFAULT_CONTACT_TTL_SECONDS;

  const autoResponder = buildLeadAutoResponder({
    name: submission.name,
    formType: submission.formType,
  });

  const storageTasks: Promise<unknown>[] = [];
  if (env?.KV)
    storageTasks.push(storeInKv(env.KV, submission, autoResponder, ttl));
  if (env?.DB) storageTasks.push(storeInD1(env.DB, submission, autoResponder));

  const storageResults = await Promise.allSettled(storageTasks);
  const storedSuccessfully = storageResults.some(
    (result) => result.status === 'fulfilled',
  );

  if (!storedSuccessfully) {
    console.error('Contact submission storage failed.', storageResults);
    if (env?.DB) {
      await logSubmissionStatus(env.DB, submission.id, formType, 'storage_failed', 'Storage unavailable.');
    }
    return new Response('Storage unavailable.', { status: 503 });
  }

  if (env?.DB) {
    await logSubmissionStatus(env.DB, submission.id, formType, 'stored', 'Submission stored successfully.', {
      recipients: formConfig.recipients,
      integrations: formConfig.integrations
    });
  }

  const redirectUrl = safeRedirect(redirectTo, new URL(request.url).origin);
  return Response.redirect(redirectUrl, 303);
};

export const GET: APIRoute = async () =>
  new Response('Method not allowed.', { status: 405 });
