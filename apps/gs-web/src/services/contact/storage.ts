import { parseJson } from '@goldshore/utils';
import type { buildLeadAutoResponder } from '../../emails/leadAutoResponder';
import type { FormConfig, FormField, FormIntegration, FormRecipient, Submission } from './types';

export const normalizeFormConfig = (row: Record<string, string> | null, slug: string): FormConfig => {
  const now = new Date().toISOString();
  if (!row) {
    return {
      id: `fallback:${slug}`,
      slug,
      name: `Form: ${slug}`,
      status: 'active',
      fields: [],
      recipients: [],
      integrations: [],
      createdAt: now,
      updatedAt: now
    };
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: (row.status as FormConfig['status']) ?? 'active',
    fields: parseJson<FormField[]>(row.fields ?? null, []),
    recipients: parseJson<FormRecipient[]>(row.recipients ?? null, []),
    integrations: parseJson<FormIntegration[]>(row.integrations ?? null, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const fetchFormConfig = async (db: D1Database, slug: string): Promise<FormConfig> => {
  const result = await db
    .prepare(
      `SELECT id, slug, name, status, fields, recipients, integrations, created_at, updated_at
       FROM form_configs
       WHERE slug = ?
       LIMIT 1`
    )
    .bind(slug)
    .all();

  const row = result?.results?.[0] as Record<string, string> | undefined;
  return normalizeFormConfig(row ?? null, slug);
};

export const logSubmissionStatus = async (
  db: D1Database,
  submissionId: string,
  formSlug: string,
  status: string,
  message?: string,
  details?: Record<string, unknown>
) => {
  await db
    .prepare(
      `INSERT INTO form_submission_logs (
        id,
        submission_id,
        form_slug,
        status,
        message,
        details,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      submissionId,
      formSlug,
      status,
      message ?? null,
      details ? JSON.stringify(details) : null,
      new Date().toISOString()
    )
    .run();
};

export const storeInKv = async (
  kv: KVNamespace,
  submission: Submission,
  autoResponder: ReturnType<typeof buildLeadAutoResponder>,
  ttl: number,
) => {
  await kv.put(`contact:${submission.id}`, JSON.stringify({ submission, autoResponder }), {
    expirationTtl: ttl,
    metadata: {
      formType: submission.formType,
      status: submission.status,
    },
  });
};

export const storeInD1 = async (
  db: D1Database,
  submission: Submission,
  autoResponder: ReturnType<typeof buildLeadAutoResponder>,
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
        status,
        received_at,
        ip_address,
        user_agent,
        auto_responder_subject,
        auto_responder_text,
        auto_responder_html
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      submission.status,
      submission.receivedAt,
      submission.ipAddress || null,
      submission.userAgent || null,
      autoResponder.subject,
      autoResponder.text,
      autoResponder.html,
    )
    .run();
};
