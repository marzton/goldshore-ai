import { test, describe, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { createAuthTokenManager, type AuthTokenConfig } from './auth';

describe('createAuthTokenManager', () => {
  let mockFetch: any;
  let mockLogger: any;
  let config: AuthTokenConfig;

  beforeEach(() => {
    mockFetch = mock.fn();
    mockLogger = {
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn(),
    };

    config = {
      tokenUrl: 'https://auth.example.com/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      fetchFn: mockFetch,
      logger: mockLogger,
    };
  });

  test('requests a new token on first call', async () => {
    const manager = createAuthTokenManager(config);
    const mockToken = {
      access_token: 'initial-token',
      expires_in: 3600,
      token_type: 'Bearer',
    };

    mockFetch.mock.mockImplementation(async () => {
      return new Response(JSON.stringify(mockToken), { status: 200 });
    });

    const token = await manager.getToken();

    assert.strictEqual(token, 'initial-token');
    assert.strictEqual(mockFetch.mock.callCount(), 1);

    const [url, options] = mockFetch.mock.calls[0].arguments;
    assert.strictEqual(url, config.tokenUrl);
    assert.strictEqual(options.method, 'POST');

    const body = new URLSearchParams(options.body);
    assert.strictEqual(body.get('grant_type'), 'client_credentials');
    assert.strictEqual(body.get('client_id'), config.clientId);
    assert.strictEqual(body.get('client_secret'), config.clientSecret);
  });

  test('returns cached token if not expired', async () => {
    const manager = createAuthTokenManager(config);
    const mockToken = {
      access_token: 'cached-token',
      expires_in: 3600,
    };

    mockFetch.mock.mockImplementation(async () => {
      return new Response(JSON.stringify(mockToken), { status: 200 });
    });

    // First call
    await manager.getToken();
    // Second call
    const token = await manager.getToken();

    assert.strictEqual(token, 'cached-token');
    assert.strictEqual(mockFetch.mock.callCount(), 1); // Only one fetch
  });

  test('refreshes token when near expiration', async () => {
    const manager = createAuthTokenManager({
      ...config,
      refreshSkewMs: 60000, // 1 minute skew
    });

    const now = Date.now();
    const originalDateNow = Date.now;
    Date.now = () => now;

    try {
      mockFetch.mock.mockImplementation(async (url: string, options: any) => {
        const body = new URLSearchParams(options.body);
        if (body.get('grant_type') === 'client_credentials') {
          return new Response(JSON.stringify({
            access_token: 'token-1',
            expires_in: 50, // Expires in 50s
            refresh_token: 'refresh-1'
          }), { status: 200 });
        }
        if (body.get('grant_type') === 'refresh_token') {
          return new Response(JSON.stringify({
            access_token: 'token-2',
            expires_in: 3600,
            refresh_token: 'refresh-2'
          }), { status: 200 });
        }
        return new Response('', { status: 404 });
      });

      // Get initial token
      await manager.getToken();
      assert.strictEqual(mockFetch.mock.callCount(), 1);

      // Next call should trigger refresh because 50s < 60s skew
      const token = await manager.getToken();

      assert.strictEqual(token, 'token-2');
      assert.strictEqual(mockFetch.mock.callCount(), 2);

      const lastCall = mockFetch.mock.calls[1].arguments;
      const lastBody = new URLSearchParams(lastCall[1].body);
      assert.strictEqual(lastBody.get('grant_type'), 'refresh_token');
      assert.strictEqual(lastBody.get('refresh_token'), 'refresh-1');
    } finally {
      Date.now = originalDateNow;
    }
  });

  test('falls back to client_credentials if refresh fails', async () => {
    const manager = createAuthTokenManager({
      ...config,
      refreshSkewMs: 60000,
    });

    let now = Date.now();
    const originalDateNow = Date.now;
    Date.now = () => now;

    try {
      mockFetch.mock.mockImplementation(async (url: string, options: any) => {
        const body = new URLSearchParams(options.body);
        const grantType = body.get('grant_type');

        if (grantType === 'client_credentials') {
          return new Response(JSON.stringify({
            access_token: 'new-token',
            expires_in: 3600,
            refresh_token: 'new-refresh'
          }), { status: 200 });
        }
        if (grantType === 'refresh_token') {
          return new Response('', { status: 401 }); // Refresh failed
        }
        return new Response('', { status: 404 });
      });

      // 1. Get initial token
      await manager.getToken();
      assert.strictEqual(mockFetch.mock.callCount(), 1);

      // Advance time so it's near expiration (30s left, skew is 60s)
      now += (3600 - 30) * 1000;

      // 2. Mock refresh failure and verify fallback
      const token = await manager.getToken();

      assert.strictEqual(token, 'new-token');
      assert.strictEqual(mockFetch.mock.callCount(), 3); // 1 initial + 1 failed refresh + 1 new client_credentials
      assert.strictEqual(mockLogger.warn.mock.callCount(), 1);
    } finally {
      Date.now = originalDateNow;
    }
  });

  test('requests new token if expired and no refresh token available', async () => {
    const manager = createAuthTokenManager(config);

    let now = Date.now();
    const originalDateNow = Date.now;
    Date.now = () => now;

    try {
      mockFetch.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({
          access_token: 'token',
          expires_in: 3600,
        }), { status: 200 });
      });

      await manager.getToken();
      assert.strictEqual(mockFetch.mock.callCount(), 1);

      // Advance time past expiration
      now += 4000 * 1000;

      await manager.getToken();
      assert.strictEqual(mockFetch.mock.callCount(), 2);
    } finally {
      Date.now = originalDateNow;
    }
  });

  test('throws error when token request fails', async () => {
    const manager = createAuthTokenManager(config);

    mockFetch.mock.mockImplementation(async () => {
      return new Response(JSON.stringify({ error: 'invalid_client' }), { status: 400 });
    });

    await assert.rejects(manager.getToken(), {
      message: 'Token request failed (400)',
    });

    assert.strictEqual(mockLogger.error.mock.callCount(), 1);
  });

  test('includes scope and audience in request if provided', async () => {
    const manager = createAuthTokenManager({
      ...config,
      scope: 'read:all',
      audience: 'https://api.example.com',
    });

    mockFetch.mock.mockImplementation(async () => {
      return new Response(JSON.stringify({ access_token: 'token', expires_in: 3600 }), { status: 200 });
    });

    await manager.getToken();

    const options = mockFetch.mock.calls[0].arguments[1];
    const body = new URLSearchParams(options.body);
    assert.strictEqual(body.get('scope'), 'read:all');
    assert.strictEqual(body.get('audience'), 'https://api.example.com');
  });
});
