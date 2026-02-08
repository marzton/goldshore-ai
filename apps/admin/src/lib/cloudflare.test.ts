import { test } from 'node:test';
import assert from 'node:assert';
import { getCloudflareMetrics } from './cloudflare.ts';

test('getCloudflareMetrics handles successful response with full payload', async () => {
  const mockMetrics = {
    highlights: {
      totalRequests: '20M',
      cacheHitRate: '90%',
      threatsBlocked: '500',
      dnsChanges: '5',
    },
    refreshedAt: '2023-01-01T00:00:00Z',
    source: 'live',
    note: 'Custom note',
  };
  const mockFetcher = async () => ({
    ok: true,
    json: async () => mockMetrics,
  } as any);

  const metrics = await getCloudflareMetrics({ fetcher: mockFetcher });
  assert.strictEqual(metrics.highlights.totalRequests, '20M');
  assert.strictEqual(metrics.refreshedAt, '2023-01-01T00:00:00Z');
  assert.strictEqual(metrics.source, 'live');
  assert.strictEqual(metrics.note, 'Custom note');
});

test('getCloudflareMetrics handles successful response with partial payload', async () => {
  const mockMetrics = {
    highlights: {
      totalRequests: '10M',
    }
  };
  const mockFetcher = async () => ({
    ok: true,
    json: async () => mockMetrics,
  } as any);

  const metrics = await getCloudflareMetrics({ fetcher: mockFetcher });
  assert.strictEqual(metrics.highlights.totalRequests, '10M');
  // Check that other highlights use fallback values
  assert.strictEqual(metrics.highlights.cacheHitRate, '86.7%');
  // Check default values for source and note
  assert.strictEqual(metrics.source, 'live');
  assert.strictEqual(metrics.note, 'Live metrics pulled from secure backend.');
  // Check refreshedAt is a valid ISO string (should be new Date().toISOString() since missing in payload)
  assert.doesNotThrow(() => new Date(metrics.refreshedAt).toISOString());
});

test('getCloudflareMetrics handles non-ok response (e.g., 500)', async () => {
  const mockFetcher = async () => ({
    ok: false,
    status: 500,
  } as any);

  const metrics = await getCloudflareMetrics({ fetcher: mockFetcher });
  assert.strictEqual(metrics.source, 'mock'); // Defaults to fallbackMetrics.source which is 'mock'
  assert.match(metrics.note, /Backend responded with 500/);
});

test('getCloudflareMetrics handles fetch exception (network error)', async () => {
  const mockFetcher = async () => {
    throw new Error('Network failure');
  };

  const metrics = await getCloudflareMetrics({ fetcher: mockFetcher });
  assert.strictEqual(metrics.source, 'mock');
  assert.match(metrics.note, /Secure backend unavailable/);
});

test('getCloudflareMetrics handles JSON parsing error', async () => {
  const mockFetcher = async () => ({
    ok: true,
    json: async () => { throw new Error('SyntaxError: Unexpected token'); },
  } as any);

  const metrics = await getCloudflareMetrics({ fetcher: mockFetcher });
  assert.strictEqual(metrics.source, 'mock');
  assert.match(metrics.note, /Secure backend unavailable/);
});
