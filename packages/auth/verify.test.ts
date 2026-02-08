import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert';
import { verifyAccess, verifyAccessWithClaims, deps, type Env } from './verify.ts';

describe('verifyAccess', () => {
    // Helper to mock jwtVerify
    function mockJwtVerify(impl: any) {
        // mock.method replaces the method on the object
        return mock.method(deps, 'jwtVerify', impl);
    }

    // Helper to mock createRemoteJWKSet
    function mockCreateRemoteJWKSet(impl: any) {
        return mock.method(deps, 'createRemoteJWKSet', impl);
    }

    before(() => {
        // Mock createRemoteJWKSet globally for all tests since it's cached
        mockCreateRemoteJWKSet(() => ({}));
    });

    after(() => {
        mock.reset();
    });

    test('returns false when no token header is present', async () => {
        const req = new Request('http://example.com');
        const env: Env = {};
        const result = await verifyAccess(req, env);
        assert.strictEqual(result, false);
    });

    test('returns false when jwtVerify throws an error (invalid token)', async () => {
        const req = new Request('http://example.com', {
            headers: { 'CF-Access-Jwt-Assertion': 'invalid-token' }
        });
        const env: Env = {};

        const jwtVerifyMock = mockJwtVerify(async () => {
            throw new Error('Invalid token');
        });

        const result = await verifyAccess(req, env);
        assert.strictEqual(result, false);
        assert.strictEqual(jwtVerifyMock.mock.callCount(), 1);

        jwtVerifyMock.mock.restore();
    });

    test('returns true when jwtVerify succeeds (valid token)', async () => {
        const req = new Request('http://example.com', {
            headers: { 'CF-Access-Jwt-Assertion': 'valid-token' }
        });
        const env: Env = {};
        const mockPayload = { sub: 'user123', email: 'test@example.com' };

        const jwtVerifyMock = mockJwtVerify(async () => {
            return { payload: mockPayload };
        });

        const result = await verifyAccess(req, env);
        assert.strictEqual(result, true);
        assert.strictEqual(jwtVerifyMock.mock.callCount(), 1);

        jwtVerifyMock.mock.restore();
    });

    test('verifyAccessWithClaims returns payload on success', async () => {
        const req = new Request('http://example.com', {
            headers: { 'CF-Access-Jwt-Assertion': 'valid-token' }
        });
        const env: Env = {};
        const mockPayload = { sub: 'user123', email: 'test@example.com' };

        const jwtVerifyMock = mockJwtVerify(async () => {
            return { payload: mockPayload };
        });

        const payload = await verifyAccessWithClaims(req, env);
        assert.deepStrictEqual(payload, mockPayload);

        jwtVerifyMock.mock.restore();
    });

    test('verifyAccessWithClaims passes audience to jwtVerify when configured', async () => {
        const req = new Request('http://example.com', {
            headers: { 'CF-Access-Jwt-Assertion': 'valid-token' }
        });
        const env: Env = { CLOUDFLARE_ACCESS_AUDIENCE: 'my-audience' };
        const mockPayload = { sub: 'user123' };

        const jwtVerifyMock = mockJwtVerify(async () => {
            return { payload: mockPayload };
        });

        await verifyAccessWithClaims(req, env);

        const calls = jwtVerifyMock.mock.calls[0];
        // Check if the 3rd argument (options) has audience
        assert.strictEqual(calls.arguments[2].audience, 'my-audience');

        jwtVerifyMock.mock.restore();
    });

    test('verifyAccessWithClaims uses correct issuer based on env', async () => {
        const req = new Request('http://example.com', {
            headers: { 'CF-Access-Jwt-Assertion': 'valid-token' }
        });
        const env: Env = { CLOUDFLARE_TEAM_DOMAIN: 'custom.team.com' };
        const mockPayload = { sub: 'user123' };

        const jwtVerifyMock = mockJwtVerify(async () => {
            return { payload: mockPayload };
        });

        await verifyAccessWithClaims(req, env);

        const calls = jwtVerifyMock.mock.calls[0];
        // Check if the 3rd argument (options) has issuer
        assert.strictEqual(calls.arguments[2].issuer, 'https://custom.team.com');

        jwtVerifyMock.mock.restore();
    });
});
