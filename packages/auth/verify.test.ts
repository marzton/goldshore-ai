import { test, describe, before, beforeEach, after, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { verifyAccess, verifyAccessWithClaims, type Env, type Dependencies } from './verify.ts';

describe('verifyAccess', () => {
    let mockDeps: Dependencies;
    let createRemoteJWKSetMock: any;
    let jwtVerifyMock: any;

    before(() => {
        // Initialize mocks with safe defaults
        createRemoteJWKSetMock = mock.fn(() => ({}));
        jwtVerifyMock = mock.fn(async () => ({ payload: {} }));

        mockDeps = {
            createRemoteJWKSet: createRemoteJWKSetMock,
            jwtVerify: jwtVerifyMock,
        };
    });

    beforeEach(() => {
        // Reset call history
        createRemoteJWKSetMock.mock.resetCalls();
        jwtVerifyMock.mock.resetCalls();
        // Reset implementation to default safe behavior
        jwtVerifyMock.mock.mockImplementation(async () => ({ payload: {} }));
        createRemoteJWKSetMock.mock.mockImplementation(() => ({}));
    });

    after(() => {
        mock.reset();
    });

    const testVerify = async (req: Request, env: Env) => {
        // Pass mocked dependencies explicitly
        return verifyAccessWithClaims(req, env, mockDeps);
    };

    test('returns null when no token header is present', async () => {
        const req = new Request('http://example.com');
        const env: Env = {};
        const result = await testVerify(req, env);
        assert.strictEqual(result, null);
    });

    test('returns null when jwtVerify throws an error (invalid token)', async () => {
        const req = new Request('http://example.com', {
            headers: { 'CF-Access-Jwt-Assertion': 'invalid-token' }
        });
        const env: Env = {};

        jwtVerifyMock.mock.mockImplementation(async () => {
            throw new Error('Invalid token');
        });

        // We expect verifyAccessWithClaims to catch the error and return null
        // Note: console.error will be called here, but we aren't spying on it in this suite
        // (The separate suite below tests that specifically)

        // Suppress console.error for this test to keep output clean
        const consoleError = mock.method(console, 'error', () => {});

        const result = await testVerify(req, env);
        assert.strictEqual(result, null);
        assert.strictEqual(jwtVerifyMock.mock.callCount(), 1);

        consoleError.mock.restore();
    });

    test('returns payload when jwtVerify succeeds (valid token)', async () => {
        const req = new Request('http://example.com', {
            headers: { 'CF-Access-Jwt-Assertion': 'valid-token' }
        });
        const env: Env = {};
        const mockPayload = { sub: 'user123', email: 'test@example.com' };

        jwtVerifyMock.mock.mockImplementation(async () => {
            return { payload: mockPayload };
        });

        const result = await testVerify(req, env);
        assert.deepStrictEqual(result, mockPayload);
        assert.strictEqual(jwtVerifyMock.mock.callCount(), 1);
    });

    test('passes audience to jwtVerify when configured', async () => {
        const req = new Request('http://example.com', {
            headers: { 'CF-Access-Jwt-Assertion': 'valid-token' }
        });
        const env: Env = { CLOUDFLARE_ACCESS_AUDIENCE: 'my-audience' };
        const mockPayload = { sub: 'user123' };

        jwtVerifyMock.mock.mockImplementation(async () => {
            return { payload: mockPayload };
        });

        await testVerify(req, env);

        const calls = jwtVerifyMock.mock.calls[0];
        assert.strictEqual(calls.arguments[2].audience, 'my-audience');
    });

    test('uses correct issuer based on env', async () => {
        const req = new Request('http://example.com', {
            headers: { 'CF-Access-Jwt-Assertion': 'valid-token' }
        });
        const env: Env = { CLOUDFLARE_TEAM_DOMAIN: 'custom.team.com' };
        const mockPayload = { sub: 'user123' };

        jwtVerifyMock.mock.mockImplementation(async () => {
            return { payload: mockPayload };
        });

        await testVerify(req, env);

        const calls = jwtVerifyMock.mock.calls[0];
        assert.strictEqual(calls.arguments[2].issuer, 'https://custom.team.com');
    });

    test('verifyAccess public wrapper returns boolean', async () => {
         const req = new Request('http://example.com');
         const env: Env = {};
         // verifyAccess uses the default dependencies internally which we can't easily mock
         // without module mocking (which is fragile).
         // However, since we've tested verifyAccessWithClaims extensively with mocks,
         // we just verify basic safety here.
         const result = await verifyAccess(req, env);
         assert.strictEqual(result, false);
    });
});

describe('verifyAccessWithClaims (error handling)', () => {
    let consoleErrorMock: any;
    let mockDeps: Dependencies;

    beforeEach(() => {
        consoleErrorMock = mock.method(console, 'error', () => {});

        const createRemoteJWKSetMock = mock.fn(() => ({}));
        const jwtVerifyMock = mock.fn(async () => {
             throw new Error('Verification failed');
        });

        mockDeps = {
            createRemoteJWKSet: createRemoteJWKSetMock,
            jwtVerify: jwtVerifyMock,
        };
    });

    afterEach(() => {
        if (consoleErrorMock) consoleErrorMock.mock.restore();
    });

    test('catches error and returns null when verification fails', async () => {
        const req = new Request('http://example.com', {
            headers: { 'CF-Access-Jwt-Assertion': 'invalid-token' }
        });
        const env: Env = {};

        // Pass the mockDeps that are configured to throw
        const result = await verifyAccessWithClaims(req, env, mockDeps);

        assert.strictEqual(result, null);
        assert.strictEqual(consoleErrorMock.mock.callCount(), 1);
        const args = consoleErrorMock.mock.calls[0].arguments;
        assert.strictEqual(args[0], "Token verification failed");
    });

    test('returns payload when verification succeeds', async () => {
        const req = new Request('http://example.com', {
            headers: { 'CF-Access-Jwt-Assertion': 'valid-token' }
        });
        const env: Env = {};
        const mockPayload = { sub: 'user123', email: 'test@example.com' };

        // Mock deps.jwtVerify to return success
        jwtVerifyMock = mock.method(deps, 'jwtVerify', async () => {
            return { payload: mockPayload };
        });

        const result = await verifyAccessWithClaims(req, env);

        assert.deepStrictEqual(result, mockPayload);
        assert.strictEqual(consoleErrorMock.mock.callCount(), 0);
    });
});
