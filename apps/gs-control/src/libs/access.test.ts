import { describe, it } from 'node:test';
import assert from 'node:assert';
import { configure, audit } from './access.ts';
import type { ControlEnv } from './types.ts';

describe('Access Lib', () => {
  const mockEnv = {} as ControlEnv;

  it('should return access configured status', async () => {
    const result = await configure(mockEnv);
    assert.deepStrictEqual(result, { status: 'access configured', ok: true });
  });

  it('should return audit findings', async () => {
    const result = await audit(mockEnv);
    assert.strictEqual(result.ok, true);
    assert.ok(Array.isArray(result.findings));
    assert.strictEqual(result.findings.length, 3);
  });
});
