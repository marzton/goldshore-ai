import { Hono } from 'hono';

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

const ALLOWED_TAGS = new Set([
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'defs', 'linearGradient', 'radialGradient', 'stop', 'mask',
  'clipPath', 'use', 'symbol', 'image', 'style', 'view', 'desc', 'title', 'metadata',
  'a'
]);

const ALLOWED_ATTRS = new Set([
  'version', 'xmlns', 'x', 'y', 'width', 'height', 'viewBox', 'preserveAspectRatio',
  'd', 'fill', 'stroke', 'stroke-width', 'opacity', 'transform', 'points', 'r',
  'cx', 'cy', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'font-family', 'font-size',
  'text-anchor', 'class', 'id', 'stop-color', 'stop-opacity', 'offset',
  'gradientUnits', 'gradientTransform', 'spreadMethod', 'href', 'xlink:href',
  'style', 'fill-opacity', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin',
  'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'visibility'
]);

const ATTR_REGEX = /([a-zA-Z0-9:-]+)\s*=\s*(?:"([^"]*)"|'[^']*'|([^>\s]+))/g;

const sanitizeSvg = (rawSvg: string) => {
  // Robust allow-list based sanitization that preserves SVG case sensitivity.
  // This uses a tokenizer-based approach to reconstruct the SVG keeping only safe tags and attributes.
  const sanitized = rawSvg.replace(/<([^>]+)>/g, (match, tagContent) => {
    const isClosing = tagContent.startsWith('/');
    if (isClosing) {
      const tagName = tagContent.slice(1).split(/\s/)[0];
      return ALLOWED_TAGS.has(tagName) ? `</${tagName}>` : '';
    }

    const isSelfClosing = tagContent.endsWith('/');
    const cleanContent = isSelfClosing ? tagContent.slice(0, -1) : tagContent;

    const parts = cleanContent.trim().split(/\s+/);
    const tagName = parts[0];
    if (!ALLOWED_TAGS.has(tagName)) return '';

    let sanitizedTag = `<${tagName}`;
    const attrString = cleanContent.slice(cleanContent.indexOf(tagName) + tagName.length);
    let attrMatch;

    // Reset lastIndex because regex is global and reused
    ATTR_REGEX.lastIndex = 0;

    while ((attrMatch = ATTR_REGEX.exec(attrString)) !== null) {
      const name = attrMatch[1];
      const value = attrMatch[2] || attrMatch[3] || attrMatch[4];

      if (ALLOWED_ATTRS.has(name)) {
        // Block javascript: URIs in href and xlink:href
        if ((name === 'href' || name === 'xlink:href') && value.toLowerCase().trim().startsWith('javascript:')) {
          continue;
        }
        sanitizedTag += ` ${name}="${value}"`;
      }
    }

    return sanitizedTag + (isSelfClosing ? ' />' : '>');
  });

  if (!sanitized.trim().startsWith('<svg')) {
    return `<svg xmlns="http://www.w3.org/2000/svg">${sanitized}</svg>`;
  }

  return sanitized;
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
