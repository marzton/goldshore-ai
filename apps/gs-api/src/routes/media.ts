import { Hono } from 'hono';
import { Env, Variables } from '../types';
import sanitizeHtml from 'sanitize-html';

type MediaRecord = {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
};

const ALLOWED_MIME_TYPES = new Map([
  ['svg', 'image/svg+xml'],
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg']
]);

// 5MB limit to prevent DoS via large file uploads
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * [SOP] Media Asset Management
 * Handles R2 storage for images and SVGs with strict sanitization for vector assets.
 */

const media = new Hono<{ Bindings: Env; Variables: Variables }>();

media.get('/', async (c) => {
  // Require admin authentication to list media assets
  const adminKey = c.req.header('x-admin-key');
  if (!adminKey || adminKey !== c.env.ADMIN_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { results } = await c.env.DB
    .prepare('SELECT id, filename, url, size, type, created_at FROM media_assets ORDER BY created_at DESC LIMIT 100')
    .all<MediaRecord>();
  return c.json({ items: results ?? [] });
});

media.get('/:id', async (c) => {
  // Basic authentication guard: require a valid Authorization header before serving media assets.
  const authHeader = c.req.header('Authorization');
  if (!authHeader || authHeader !== `Bearer ${c.env.MEDIA_ACCESS_TOKEN}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const result = await c.env.DB
    .prepare('SELECT object_key, type FROM media_assets WHERE id = ?')
    .bind(id)
    .first<{ object_key: string; type: string }>();

  if (!result) return c.json({ error: 'Media not found' }, 404);

  const object = await c.env.ASSETS.get(result.object_key);
  if (!object) return c.json({ error: 'Asset missing from storage' }, 404);

  const headers = new Headers();
  headers.set('Content-Type', result.type || object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  
  // Sentinel: Enforce strict CSP to mitigate SVG XSS
  headers.set('Content-Security-Policy', "default-src 'none'; script-src 'none'; object-src 'none'; sandbox");

  return new Response(object.body, { headers });
});

media.post('/upload', async (c) => {
  // Simple authentication: require a valid bearer token before allowing uploads
  const authHeader = c.req.header('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token || !c.env.API_TOKEN || token !== c.env.API_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) return c.json({ error: 'Missing file upload' }, 400);
  if (file.size > MAX_FILE_SIZE) return c.json({ error: 'File too large' }, 413);

  const filename = file.name || 'upload';
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  const contentType = ALLOWED_MIME_TYPES.get(extension);

  if (!contentType) return c.json({ error: 'Unsupported file type' }, 400);

  let body: ArrayBuffer | Uint8Array;
  let size = file.size;

  if (contentType === 'image/svg+xml') {
    const sanitizedSvg = sanitizeSvg(await file.text());
    const encoded = new TextEncoder().encode(sanitizedSvg);
    body = encoded;
    size = encoded.byteLength;
  } else {
    body = await file.arrayBuffer();
  }

  const id = crypto.randomUUID();
  const objectKey = `media/${id}/file.${extension}`;

  await c.env.ASSETS.put(objectKey, body, { httpMetadata: { contentType } });

  const url = new URL(c.req.url);
  url.pathname = `/media/${id}`;

  const createdAt = new Date().toISOString();
  await c.env.DB.prepare(
      'INSERT INTO media_assets (id, filename, url, size, type, object_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, filename, url.toString(), size, contentType, objectKey, createdAt)
    .run();

  return c.json({ id, filename, url: url.toString(), size, type: contentType, created_at: createdAt });
});

export default media;
