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
describe('internal inbox status', () => {
  it('returns inbox summary and service status', async () => {
    const app = new Hono();
    app.route('/internal', internal);

    const kv = {
      get: async (key: string, type?: string) => {
        if (key === 'EMAIL_INBOX_LOGS') {
          return [
            { id: '11111111-1111-4111-8111-111111111111', from: 'a@example.com', to: 'mail@goldshore.ai', subject: 'Hello', timestamp: '2026-03-03T00:00:00.000Z' },
            { id: '22222222-2222-4222-8222-222222222222', from: 'b@example.com', to: 'mail@goldshore.ai', subject: 'World', timestamp: '2026-03-03T01:00:00.000Z' },
          ];
        }
        if (key === 'SERVICE_STATUS') {
          return { maintenance_mode: false, active_services: ['gateway', 'api'], version: '2026.03.04' };
        }
        return null;
      },
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
    const data = await res.json() as any;
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.inbox.count, 2);
    assert.strictEqual(data.inbox.recent.length, 2);
    assert.deepStrictEqual(data.services.active_services, ['gateway', 'api']);
  });

  it('returns dns sync telemetry and MASTER_CONFIG report fields', async () => {
    const app = new Hono();
    app.route('/internal', internal);

    const run = {
      runId: 'run-1',
      actor: 'cron:scheduled',
      startedAt: '2026-03-04T00:00:00.000Z',
      endedAt: '2026-03-04T00:00:15.000Z',
      success: false,
      driftStatus: 'drifted',
      results: [
        {
          hostname: 'api.goldshore.ai',
          checkUrl: 'https://api.goldshore.ai/health',
          startedAt: '2026-03-04T00:00:00.000Z',
          endedAt: '2026-03-04T00:00:05.000Z',
          statusCode: 500,
          success: false,
          driftStatus: 'drifted',
          driftNotes: ['Health check failed with HTTP 500.'],
        },
      ],
    };

    const controlLogs = {
      get: async (key: string) => {
        if (key === 'dns_sync_runs_index') return ['dns_sync_run:2026-03-04T00:00:00.000Z:run-1'];
        if (key === 'dns_sync_run:2026-03-04T00:00:00.000Z:run-1') return run;
        return null;
      },
    };

    const kv = {
      get: async (key: string) => {
        if (key === 'SERVICE_STATUS') {
          return { maintenance_mode: false, active_services: ['gateway', 'api'], version: '2026.03.04', last_sync: '2026-03-03T23:00:00.000Z' };
        }
        return null;
      },
    };

    const res = await app.request('/internal/dns-sync-status', {}, { KV: kv, CONTROL_LOGS: controlLogs } as any);
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.masterConfigReport.syncSource, 'durable');
    assert.strictEqual(data.masterConfigReport.driftStatusComputed, 'drifted');
    assert.strictEqual(data.masterConfigReport.lastSyncTimestampVerified, '2026-03-04T00:00:15.000Z');
    assert.strictEqual(data.latestRun.results[0].hostname, 'api.goldshore.ai');
  });
});
