import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Hono } from 'hono';
import webhook from './webhook.ts';

describe('Webhook API', () => {
  const secret = 'test-secret';
  const body = '{"test":true}';
  const validSignature = 'sha256=177890f5b12850be62804b4d7c768be4137279b9084803d5ef58474220b33038';

  it('POST /github with valid signature returns 200', async () => {
    const app = new Hono();
    app.route('/', webhook);

    const res = await app.request('/github', {
      method: 'POST',
      headers: {
        'X-Hub-Signature-256': validSignature,
        'Content-Type': 'application/json',
      },
      body: body,
    }, {
      GH_WEBHOOK_SECRET: secret
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json() as { received: boolean };
    assert.strictEqual(data.received, true);
  });

  it('POST /github with invalid signature (same length) returns 401', async () => {
    const app = new Hono();
    app.route('/', webhook);

    const invalidSignature = 'sha256=' + 'f'.repeat(64);
    const res = await app.request('/github', {
      method: 'POST',
      headers: {
        'X-Hub-Signature-256': invalidSignature,
        'Content-Type': 'application/json',
      },
      body: body,
    }, {
      GH_WEBHOOK_SECRET: secret
    });

    assert.strictEqual(res.status, 401);
    const data = await res.json() as { error: string };
    assert.strictEqual(data.error, 'Invalid signature');
  });

  it('POST /github with invalid signature (different length) returns 401', async () => {
    const app = new Hono();
    app.route('/', webhook);

    const invalidSignature = 'sha256=abc';
    const res = await app.request('/github', {
      method: 'POST',
      headers: {
        'X-Hub-Signature-256': invalidSignature,
        'Content-Type': 'application/json',
      },
      body: body,
    }, {
      GH_WEBHOOK_SECRET: secret
    });

    assert.strictEqual(res.status, 401);
    const data = await res.json() as { error: string };
    assert.strictEqual(data.error, 'Invalid signature');
  });

  it('POST /github missing signature returns 401', async () => {
    const app = new Hono();
    app.route('/', webhook);

    const res = await app.request('/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    }, {
      GH_WEBHOOK_SECRET: secret
    });

    assert.strictEqual(res.status, 401);
    const data = await res.json() as { error: string };
    assert.strictEqual(data.error, 'Missing signature');
  });
});
