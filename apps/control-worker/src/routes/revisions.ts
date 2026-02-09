import { Hono } from "hono";
import type { AccessTokenPayload } from "@goldshore/auth";
import type { ControlEnv } from "../libs/types";
import {
  createRevision,
  getRevision,
  listRevisions,
  restoreRevision,
  type RevisionEntityType,
} from "../libs/revisions";

const isRevisionEntityType = (value: string): value is RevisionEntityType =>
  value === "page" || value === "media";

export const revisionsRoutes = new Hono<{
  Bindings: ControlEnv;
  Variables: {
    accessClaims: AccessTokenPayload;
  };
}>();

revisionsRoutes.get("/:entityType/:entityId/revisions", async (c) => {
  const { entityType, entityId } = c.req.param();
  if (!isRevisionEntityType(entityType)) {
    return c.json({ error: "Invalid entity type." }, 400);
  }
  const revisions = await listRevisions(c.env, entityType, entityId);
  return c.json({ revisions });
});

revisionsRoutes.get("/:entityType/:entityId/revisions/:revisionId", async (c) => {
  const { entityType, entityId, revisionId } = c.req.param();
  if (!isRevisionEntityType(entityType)) {
    return c.json({ error: "Invalid entity type." }, 400);
  }
  const revision = await getRevision(c.env, entityType, entityId, revisionId);
  if (!revision) {
    return c.json({ error: "Revision not found." }, 404);
  }
  return c.json({ revision });
});

revisionsRoutes.post("/:entityType/:entityId/revisions", async (c) => {
  const { entityType, entityId } = c.req.param();
  if (!isRevisionEntityType(entityType)) {
    return c.json({ error: "Invalid entity type." }, 400);
  }

  const payload = await c.req.json<{
    content?: string;
    mediaMetadata?: Record<string, unknown>;
    message?: string;
  }>();

  const author = c.get("accessClaims")?.email ?? "unknown";

  const revision = await createRevision(
    c.env,
    entityType,
    entityId,
    {
      content: payload.content,
      mediaMetadata: payload.mediaMetadata,
    },
    {
      author,
      message: payload.message,
    }
  );

  return c.json({ revision }, 201);
});

revisionsRoutes.post("/:entityType/:entityId/revisions/:revisionId/restore", async (c) => {
  const { entityType, entityId, revisionId } = c.req.param();
  if (!isRevisionEntityType(entityType)) {
    return c.json({ error: "Invalid entity type." }, 400);
  }

  const author = c.get("accessClaims")?.email ?? "unknown";
  const restored = await restoreRevision(c.env, entityType, entityId, revisionId, { author });
  if (!restored) {
    return c.json({ error: "Revision not found." }, 404);
  }

  return c.json({ revision: restored }, 201);
});
