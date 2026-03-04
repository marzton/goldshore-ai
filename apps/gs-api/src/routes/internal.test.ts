import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Hono } from 'hono';
import internal from './internal.ts';

describe('internal inbox status', () => {
  it('returns inbox summary and service status', async () => {
    const app = new Hono();
    app.route('/internal', internal);

    const kv = {
      get: async (key: string, type?: string) => {
        if (key === 'EMAIL_INBOX_LOGS') {
          if (type === 'json') {
            return [
            { id: '11111111-1111-4111-8111-111111111111', from: 'a@example.com', to: 'mail@goldshore.ai', subject: 'Hello', timestamp: '2026-03-03T00:00:00.000Z' },
            { id: '22222222-2222-4222-8222-222222222222', from: 'b@example.com', to: 'mail@goldshore.ai', subject: 'World', timestamp: '2026-03-03T01:00:00.000Z' },
          ];
          }
        }
        if (key === 'SERVICE_STATUS') {
          if (type === 'json') {
            return { maintenance_mode: false, active_services: ['gateway', 'api'], version: '2026-03-03' };
          }
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

  it('stores and returns sync run summaries', async () => {
    const app = new Hono();
    app.route('/internal', internal);

    let inserted: any[] = [];

    const db = {
      prepare: (query: string) => {
        if (query.includes('INSERT INTO sync_runs')) {
          return {
            bind: (...values: unknown[]) => ({
              run: async () => {
                inserted = values as any[];
                return { success: true };
              },
            }),
          };
        }

        return {
          all: async () => ({
            results: [
              {
                subdomain: 'api.goldshore.ai',
                last_successful_sync: '2026-03-03T01:00:00.000Z',
                last_error_at: '2026-03-03T00:00:00.000Z',
                last_error: '{"checks":[{"ok":false}]}',
              },
            ],
          }),
        };
      },
    };

    const createRes = await app.request('/internal/sync-runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        subdomain: 'api.goldshore.ai',
        actor: 'gs-control:cron',
        started_at: '2026-03-03T00:00:00.000Z',
        completed_at: '2026-03-03T00:01:00.000Z',
        result: 'success',
        drift_summary: '{"checks":[]}',
      }),
    }, { DB: db } as any);

    assert.strictEqual(createRes.status, 200);
    assert.strictEqual(inserted[0], 'api.goldshore.ai');
    assert.strictEqual(inserted[4], 'success');

    const summaryRes = await app.request('/internal/sync-runs/summary', {}, { DB: db } as any);
    assert.strictEqual(summaryRes.status, 200);
    const summaryData = await summaryRes.json() as any;
    assert.strictEqual(summaryData.success, true);
    assert.strictEqual(summaryData.runs.length, 1);
    assert.strictEqual(summaryData.runs[0].subdomain, 'api.goldshore.ai');
  });
});
