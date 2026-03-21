import { test } from 'node:test';
import assert from 'node:assert';
import { authorizeAdminRequest } from '../../src/utils/adminAuth.ts';

test('authorizeAdminRequest returns 503 when admin auth is not configured', async () => {
  const request = new Request('https://goldshore.ai/api/forms');
  const result = await authorizeAdminRequest(request, {}, 'forms:read');

  assert.strictEqual(result.authorized, false);
  assert.strictEqual(result.response.status, 503);
});

test('authorizeAdminRequest returns 401 when access claims are missing', async () => {
  const request = new Request('https://goldshore.ai/api/forms');
  const result = await authorizeAdminRequest(
    request,
    { CLOUDFLARE_ACCESS_AUDIENCE: 'audience' },
    'forms:read',
    {
      verifyAccessWithClaims: async () => null,
    },
  );

  assert.strictEqual(result.authorized, false);
  assert.strictEqual(result.response.status, 401);
});

test('authorizeAdminRequest returns 403 when caller lacks the required permission', async () => {
  const request = new Request('https://goldshore.ai/api/forms');
  const result = await authorizeAdminRequest(
    request,
    { CLOUDFLARE_ACCESS_AUDIENCE: 'audience' },
    'forms:write',
    {
      verifyAccessWithClaims: async () => ({ roles: ['viewer'] }),
    },
  );

  assert.strictEqual(result.authorized, false);
  assert.strictEqual(result.response.status, 403);
});

test('authorizeAdminRequest authorizes admins with the required permission', async () => {
  const request = new Request('https://goldshore.ai/api/forms');
  const result = await authorizeAdminRequest(
    request,
    { CLOUDFLARE_ACCESS_AUDIENCE: 'audience' },
    'forms:write',
    {
      verifyAccessWithClaims: async () => ({ email: 'admin@goldshore.ai', roles: ['admin'] }),
    },
  );

  assert.strictEqual(result.authorized, true);
  if (!result.authorized) {
    throw new Error('Expected request to be authorized.');
  }
  assert.deepStrictEqual(result.session.roles, ['admin']);
  assert.ok(result.session.permissions.includes('forms:write'));
  assert.strictEqual(result.claims.email, 'admin@goldshore.ai');
});
