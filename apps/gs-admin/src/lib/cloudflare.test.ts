import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getCloudflareMetrics } from './cloudflare.ts';

describe('getCloudflareMetrics', () => {
  it('should return live metrics when fetch is successful', async () => {
    const mockData = {
      highlights: {
        totalRequests: '20M',
        cacheHitRate: '90%',
        threatsBlocked: '500',
        dnsChanges: '5',
      },
    };

    const mockFetcher = async () => {
      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const result = await getCloudflareMetrics({ fetcher: mockFetcher as any });

    assert.strictEqual(result.source, 'live');
    assert.strictEqual(result.highlights.totalRequests, '20M');
    assert.strictEqual(result.note, 'Live metrics pulled from secure backend.');
  });

  it('should return fallback metrics when fetch returns non-ok status', async () => {
    const mockFetcher = async () => {
      return new Response(null, { status: 500 });
    };

    const result = await getCloudflareMetrics({ fetcher: mockFetcher as any });

    assert.strictEqual(result.source, 'mock');
    assert.strictEqual(result.note, 'Backend responded with 500; using cached defaults.');
    // Should contain fallback data
    assert.strictEqual(result.highlights.totalRequests, '18.4M');
  });

  it('should return fallback metrics when fetch throws an error', async () => {
    const mockFetcher = async () => {
      throw new Error('Network error');
    };

    const result = await getCloudflareMetrics({ fetcher: mockFetcher as any });

    assert.strictEqual(result.source, 'mock');
    assert.strictEqual(result.note, 'Secure backend unavailable; presenting mock data.');
    // Should contain fallback data
    assert.strictEqual(result.highlights.totalRequests, '18.4M');
  });

  it('should use the provided endpoint', async () => {
    let capturedUrl: string | URL | Request = '';
    const mockFetcher = async (url: string | URL | Request) => {
      capturedUrl = url;
      return new Response(JSON.stringify({}), { status: 200 });
    };

    const testEndpoint = 'https://test.api/metrics';
    await getCloudflareMetrics({
      endpoint: testEndpoint,
      fetcher: mockFetcher as any
    });

    assert.strictEqual(capturedUrl, testEndpoint);
  });
});
