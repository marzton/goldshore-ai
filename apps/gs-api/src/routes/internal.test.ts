import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Hono } from 'hono';
import internal from './internal.ts';

describe('Internal API', () => {
  it('GET /inbox-status returns inbox and service status from KV', async () => {
    const app = new Hono();
    app.route('/internal', internal);

    const logs = Array.from({ length: 7 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${`${index + 1}`.padStart(12, '0')}`,
      from: `sender${index}@goldshore.ai`,
      to: 'team@goldshore.ai',
      subject: `Test message ${index}`,
      timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString()
    }));

    const kv = {
      get: async (key: string) => {
        if (key === 'EMAIL_INBOX_LOGS') return logs;
        if (key === 'SERVICE_STATUS') {
          return {
            maintenance_mode: false,
            active_services: ['api', 'worker'],
            version: '2026.03.03'
          };
        }
        return null;
      }
    };

    const res = await app.request('/internal/inbox-status', {}, { KV: kv } as any);
    assert.strictEqual(res.status, 200);

    const data = await res.json() as Record<string, any>;
    assert.strictEqual(data.success, true);
    assert.strictEqual(typeof data.timestamp, 'string');
    assert.deepStrictEqual(data.services, {
      maintenance_mode: false,
      active_services: ['api', 'worker'],
      version: '2026.03.03'
    });
    assert.strictEqual(data.inbox.count, 7);
    assert.strictEqual(data.inbox.recent.length, 5);
    assert.deepStrictEqual(data.inbox.recent, logs.slice(0, 5));
  });

  it('falls back to safe defaults when KV values are malformed', async () => {
    const app = new Hono();
    app.route('/internal', internal);

    const kv = {
      get: async (key: string) => (key === 'SERVICE_STATUS' ? { bad: 'shape' } : { bad: 'logs' })
    };

    const res = await app.request('/internal/inbox-status', {}, { KV: kv } as any);
    assert.strictEqual(res.status, 200);

    const data = await res.json() as Record<string, any>;
    assert.strictEqual(data.success, true);
    assert.deepStrictEqual(data.services, {
      maintenance_mode: false,
      active_services: [],
      version: 'unknown'
    });
    assert.strictEqual(data.inbox.count, 0);
    assert.deepStrictEqual(data.inbox.recent, []);
  });

  it('returns stable HTTP 500 payload when KV access fails', async () => {
    const app = new Hono();
    app.route('/internal', internal);

    const kv = {
      get: async () => {
        throw new Error('KV unavailable');
      }
    };

    const res = await app.request('/internal/inbox-status', {}, { KV: kv } as any);
    assert.strictEqual(res.status, 500);

    const data = await res.json() as Record<string, any>;
    assert.deepStrictEqual(data.error, {
      code: 'INTERNAL_INBOX_STATUS_ERROR',
      message: 'Failed to retrieve internal inbox status'
    });
    assert.strictEqual(data.success, false);
    assert.strictEqual(typeof data.timestamp, 'string');
  });
});
