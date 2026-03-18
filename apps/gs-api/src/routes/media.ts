import { Hono } from 'hono';
import { requirePermission } from '../auth';
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

type UploadFileLike = {
  name: string;
  size: number;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

const ALLOWED_MIME_TYPES = new Map([
  ['svg', 'image/svg+xml'],
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

const DANGEROUS_SVG_PATTERNS = [
  /<\s*script/gi,
  /\son[a-z0-9_-]+\s*=/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
];

const stripDangerousSvgContent = (input: string): string =>
  DANGEROUS_SVG_PATTERNS.reduce(
    (value, pattern) => value.replace(pattern, ''),
    input,
  );

const sanitizeSvg = (input: string): string => {
  return sanitizeHtml(stripDangerousSvgContent(input), {
    // Allow common SVG container and shape elements; adjust if needed.
    allowedTags: [
      'svg',
      'g',
      'defs',
      'clipPath',
      'mask',
      'pattern',
      'linearGradient',
      'radialGradient',
      'stop',
      'path',
      'rect',
      'circle',
      'ellipse',
      'line',
      'polyline',
      'polygon',
      'text',
      'tspan',
      'textPath',
      'image',
      'use',
    ],
    // Explicitly control which attributes are allowed on which tags.
    allowedAttributes: {
      svg: ['width', 'height', 'viewBox', 'xmlns', 'fill', 'stroke'],
      g: ['transform', 'fill', 'stroke'],
      path: ['d', 'fill', 'stroke', 'transform'],
      rect: [
        'x',
        'y',
        'width',
        'height',
        'rx',
        'ry',
        'fill',
        'stroke',
        'transform',
      ],
      circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'transform'],
      ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'transform'],
      line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'transform'],
      polyline: ['points', 'fill', 'stroke', 'transform'],
      polygon: ['points', 'fill', 'stroke', 'transform'],
      text: [
        'x',
        'y',
        'dx',
        'dy',
        'textLength',
        'lengthAdjust',
        'fill',
        'stroke',
        'transform',
      ],
      tspan: [
        'x',
        'y',
        'dx',
        'dy',
        'textLength',
        'lengthAdjust',
        'fill',
        'stroke',
        'transform',
      ],
      textPath: ['href', 'startOffset', 'method', 'spacing'],
      image: ['href', 'x', 'y', 'width', 'height', 'preserveAspectRatio'],
      use: ['href', 'x', 'y', 'width', 'height', 'transform'],
    },
    // Disallow javascript: and data:text/html schemes explicitly.
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: {
      image: ['http', 'https'],
      use: ['http', 'https'],
    },
    allowedSchemesAppliedToAttributes: ['href', 'xlink:href', 'src'],
    // By not listing any "on*" attributes in allowedAttributes, all event
    // handler attributes are stripped by sanitize-html.
  });
};

const isUploadFileLike = (value: unknown): value is UploadFileLike => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<UploadFileLike>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.size === 'number' &&
    typeof candidate.text === 'function' &&
    typeof candidate.arrayBuffer === 'function'
  );
};

/**
 * [SOP] Media Asset Management
 * Handles R2 storage for images and SVGs with strict sanitization for vector assets.
 */

const media = new Hono<{ Bindings: Env; Variables: Variables }>();

media.get('/', requirePermission('media:read'), async (c) => {
  const query = c.req.query();
  const rawLimit = query.limit;
  const rawOffset = query.offset;

  let limit = 100;
  let offset = 0;

  if (typeof rawLimit === 'string') {
    const parsed = parseInt(rawLimit, 10);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 500) {
      limit = parsed;
    }
  }

  if (typeof rawOffset === 'string') {
    const parsed = parseInt(rawOffset, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  const { results } = await c.env.DB.prepare(
    'SELECT id, filename, url, size, type, created_at FROM media_assets ORDER BY created_at DESC LIMIT ? OFFSET ?',
  )
    .bind(limit, offset)
    .all<MediaRecord>();

  return c.json({ items: results ?? [] });
});

media.get('/:id', requirePermission('media:read'), async (c) => {
  const id = c.req.param('id');
  const result = await c.env.DB.prepare(
    'SELECT object_key, type FROM media_assets WHERE id = ?',
  )
    .bind(id)
    .first<{ object_key: string; type: string }>();

  if (!result) return c.json({ error: 'Media not found' }, 404);

  const object = await c.env.ASSETS.get(result.object_key);
  if (!object) return c.json({ error: 'Asset missing from storage' }, 404);

  const headers = new Headers();
  headers.set(
    'Content-Type',
    result.type ||
      object.httpMetadata?.contentType ||
      'application/octet-stream',
  );
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  // Sentinel: Enforce strict CSP to mitigate SVG XSS
  headers.set(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'none'; object-src 'none'; sandbox",
  );

  return new Response(object.body, { headers });
});

media.post('/upload', requirePermission('media:write'), async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!isUploadFileLike(file))
    return c.json({ error: 'Missing file upload' }, 400);
  if (file.size > MAX_FILE_SIZE)
    return c.json({ error: 'File too large' }, 413);

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
  const objectKey = `media/${id}/${filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.+/g, '.')}`;

  await c.env.ASSETS.put(objectKey, body, { httpMetadata: { contentType } });

  const url = new URL(c.req.url);
  url.pathname = `/media/${id}`;

  const createdAt = new Date().toISOString();
  await c.env.DB.prepare(
    'INSERT INTO media_assets (id, filename, url, size, type, object_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(id, filename, url.toString(), size, contentType, objectKey, createdAt)
    .run();

  return c.json({
    id,
    filename,
    url: url.toString(),
    size,
    type: contentType,
    created_at: createdAt,
  });
});

export default media;
