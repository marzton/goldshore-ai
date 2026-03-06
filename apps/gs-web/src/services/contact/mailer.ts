import { isValidEmail } from '../../utils/security';
import type { FormConfig, MailRecipient, Submission } from './types';

export const dedupeRecipients = (recipients: MailRecipient[]) => {
  const unique = new Map<string, MailRecipient>();
  recipients.forEach((recipient) => {
    const email = recipient.email.trim().toLowerCase();
    if (!email || !isValidEmail(email)) return;
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

  const text = filtered.map(([label, value]) => `${label}: ${value}`).join('\n');
  const html = filtered
    .map(
      ([label, value]) =>
        `<p><strong>${label}:</strong> ${value.replace(/</g, '&lt;')}</p>`,
    )
    .join('');

  return { text, html };
};
