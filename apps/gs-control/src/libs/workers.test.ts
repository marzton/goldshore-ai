import { describe, it } from 'node:test';
import assert from 'node:assert';
import { reconcile } from './workers';
import type { ControlEnv } from './types';

describe('Workers Lib', () => {
  const mockEnv = {} as ControlEnv;

  it('should return workers reconciled status', async () => {
    const result = await reconcile(mockEnv);
    assert.deepStrictEqual(result, { status: 'workers reconciled', ok: true });
  });
});
