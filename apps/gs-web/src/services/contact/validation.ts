import type { FormField, Submission } from './types';

export const extractString = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value.trim() : '';

export const isSpamSubmission = (formData: FormData) => {
  const honeypot = extractString(formData.get('companyWebsite'));
  if (honeypot) return true;

  const formStartedAt = extractString(formData.get('formStartedAt'));
  if (!formStartedAt) return false;

  const startedAtMs = Number(formStartedAt);
  if (!Number.isFinite(startedAtMs)) return true;

  const elapsedMs = Date.now() - startedAtMs;
  return elapsedMs < 2500;
};

export const validateRequiredFields = (submission: Submission, fields: FormField[]) => {
  const requiredFields = fields.filter((field) => field.required && field.name);
  const missing = requiredFields.filter((field) => {
    const value = (submission as Record<string, string | undefined>)[field.name];
    return !value;
  });

  return missing;
};

export const safeRedirect = (redirectTo: string | null, origin: string) => {
  if (!redirectTo) return new URL('/thank-you', origin);
  const trimmed = redirectTo.trim();
  if (!trimmed.startsWith('/')) return new URL('/thank-you', origin);
  return new URL(trimmed, origin);
};
