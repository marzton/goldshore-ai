import { isValidEmail } from '../../utils/security';
import type { FormConfig, MailRecipient, Submission } from './types';

const RESEND_API_URL = 'https://api.resend.com/emails';
const POSTMARK_API_URL = 'https://api.postmarkapp.com/email';

export const dedupeRecipients = (recipients: MailRecipient[]) => {
  const unique = new Map<string, MailRecipient>();
  recipients.forEach((recipient) => {
    const email = recipient.email.trim().toLowerCase();
    if (!email) return;
    if (!isValidEmail(email)) return;
    if (!unique.has(email)) {
      unique.set(email, {
        email,
        name: recipient.name?.trim() || undefined,
      });
    }
  });
  return [...unique.values()];
};

export const recipientsFromEnv = (
  rawRecipients: string | undefined,
): MailRecipient[] => {
  if (!rawRecipients) return [];

  return rawRecipients
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
};

export const resolveNotificationRecipients = (
  formConfig: FormConfig,
  env: Env,
): MailRecipient[] => {
  const fromConfig = formConfig.recipients
    .map((recipient) => ({
      email: recipient.email,
      name: recipient.name,
    }))
    .filter((recipient) => recipient.email);

  const fallback = recipientsFromEnv(env.CONTACT_NOTIFICATION_EMAILS);
  return dedupeRecipients([...fromConfig, ...fallback]);
};

export const buildSubmissionDigest = (submission: Submission) => {
  const pairs: Array<[string, string]> = [
    ['Submission ID', submission.id],
    ['Form type', submission.formType],
    ['Received', submission.receivedAt],
    ['Name', submission.name],
    ['Email', submission.email],
    ['Company', submission.company],
    ['Role', submission.role],
    ['Website', submission.website],
    ['Team size', submission.teamSize],
    ['Industry', submission.industry],
    ['Timeline', submission.timeline],
    ['Budget', submission.budget],
    ['Goals', submission.goals],
    ['Message', submission.message],
    ['IP', submission.ipAddress ?? ''],
    ['User agent', submission.userAgent ?? ''],
  ];

  const filtered = pairs.filter(([, value]) => value);

  const text = filtered
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
  const html = filtered
    .map(
      ([label, value]) =>
        `<p><strong>${label}:</strong> ${value.replace(/</g, '&lt;')}</p>`,
    )
    .join('');

  return { text, html };
};

const isVerifiedFromAddress = (fromEmail: string, fromDomain: string) => {
  const normalizedEmail = fromEmail.toLowerCase();
  const normalizedDomain = fromDomain.toLowerCase();
  return normalizedEmail.endsWith(`@${normalizedDomain}`);
};

export const sendMail = async (
  env: Env,
  to: MailRecipient[],
  subject: string,
  text: string,
  html: string,
  replyTo?: MailRecipient,
) => {
  const fromEmail = env.MAIL_FROM_EMAIL?.trim();
  const fromName = env.MAIL_FROM_NAME?.trim() || 'GoldShore';
  const fromDomain = env.MAIL_FROM_DOMAIN?.trim();

  if (
    !fromEmail ||
    !fromDomain ||
    !isValidEmail(fromEmail) ||
    !isVerifiedFromAddress(fromEmail, fromDomain) ||
    to.length === 0
  ) {
    return {
      attempted: false,
      reason: 'missing_mail_configuration',
    };
  }

  const validReplyTo =
    replyTo && isValidEmail(replyTo.email)
      ? { email: replyTo.email.trim().toLowerCase(), name: replyTo.name?.trim() }
      : undefined;

  if (env.RESEND_API_KEY?.trim()) {
    const payload = {
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      to: to.map((recipient) => recipient.email),
      subject,
      text,
      html,
      ...(validReplyTo ? { reply_to: validReplyTo.email } : {}),
    };

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      body: await response.text(),
      provider: 'resend',
    };
  }

  if (env.POSTMARK_SERVER_TOKEN?.trim()) {
    const payload = {
      From: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      To: to.map((recipient) => recipient.email).join(','),
      Subject: subject,
      TextBody: text,
      HtmlBody: html,
      ...(validReplyTo ? { ReplyTo: validReplyTo.email } : {}),
    };

    const response = await fetch(POSTMARK_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN.trim(),
      },
      body: JSON.stringify(payload),
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
      body: await response.text(),
      provider: 'postmark',
    };
  }

  return {
    attempted: false,
    reason: 'missing_provider_credentials',
  };
};
