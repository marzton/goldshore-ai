import { test, describe } from 'node:test';
import assert from 'node:assert';
import { requireAdminAccess } from '../../src/lib/access.ts';

describe('requireAdminAccess', () => {
  test('returns 401 when no claims are found', async () => {
    const request = new Request('http://localhost');
    const env = {};
    const result = await requireAdminAccess(request, env);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.status, 401);
  });
});
