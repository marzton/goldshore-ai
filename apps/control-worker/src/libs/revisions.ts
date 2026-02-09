import type { ControlEnv } from "./types";

export type RevisionEntityType = "page" | "media";

export type RevisionPayload = {
  content?: string;
  mediaMetadata?: Record<string, unknown>;
};

export type RevisionRecord = RevisionPayload & {
  id: string;
  entityId: string;
  entityType: RevisionEntityType;
  createdAt: string;
  author?: string;
  message?: string;
  restoredFrom?: string;
};

export type RevisionSummary = {
  id: string;
  createdAt: string;
  author?: string;
  message?: string;
  hasContent: boolean;
  hasMediaMetadata: boolean;
  restoredFrom?: string;
};

const revisionPrefix = (entityType: RevisionEntityType, entityId: string) =>
  `revisions/${entityType}/${entityId}/`;

const revisionKey = (entityType: RevisionEntityType, entityId: string, revisionId: string) =>
  `${revisionPrefix(entityType, entityId)}${revisionId}.json`;

const toSummary = (object: R2Object): RevisionSummary => {
  const createdAt = object.customMetadata?.createdAt ?? object.uploaded.toISOString();
  return {
    id: object.key.split("/").pop()?.replace(/\.json$/, "") ?? object.key,
    createdAt,
    author: object.customMetadata?.author,
    message: object.customMetadata?.message,
    hasContent: object.customMetadata?.hasContent === "true",
    hasMediaMetadata: object.customMetadata?.hasMediaMetadata === "true",
    restoredFrom: object.customMetadata?.restoredFrom,
  };
};

export const listRevisions = async (
  env: ControlEnv,
  entityType: RevisionEntityType,
  entityId: string
): Promise<RevisionSummary[]> => {
  const list = await env.STATE.list({ prefix: revisionPrefix(entityType, entityId) });
  const summaries = list.objects.map(toSummary);
  summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return summaries;
};

export const getRevision = async (
  env: ControlEnv,
  entityType: RevisionEntityType,
  entityId: string,
  revisionId: string
): Promise<RevisionRecord | null> => {
  const result = await env.STATE.get(revisionKey(entityType, entityId, revisionId));
  if (!result) {
    return null;
  }
  return result.json<RevisionRecord>();
};

export const createRevision = async (
  env: ControlEnv,
  entityType: RevisionEntityType,
  entityId: string,
  payload: RevisionPayload,
  options: { author?: string; message?: string; restoredFrom?: string } = {}
): Promise<RevisionRecord> => {
  const id = crypto.randomUUID();
  const record: RevisionRecord = {
    id,
    entityId,
    entityType,
    createdAt: new Date().toISOString(),
    author: options.author,
    message: options.message,
    restoredFrom: options.restoredFrom,
    content: payload.content,
    mediaMetadata: payload.mediaMetadata,
  };

  await env.STATE.put(revisionKey(entityType, entityId, id), JSON.stringify(record), {
    customMetadata: {
      createdAt: record.createdAt,
      author: record.author ?? "",
      message: record.message ?? "",
      restoredFrom: record.restoredFrom ?? "",
      hasContent: String(Boolean(record.content)),
      hasMediaMetadata: String(Boolean(record.mediaMetadata)),
    },
    httpMetadata: {
      contentType: "application/json",
    },
  });

  return record;
};

export const restoreRevision = async (
  env: ControlEnv,
  entityType: RevisionEntityType,
  entityId: string,
  revisionId: string,
  options: { author?: string } = {}
): Promise<RevisionRecord | null> => {
  const revision = await getRevision(env, entityType, entityId, revisionId);
  if (!revision) {
    return null;
  }

  return createRevision(
    env,
    entityType,
    entityId,
    {
      content: revision.content,
      mediaMetadata: revision.mediaMetadata,
    },
    {
      author: options.author,
      message: `Restored from revision ${revision.id}`,
      restoredFrom: revision.id,
    }
  );
};
