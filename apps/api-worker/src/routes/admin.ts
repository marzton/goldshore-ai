import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { verifyAccessWithClaims, type AccessTokenPayload } from '@goldshore/auth';

type Bindings = {
  KV: KVNamespace;
  DB: D1Database;
  ASSETS: R2Bucket;
  CLOUDFLARE_ACCESS_AUDIENCE?: string;
  CLOUDFLARE_TEAM_DOMAIN?: string;
  ADMIN_SESSION_TTL_SECONDS?: string;
};

type AdminSession = {
  id: string;
  email?: string;
  createdAt: string;
  expiresAt: string;
};

const ADMIN_SESSION_COOKIE = 'gs_admin_session';
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 8;

const admin = new Hono<{ Bindings: Bindings }>();

const ensureAdminSchema = async (db: D1Database) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admin_content_pages (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE,
      title TEXT,
      status TEXT,
      body TEXT,
      metadata TEXT,
      created_at TEXT,
      updated_at TEXT,
      author TEXT
    );
    CREATE TABLE IF NOT EXISTS admin_media_assets (
      id TEXT PRIMARY KEY,
      file_name TEXT,
      content_type TEXT,
      size INTEGER,
      r2_key TEXT,
      alt_text TEXT,
      tags TEXT,
      created_at TEXT,
      uploaded_by TEXT
    );
    CREATE TABLE IF NOT EXISTS admin_form_definitions (
      id TEXT PRIMARY KEY,
      name TEXT,
      slug TEXT UNIQUE,
      description TEXT,
      fields TEXT,
      settings TEXT,
      status TEXT,
      created_at TEXT,
      updated_at TEXT,
      updated_by TEXT
    );
  `);
};

const getSessionTtlSeconds = (env: Bindings) => {
  const parsed = Number(env.ADMIN_SESSION_TTL_SECONDS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_TTL_SECONDS;
};

const setSessionCookie = (c: Parameters<typeof setCookie>[0], session: AdminSession) => {
  const isSecure = new URL(c.req.url).protocol === 'https:';
  setCookie(c, ADMIN_SESSION_COOKIE, session.id, {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'None' : 'Lax',
    maxAge: Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
  });
};

const readSession = async (c: Parameters<typeof getCookie>[0]) => {
  const sessionId = getCookie(c, ADMIN_SESSION_COOKIE);
  if (!sessionId) {
    return null;
  }
  const sessionRaw = await c.env.KV.get(`admin_session:${sessionId}`);
  if (!sessionRaw) {
    return null;
  }
  return JSON.parse(sessionRaw) as AdminSession;
};

admin.post('/session', async (c) => {
  const claims = await verifyAccessWithClaims(c.req.raw, c.env);
  if (!claims) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const ttlSeconds = getSessionTtlSeconds(c.env);
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  const session: AdminSession = {
    id: sessionId,
    email: (claims as AccessTokenPayload).email,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  await c.env.KV.put(`admin_session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: ttlSeconds
  });

  setSessionCookie(c, session);
  return c.json({ sessionId, expiresAt: session.expiresAt, email: session.email, ttlSeconds });
});

admin.get('/session', async (c) => {
  const session = await readSession(c);
  if (!session) {
    return c.json({ authenticated: false }, 401);
  }
  return c.json({ authenticated: true, session });
});

admin.delete('/session', async (c) => {
  const sessionId = getCookie(c, ADMIN_SESSION_COOKIE);
  if (sessionId) {
    await c.env.KV.delete(`admin_session:${sessionId}`);
  }
  deleteCookie(c, ADMIN_SESSION_COOKIE, { path: '/' });
  return c.json({ success: true });
});

admin.use('/*', async (c, next) => {
  if (c.req.path === '/admin/session') {
    await next();
    return;
  }
  const session = await readSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

admin.get('/content', async (c) => {
  await ensureAdminSchema(c.env.DB);
  const pages = await c.env.DB.prepare(
    'SELECT * FROM admin_content_pages ORDER BY updated_at DESC LIMIT 100'
  ).all();
  return c.json({ items: pages.results ?? [] });
});

admin.get('/content/:id', async (c) => {
  await ensureAdminSchema(c.env.DB);
  const page = await c.env.DB.prepare('SELECT * FROM admin_content_pages WHERE id = ?')
    .bind(c.req.param('id'))
    .first();
  if (!page) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json({ item: page });
});

admin.post('/content', async (c) => {
  await ensureAdminSchema(c.env.DB);
  const payload = await c.req.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const status = payload.status ?? 'draft';
  await c.env.DB.prepare(
    `INSERT INTO admin_content_pages (id, slug, title, status, body, metadata, created_at, updated_at, author)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      payload.slug,
      payload.title,
      status,
      payload.body ?? '',
      JSON.stringify(payload.metadata ?? {}),
      now,
      now,
      payload.author ?? null
    )
    .run();
  return c.json({ id, status });
});

admin.put('/content/:id', async (c) => {
  await ensureAdminSchema(c.env.DB);
  const payload = await c.req.json();
  const now = new Date().toISOString();
  const result = await c.env.DB.prepare(
    `UPDATE admin_content_pages
      SET slug = ?, title = ?, status = ?, body = ?, metadata = ?, updated_at = ?, author = ?
      WHERE id = ?`
  )
    .bind(
      payload.slug,
      payload.title,
      payload.status ?? 'draft',
      payload.body ?? '',
      JSON.stringify(payload.metadata ?? {}),
      now,
      payload.author ?? null,
      c.req.param('id')
    )
    .run();

  if (result.changes === 0) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json({ id: c.req.param('id'), updatedAt: now });
});

admin.get('/media', async (c) => {
  await ensureAdminSchema(c.env.DB);
  const assets = await c.env.DB.prepare(
    'SELECT * FROM admin_media_assets ORDER BY created_at DESC LIMIT 100'
  ).all();
  return c.json({ items: assets.results ?? [] });
});

admin.get('/media/:id', async (c) => {
  await ensureAdminSchema(c.env.DB);
  const asset = await c.env.DB.prepare('SELECT * FROM admin_media_assets WHERE id = ?')
    .bind(c.req.param('id'))
    .first();
  if (!asset) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json({ item: asset });
});

admin.post('/media', async (c) => {
  await ensureAdminSchema(c.env.DB);
  const contentType = c.req.header('content-type') ?? '';
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return c.json({ error: 'Missing file' }, 400);
    }

    const key = `admin/uploads/${id}-${file.name}`;
    await c.env.ASSETS.put(key, file, {
      httpMetadata: { contentType: file.type }
    });

    const altText = formData.get('altText')?.toString() ?? null;
    const tags = formData.get('tags')?.toString() ?? null;
    const uploadedBy = formData.get('uploadedBy')?.toString() ?? null;

    await c.env.DB.prepare(
      `INSERT INTO admin_media_assets (id, file_name, content_type, size, r2_key, alt_text, tags, created_at, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        file.name,
        file.type,
        file.size,
        key,
        altText,
        tags,
        now,
        uploadedBy
      )
      .run();

    return c.json({ id, key, fileName: file.name, contentType: file.type, size: file.size });
  }

  const payload = await c.req.json();
  await c.env.DB.prepare(
    `INSERT INTO admin_media_assets (id, file_name, content_type, size, r2_key, alt_text, tags, created_at, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      payload.fileName ?? null,
      payload.contentType ?? null,
      payload.size ?? null,
      payload.r2Key ?? null,
      payload.altText ?? null,
      payload.tags ?? null,
      now,
      payload.uploadedBy ?? null
    )
    .run();
  return c.json({ id, metadataOnly: true });
});

admin.get('/forms', async (c) => {
  await ensureAdminSchema(c.env.DB);
  const forms = await c.env.DB.prepare(
    'SELECT * FROM admin_form_definitions ORDER BY updated_at DESC LIMIT 100'
  ).all();
  return c.json({ items: forms.results ?? [] });
});

admin.get('/forms/:id', async (c) => {
  await ensureAdminSchema(c.env.DB);
  const form = await c.env.DB.prepare('SELECT * FROM admin_form_definitions WHERE id = ?')
    .bind(c.req.param('id'))
    .first();
  if (!form) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json({ item: form });
});

admin.post('/forms', async (c) => {
  await ensureAdminSchema(c.env.DB);
  const payload = await c.req.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO admin_form_definitions (id, name, slug, description, fields, settings, status, created_at, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      payload.name,
      payload.slug,
      payload.description ?? null,
      JSON.stringify(payload.fields ?? []),
      JSON.stringify(payload.settings ?? {}),
      payload.status ?? 'draft',
      now,
      now,
      payload.updatedBy ?? null
    )
    .run();

  return c.json({ id });
});

admin.put('/forms/:id', async (c) => {
  await ensureAdminSchema(c.env.DB);
  const payload = await c.req.json();
  const now = new Date().toISOString();
  const result = await c.env.DB.prepare(
    `UPDATE admin_form_definitions
     SET name = ?, slug = ?, description = ?, fields = ?, settings = ?, status = ?, updated_at = ?, updated_by = ?
     WHERE id = ?`
  )
    .bind(
      payload.name,
      payload.slug,
      payload.description ?? null,
      JSON.stringify(payload.fields ?? []),
      JSON.stringify(payload.settings ?? {}),
      payload.status ?? 'draft',
      now,
      payload.updatedBy ?? null,
      c.req.param('id')
    )
    .run();

  if (result.changes === 0) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json({ id: c.req.param('id'), updatedAt: now });
import { Hono, type Context, type Next } from "hono";
import {
  ADMIN_ROLES,
  buildAdminSession,
  hasAdminPermission,
  type AccessTokenPayload,
  type AdminPermission,
  type AdminRole
} from "@goldshore/auth";

type Env = {
  KV: KVNamespace;
};

type AdminUserRecord = {
  id: string;
  email: string;
  role: AdminRole;
  status: "active" | "invited" | "disabled";
  createdAt: string;
  updatedAt: string;
};

type AuditEvent = {
  action: string;
  actor?: string;
  status: "success" | "denied" | "error";
  metadata?: Record<string, unknown>;
  timestamp: string;
};

const admin = new Hono<{
  Bindings: Env;
  Variables: {
    accessClaims: AccessTokenPayload | null;
  };
}>();

type AdminContext = Context<{
  Bindings: Env;
  Variables: {
    accessClaims: AccessTokenPayload | null;
  };
}>;

const getActor = (claims: AccessTokenPayload | null, request: Request) =>
  claims?.email ||
  request.headers.get("CF-Access-Authenticated-User-Email") ||
  request.headers.get("CF-Access-Authenticated-User-Id") ||
  "unknown";

const logAdminAction = async (env: Env, entry: Omit<AuditEvent, "timestamp">) => {
  const timestamp = new Date().toISOString();
  const key = `audit:admin:${timestamp}:${crypto.randomUUID()}`;
  const payload: AuditEvent = { ...entry, timestamp };
  await env.KV.put(key, JSON.stringify(payload));
  return payload;
};

const requirePermission =
  (permission: AdminPermission) =>
  async (c: AdminContext, next: Next) => {
    const session = buildAdminSession(c.get("accessClaims"));
    if (!hasAdminPermission(session.permissions, permission)) {
      await logAdminAction(c.env, {
        action: "admin.access.denied",
        actor: getActor(c.get("accessClaims"), c.req.raw),
        status: "denied",
        metadata: { permission }
      });
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };

const listUsers = async (env: Env) => {
  const { keys } = await env.KV.list({ prefix: "admin:user:" });
  const records = await Promise.all(
    keys.map(async (key) => env.KV.get<AdminUserRecord>(key.name, "json"))
  );
  return records.filter(Boolean) as AdminUserRecord[];
};

const saveUser = async (env: Env, user: AdminUserRecord) => {
  await env.KV.put(`admin:user:${user.id}`, JSON.stringify(user));
  return user;
};

admin.get("/users", requirePermission("users:read"), async (c) => {
  const actor = getActor(c.get("accessClaims"), c.req.raw);
  const users = await listUsers(c.env);
  await logAdminAction(c.env, {
    action: "admin.users.list",
    actor,
    status: "success",
    metadata: { count: users.length }
  });
  return c.json(users);
});

admin.post("/users", requirePermission("users:manage"), async (c) => {
  const actor = getActor(c.get("accessClaims"), c.req.raw);
  const payload = await c.req.json<{ email?: string; role?: AdminRole }>();
  if (!payload.email || !payload.role) {
    await logAdminAction(c.env, {
      action: "admin.users.invite",
      actor,
      status: "error",
      metadata: { reason: "missing-fields" }
    });
    return c.json({ error: "Email and role are required." }, 400);
  }
  if (!ADMIN_ROLES.includes(payload.role)) {
    await logAdminAction(c.env, {
      action: "admin.users.invite",
      actor,
      status: "error",
      metadata: { reason: "invalid-role" }
    });
    return c.json({ error: "Role must be admin, editor, or viewer." }, 400);
  }

  const now = new Date().toISOString();
  const user: AdminUserRecord = {
    id: crypto.randomUUID(),
    email: payload.email,
    role: payload.role,
    status: "invited",
    createdAt: now,
    updatedAt: now
  };
  await saveUser(c.env, user);
  await logAdminAction(c.env, {
    action: "admin.users.invite",
    actor,
    status: "success",
    metadata: { userId: user.id, role: user.role }
  });
  return c.json(user, 201);
});

admin.patch("/users/:id", requirePermission("users:manage"), async (c) => {
  const actor = getActor(c.get("accessClaims"), c.req.raw);
  const { id } = c.req.param();
  const existing = await c.env.KV.get<AdminUserRecord>(`admin:user:${id}`, "json");
  if (!existing) {
    await logAdminAction(c.env, {
      action: "admin.users.update",
      actor,
      status: "error",
      metadata: { userId: id, reason: "not-found" }
    });
    return c.json({ error: "User not found." }, 404);
  }

  const payload = await c.req.json<Partial<Pick<AdminUserRecord, "role" | "status">>>();
  if (payload.role && !ADMIN_ROLES.includes(payload.role)) {
    await logAdminAction(c.env, {
      action: "admin.users.update",
      actor,
      status: "error",
      metadata: { userId: id, reason: "invalid-role" }
    });
    return c.json({ error: "Invalid role." }, 400);
  }
  const updated: AdminUserRecord = {
    ...existing,
    role: payload.role ?? existing.role,
    status: payload.status ?? existing.status,
    updatedAt: new Date().toISOString()
  };
  await saveUser(c.env, updated);
  await logAdminAction(c.env, {
    action: "admin.users.update",
    actor,
    status: "success",
    metadata: { userId: id, role: updated.role, status: updated.status }
  });
  return c.json(updated);
});

admin.get("/audit", requirePermission("audit:read"), async (c) => {
  const actor = getActor(c.get("accessClaims"), c.req.raw);
  const { keys } = await c.env.KV.list({ prefix: "audit:admin:" });
  const entries = await Promise.all(
    keys.map(async (key) => c.env.KV.get<AuditEvent>(key.name, "json"))
  );
  const logs = entries
    .filter(Boolean)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 50);

  await logAdminAction(c.env, {
    action: "admin.audit.list",
    actor,
    status: "success",
    metadata: { count: logs.length }
  });

  return c.json(logs);
});

export default admin;
