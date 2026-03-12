import assert from 'node:assert';
import { describe, it } from 'node:test';
import { verifySignature } from './auth';

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const signPath = async (path: string, secret: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(path));
  return hex(signature);
};

describe('verifySignature', () => {
  it('returns true for valid HMAC signatures', async () => {
    const secret = 'super-secret-key';
    const path = '/internal/inbox-status';
    const signature = await signPath(path, secret);

    const request = new Request(`https://api.goldshore.ai${path}`, {
      headers: { 'X-Proxy-Signature': signature },
    });

    assert.strictEqual(await verifySignature(request, secret), true);
  });

  it('returns false for invalid signatures', async () => {
    const request = new Request('https://api.goldshore.ai/internal/inbox-status', {
      headers: { 'X-Proxy-Signature': 'deadbeef' },
    });

    assert.strictEqual(await verifySignature(request, 'super-secret-key'), false);
  });

  it('returns false when signature header is missing', async () => {
    const request = new Request('https://api.goldshore.ai/internal/inbox-status');
    assert.strictEqual(await verifySignature(request, 'super-secret-key'), false);
  });
});
