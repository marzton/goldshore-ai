import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TOSAdapter } from './index.js';

describe('TOSAdapter', () => {
  const adapter = new TOSAdapter();

  test('should have correct id and name', () => {
    assert.strictEqual(adapter.id, 'tos');
    assert.strictEqual(adapter.name, 'thinkorswim');
  });

  test('should implement getAccounts', async () => {
    const accounts = await adapter.getAccounts();
    assert.ok(Array.isArray(accounts));
  });

  test('should implement getPositions', async () => {
    const positions = await adapter.getPositions('test-account');
    assert.ok(Array.isArray(positions));
  });
});
