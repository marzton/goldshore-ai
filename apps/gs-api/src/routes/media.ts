import { Hono } from 'hono';
import { Env, Variables } from '../types';

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

const allowedTags = new Set([
  'svg', 'g', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline',
  'ellipse', 'defs', 'clipPath', 'use', 'title', 'desc'
]);

const allowedAttrs = new Set([
  'xmlns', 'viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width',
  'stroke-linecap', 'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'x', 'y',
  'x1', 'y1', 'x2', 'y2', 'points', 'id', 'class', 'transform', 'opacity'
]);

function sanitizeSvg(svg: string): string {
  const tagRegex = /<\/?([a-zA-Z0-9-]+)([^>]*)>/g;
  const attrRegex = /([a-zA-Z0-9-]+)="([^"]*)"/g;

  return svg.replace(tagRegex, (match, tag, attrs) => {
    if (!allowedTags.has(tag)) return '';

    let cleanAttrs = '';
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attr = attrMatch[1];
      const value = attrMatch[2];

      if (value.trim().toLowerCase().startsWith('javascript:')) continue;

      if (allowedAttrs.has(attr)) {
        cleanAttrs += ` ${attr}="${value}"`;
      }
    }

    return `<${match.startsWith('</') ? '/' : ''}${tag}${cleanAttrs}>`;
  });
}

const media = new Hono<{ Bindings: Env; Variables: Variables }>();

media.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT id, filename, url, size, type, created_at FROM media_assets ORDER BY created_at DESC LIMIT 100')
    .all<MediaRecord>();
  return c.json({ items: results ?? [] });
});

media.get('/:id', async (c) => {
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
  headers.set('Content-Security-Policy', "default-src 'none'; object-src 'none'; script-src 'none'; sandbox");

  return new Response(object.body, { headers });
});

media.post('/upload', async (c) => {
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
  const objectKey = `media/${id}/${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  await c.env.ASSETS.put(objectKey, body, { httpMetadata: { contentType } });

  const url = new URL(c.req.url);
  url.pathname = `/media/${id}`;

  const createdAt = new Date().toISOString();
  await c.env.DB.prepare(
      'INSERT INTO media_assets (id, filename, url, size, type, object_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *'
    )
    .bind(id, filename, url.toString(), size, contentType, objectKey, createdAt)
    .run();

  return c.json({ id, filename, url: url.toString(), size, type: contentType, created_at: createdAt });
});

export default media;
