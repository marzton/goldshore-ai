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
import { getCloudflareMetrics } from '../../src/lib/cloudflare.ts';

test('getCloudflareMetrics should return valid metrics structure', async () => {
  const metrics = await getCloudflareMetrics();

  // Verify basic structure
  assert.strictEqual(typeof metrics.source, 'string');
  assert.ok(['live', 'mock'].includes(metrics.source));
  assert.strictEqual(typeof metrics.refreshedAt, 'string');
  assert.strictEqual(typeof metrics.note, 'string');

  // Verify highlights
  assert.ok(metrics.highlights);
  assert.strictEqual(typeof metrics.highlights.totalRequests, 'string');
  assert.strictEqual(typeof metrics.highlights.cacheHitRate, 'string');
  assert.strictEqual(typeof metrics.highlights.threatsBlocked, 'string');
  assert.strictEqual(typeof metrics.highlights.dnsChanges, 'string');

  // Verify charts
  assert.ok(metrics.charts);
  assert.ok(Object.keys(metrics.charts).length > 0);

  for (const chart of Object.values(metrics.charts)) {
    assert.strictEqual(typeof chart.title, 'string');
    assert.strictEqual(typeof chart.description, 'string');
    assert.strictEqual(typeof chart.summary, 'string');
    assert.ok(['up', 'down', 'steady'].includes(chart.trend));
    assert.ok(Array.isArray(chart.series));

    for (const point of chart.series) {
      assert.strictEqual(typeof point.label, 'string');
      assert.strictEqual(typeof point.value, 'number');
      assert.strictEqual(typeof point.display, 'string');
    }
  }
});

test('getCloudflareMetrics should return mock data in current implementation', async () => {
  const metrics = await getCloudflareMetrics();
  assert.strictEqual(metrics.source, 'mock');
  assert.strictEqual(metrics.note, 'Metrics are currently mocked for development and testing.');
});
