import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Hono } from 'hono';
import internal from './internal.ts';

describe('internal inbox status', () => {
  it('returns inbox summary and service status', async () => {
    const app = new Hono();
    app.route('/internal', internal);

    const kv = {
      get: async (key: string) => {
        if (key === 'EMAIL_INBOX_LOGS') {
          return JSON.stringify([
            { id: '1', from: 'a@example.com', to: 'mail@goldshore.ai', subject: 'Hello', timestamp: '2026-03-03T00:00:00.000Z' },
            { id: '2', from: 'b@example.com', to: 'mail@goldshore.ai', subject: 'World', timestamp: '2026-03-03T01:00:00.000Z' },
          ]);
        }
        if (key === 'SERVICE_STATUS') {
          return JSON.stringify({ maintenance_mode: false, active_services: ['gateway', 'api'] });
        }
        return null;
      },
    };

    const res = await app.request('/internal/inbox-status', {}, { KV: kv } as any);
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.inbox.count, 2);
    assert.strictEqual(data.inbox.recent.length, 2);
    assert.deepStrictEqual(data.services.active_services, ['gateway', 'api']);
  });
});
