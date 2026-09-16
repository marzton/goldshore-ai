import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import events from './events';

const workerSource = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');

const validBody = {
  event_id: 'evt_test_1',
  event: 'purchase',
  occurred_at: new Date().toISOString(),
  property: { domain: 'goldshore.ai' },
  session: { anonymous_id: 'anon_1' },
  consent: { analytics: true, advertising: false, personalization: false },
  commerce: { currency: 'USD', value: 19.99, order_id: 'order_1' },
};

function makeEnv(overrides: { insertedRows?: any[] } = {}) {
  const insertedRows: any[] = overrides.insertedRows ?? [];
  return {
    PLATFORM_DB: {
      prepare: (sql: string) => ({
        bind: (...args: any[]) => ({
          first: async () => (sql.includes('SELECT id FROM properties') ? null : undefined),
          run: async () => {
            insertedRows.push({ sql, args });
            return { success: true };
          },
        }),
      }),
    },
  };
}

test('the Worker mounts /v1/events as a public POST path (CORS-gated, not Access-gated)', () => {
  assert.ok(workerSource.includes("v1.route('/events', events);"));
  assert.ok(workerSource.includes("path === '/v1/events'"));
});

test('rejects a payload missing required fields', async () => {
  const response = await events.request('/', {
    method: 'POST',
    body: JSON.stringify({ event: 'purchase' }),
    headers: { 'content-type': 'application/json' },
  }, makeEnv());
  assert.equal(response.status, 400);
});

test('rejects a malformed event name', async () => {
  const response = await events.request('/', {
    method: 'POST',
    body: JSON.stringify({ ...validBody, event: 'Not Valid!' }),
    headers: { 'content-type': 'application/json' },
  }, makeEnv());
  assert.equal(response.status, 400);
});

test('accepts a well-formed GSEvent and records consent flags', async () => {
  const insertedRows: any[] = [];
  const response = await events.request('/', {
    method: 'POST',
    body: JSON.stringify(validBody),
    headers: { 'content-type': 'application/json' },
  }, makeEnv({ insertedRows }));
  assert.equal(response.status, 202);
  const body = await response.json();
  assert.equal(body.event_id, 'evt_test_1');
  const insert = insertedRows.find((row) => row.sql.includes('INSERT INTO gs_events'));
  assert.ok(insert, 'expected an INSERT INTO gs_events');
  // consent_analytics, consent_advertising, consent_personalization are the
  // last three bound values before ip hash / user agent.
  const [, , , , , , , , , , , , , , , , , consentAnalytics, consentAdvertising, consentPersonalization] = insert.args;
  assert.equal(consentAnalytics, 1);
  assert.equal(consentAdvertising, 0);
  assert.equal(consentPersonalization, 0);
});
