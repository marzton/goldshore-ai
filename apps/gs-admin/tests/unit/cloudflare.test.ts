import { test } from 'node:test';
import assert from 'node:assert';
import { getCloudflareContext, getCloudflareMetrics } from '../../src/lib/cloudflare.ts';

test('getCloudflareContext returns runtime env when present', () => {
  const mockEnv = { TEST_VAR: 'test' };
  const locals = {
    runtime: {
      env: mockEnv
    }
  };
  const result = getCloudflareContext(locals);
  assert.strictEqual(result, mockEnv);
});

test('getCloudflareContext returns process.env when runtime.env is missing', () => {
  const locals = {
    runtime: {}
  };
  const result = getCloudflareContext(locals);
  assert.strictEqual(result, process.env);
});

test('getCloudflareContext returns process.env when runtime is missing', () => {
  const locals = {};
  const result = getCloudflareContext(locals);
  assert.strictEqual(result, process.env);
});

test('getCloudflareMetrics returns default values', async () => {
  const metrics = await getCloudflareMetrics();
  assert.deepStrictEqual(metrics, {
    requests: 0,
    bandwidth: 0,
    threats: 0,
    pageViews: 0
  });
});
