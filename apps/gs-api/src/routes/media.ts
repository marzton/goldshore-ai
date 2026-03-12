import { Hono } from 'hono';
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

const sanitizeSvg = (rawSvg: string) => {
  const sanitizedContent = sanitizeHtml(rawSvg, {
    allowedTags: [
      'svg',
      'g',
      'path',
      'rect',
      'circle',
      'ellipse',
      'line',
      'polyline',
      'polygon',
      'text',
      'tspan',
      'defs',
      'clipPath',
      'mask',
      'pattern',
      'linearGradient',
      'radialGradient',
      'stop',
      'title',
      'desc',
      'use'
    ],
    allowedAttributes: {
      svg: ['width', 'height', 'viewBox', 'xmlns', 'fill', 'stroke'],
      g: ['transform', 'fill', 'stroke'],
      path: ['d', 'fill', 'stroke', 'stroke-width', 'transform'],
      rect: ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke', 'stroke-width', 'transform'],
      circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width', 'transform'],
      ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width', 'transform'],
      line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'transform'],
      polyline: ['points', 'fill', 'stroke', 'stroke-width', 'transform'],
      polygon: ['points', 'fill', 'stroke', 'stroke-width', 'transform'],
      text: ['x', 'y', 'dx', 'dy', 'text-anchor', 'font-family', 'font-size', 'fill', 'transform'],
      tspan: ['x', 'y', 'dx', 'dy', 'text-anchor', 'font-family', 'font-size', 'fill', 'transform'],
      clipPath: ['id'],
      mask: ['id'],
      pattern: ['id', 'patternUnits', 'width', 'height', 'x', 'y'],
      linearGradient: ['id', 'x1', 'y1', 'x2', 'y2', 'gradientUnits'],
      radialGradient: ['id', 'cx', 'cy', 'r', 'fx', 'fy', 'gradientUnits'],
      stop: ['offset', 'stop-color', 'stop-opacity'],
      use: ['href', 'x', 'y', 'width', 'height']
    },
    allowedSchemes: ['http', 'https', 'data'],
    allowedSchemesByTag: {
      use: ['http', 'https', 'data']
    },
    // Disallow all event handler attributes and script/foreignObject tags implicitly
    allowedSchemesAppliedToAttributes: ['href', 'xlink:href']
  });

  let wrapped = sanitizedContent;
  if (!wrapped.trim().startsWith('<svg')) {
    wrapped = `<svg xmlns="http://www.w3.org/2000/svg">${wrapped}</svg>`;
  }

  return wrapped;
};

const media = new Hono<{ Bindings: { DB: D1Database; ASSETS: R2Bucket } }>();

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

  if (!result) {
    return c.json({ error: 'Media not found' }, 404);
  }

  const object = await c.env.ASSETS.get(result.object_key);
  if (!object) {
    return c.json({ error: 'Asset missing from storage' }, 404);
  }

  const headers = new Headers();
  headers.set('Content-Type', result.type || object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  // Sentinel: Mitigate SVG XSS risks by disabling scripts
  headers.set('Content-Security-Policy', "default-src 'none'; script-src 'none'; object-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; sandbox");

  return new Response(object.body, { headers });
});

media.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return c.json({ error: 'Missing file upload' }, 400);
  }

  const filename = file.name || 'upload';
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  const contentType = ALLOWED_MIME_TYPES.get(extension);

  if (!contentType) {
    return c.json({ error: 'Unsupported file type' }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: 'File too large' }, 413);
  }

  let body: ArrayBuffer | Uint8Array;
  let size = file.size;

  if (contentType === 'image/svg+xml') {
    const rawSvg = await file.text();
    const sanitizedSvg = sanitizeSvg(rawSvg);
    const encoded = new TextEncoder().encode(sanitizedSvg);
    body = encoded;
    size = encoded.byteLength;
  } else {
    body = await file.arrayBuffer();
  }

  const id = crypto.randomUUID();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectKey = `media/${id}/${safeName}`;

  await c.env.ASSETS.put(objectKey, body, {
    httpMetadata: {
      contentType
    }
  });

  const url = new URL(c.req.url);
  url.pathname = `/media/${id}`;

  const createdAt = new Date().toISOString();
  await c.env.DB
    .prepare(
      'INSERT INTO media_assets (id, filename, url, size, type, object_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, filename, url.toString(), size, contentType, objectKey, createdAt)
    .run();

  return c.json({
    id,
    filename,
    url: url.toString(),
    size,
    type: contentType,
    created_at: createdAt
  });
});

export default media;
