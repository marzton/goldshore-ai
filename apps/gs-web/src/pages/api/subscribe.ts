import type { APIRoute } from 'astro';
import { buildWelcomeBriefingEmail } from '../../emails/welcomeBriefing';
import { isValidEmail } from '../../utils/security';

const toString = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value.trim() : '';

export const POST: APIRoute = async ({ request }) => {
  if (!request.headers.get('content-type')?.includes('form')) {
    return new Response('Unsupported payload.', { status: 415 });
  }

  const formData = await request.formData();
  const email = toString(formData.get('email'));
  const investorType = toString(formData.get('investorType'));
  const firstName = toString(formData.get('firstName'));

  if (!email || !isValidEmail(email)) {
    return new Response('Invalid email address.', { status: 400 });
  }

  const autoResponder = buildWelcomeBriefingEmail({
    email,
    investorType,
    firstName,
  });

  // Persist/send wiring can be connected to mail transport in a follow-up.
  console.info('subscribe:intelligence-sync', {
    email,
    investorType,
    subject: autoResponder.subject,
  });

  return Response.redirect(new URL('/thank-you', request.url), 303);
};

export const GET: APIRoute = async () =>
  new Response('Method not allowed.', { status: 405 });
