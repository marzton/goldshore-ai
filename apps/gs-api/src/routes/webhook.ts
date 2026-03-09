import { Hono } from 'hono';
import { Env, Variables } from '../types';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.post('/github', async (c) => {
  const sig = c.req.header('X-Hub-Signature-256');
  if (!sig) return c.json({ error: 'Missing signature' }, 401);

  const body = await c.req.text();
  const secret = c.env.GH_WEBHOOK_SECRET;
  if (!secret) return c.json({ error: 'Webhook secret not configured' }, 500);

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify', 'sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const hexSignature = 'sha256=' + Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison to prevent timing attacks
  let mismatch = sig.length === hexSignature.length ? 0 : 1;
  const len = Math.min(sig.length, hexSignature.length);
  for (let i = 0; i < len; i++) {
    mismatch |= sig.charCodeAt(i) ^ hexSignature.charCodeAt(i);
  }

  if (mismatch !== 0) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // Handle GitHub App webhook events
  return c.json({ received: true });
});

export default app;
