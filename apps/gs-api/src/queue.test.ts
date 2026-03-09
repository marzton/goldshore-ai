import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queue } from './index';

test('queue handler writes handshake event to D1 and R2', async () => {
  const sqlCalls: string[] = [];
  const r2Writes: string[] = [];
  const acks: number[] = [];

  const env = {
    DB: {
      prepare: (sql: string) => {
        sqlCalls.push(sql);
        return {
          run: async () => ({}),
          bind: () => ({ run: async () => ({}) })
        };
      }
    },
    Assets: {
      put: async (key: string) => {
        r2Writes.push(key);
      }
    }
  } as any;

  const batch = {
    messages: [
      {
        body: {
          id: 'task-1',
          source: 'Codex',
          action: 'validate-connection',
          payload: { ok: true }
        },
        ack: () => {
          acks.push(1);
        },
        retry: () => {
          throw new Error('retry should not be called');
        }
      }
    ]
  } as any;

  await queue(batch, env);

  assert.equal(sqlCalls.length >= 2, true);
  assert.equal(r2Writes[0], 'handshake/task-1.json');
  assert.equal(acks.length, 1);
});
