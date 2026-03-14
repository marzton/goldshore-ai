import { test } from 'node:test';
import assert from 'node:assert';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { escapeHtml, isValidEmail, sanitizeInput } from '../../src/utils/security.ts';

test('escapeHtml should escape special characters', () => {
  assert.strictEqual(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.strictEqual(escapeHtml('&'), '&amp;');
  assert.strictEqual(escapeHtml('foo & bar'), 'foo &amp; bar');
  assert.strictEqual(escapeHtml("'"), '&#039;');
});

test('escapeHtml should handle empty string', () => {
  assert.strictEqual(escapeHtml(''), '');
});

test('escapeHtml should handle string with no special characters', () => {
  assert.strictEqual(escapeHtml('hello world'), 'hello world');
});

test('isValidEmail should validate correct emails', () => {
  assert.strictEqual(isValidEmail('test@example.com'), true);
  assert.strictEqual(isValidEmail('user.name+tag@example.co.uk'), true);
});

test('isValidEmail should invalidate incorrect emails', () => {
  assert.strictEqual(isValidEmail('plainaddress'), false);
  assert.strictEqual(isValidEmail('@missingusername.com'), false);
  assert.strictEqual(isValidEmail('username@.com'), false);
  assert.strictEqual(isValidEmail('username@com'), false); // Assuming domain must have a dot
  assert.strictEqual(isValidEmail(''), false);
});

test('sanitizeInput should trim and escape', () => {
  assert.strictEqual(sanitizeInput('  <script>  '), '&lt;script&gt;');
  assert.strictEqual(sanitizeInput(' hello '), 'hello');
});

test('sanitizeInput should handle non-string input gracefully', () => {
  // TypeScript might prevent this, but runtime check handles it
  assert.strictEqual(sanitizeInput(null as any), '');
  assert.strictEqual(sanitizeInput(undefined as any), '');
  assert.strictEqual(sanitizeInput(123 as any), '');
});


test('Content-Security-Policy disallows inline scripts', () => {
  const headersPath = resolve(process.cwd(), 'public/_headers');
  const headersFile = readFileSync(headersPath, 'utf8');
  const cspLine = headersFile
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('Content-Security-Policy:'));

  assert.ok(cspLine, 'Expected a Content-Security-Policy header in public/_headers');
  assert.match(cspLine!, /script-src 'self'(?:;|\s)/);
  assert.doesNotMatch(cspLine!, /script-src[^;]*'unsafe-inline'/);
});
