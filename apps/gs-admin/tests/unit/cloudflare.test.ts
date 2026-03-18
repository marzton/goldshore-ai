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

test('getCloudflareMetrics returns a valid mocked metrics payload', async () => {
  const metrics = await getCloudflareMetrics();

  assert.strictEqual(metrics.source, 'mock');
  assert.strictEqual(typeof metrics.refreshedAt, 'string');
  assert.strictEqual(
    metrics.note,
    'Metrics are currently mocked for development and testing.'
  );

  assert.deepStrictEqual(Object.keys(metrics.highlights), [
    'totalRequests',
    'cacheHitRate',
    'threatsBlocked',
    'dnsChanges'
  ]);

  assert.ok(metrics.charts.requests);
  assert.ok(metrics.charts.bandwidth);

  for (const chart of Object.values(metrics.charts)) {
    assert.strictEqual(typeof chart.title, 'string');
    assert.strictEqual(typeof chart.description, 'string');
    assert.strictEqual(typeof chart.summary, 'string');
    assert.ok(['up', 'down', 'steady'].includes(chart.trend));
    assert.ok(Array.isArray(chart.series));
    assert.ok(chart.series.length > 0);
  }
});
