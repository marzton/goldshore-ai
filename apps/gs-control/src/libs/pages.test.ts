import { describe, it } from 'node:test';
import assert from 'node:assert';
import { deploy } from './pages';
import type { ControlEnv } from './types';

describe('Pages Lib', () => {
  const mockEnv = {} as ControlEnv;

  it('should return pages deployed status', async () => {
    const result = await deploy(mockEnv);
    assert.deepStrictEqual(result, { status: 'pages deployed', ok: true });
  });
});
