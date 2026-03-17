import { test, describe } from 'node:test';
import assert from 'node:assert';
import { FidelityAdapter } from './index.js';

describe('FidelityAdapter', () => {
  const adapter = new FidelityAdapter();

  test('should have correct id and name', () => {
    assert.strictEqual(adapter.id, 'fidelity');
    assert.strictEqual(adapter.name, 'fidelity');
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
