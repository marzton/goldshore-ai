import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { escapeHtml, isValidEmail, sanitizeInput } from '../../src/utils/security.ts';

test('escapeHtml: escapes special characters to prevent XSS', () => {
  assert.strictEqual(escapeHtml('<div>'), '&lt;div&gt;');
  assert.strictEqual(escapeHtml('foo & bar'), 'foo &amp; bar');
  assert.strictEqual(escapeHtml('"quoted"'), '&quot;quoted&quot;');
  assert.strictEqual(escapeHtml("'single'"), '&#039;single&#039;');
  assert.strictEqual(
    escapeHtml('<script>alert("XSS & \'more\'")</script>'),
    '&lt;script&gt;alert(&quot;XSS &amp; &#039;more&#039;&quot;)&lt;/script&gt;'
  );
});

test('escapeHtml: handles empty or falsy strings', () => {
  assert.strictEqual(escapeHtml(''), '');
  // @ts-expect-error - Testing runtime robustness for non-string inputs if any
  assert.strictEqual(escapeHtml(null), '');
  // @ts-expect-error
  assert.strictEqual(escapeHtml(undefined), '');
});

test('isValidEmail: validates standard email formats', () => {
  assert.strictEqual(isValidEmail('test@example.com'), true);
  assert.strictEqual(isValidEmail('user.name@domain.org'), true);
  assert.strictEqual(isValidEmail('user+suffix@example.io'), true);
  assert.strictEqual(isValidEmail('a@b.cd'), true);
});

test('isValidEmail: rejects invalid email formats', () => {
  assert.strictEqual(isValidEmail('plainaddress'), false);
  assert.strictEqual(isValidEmail('@missing-user.com'), false);
  assert.strictEqual(isValidEmail('missing-domain@'), false);
  assert.strictEqual(isValidEmail('user@example'), false);
  assert.strictEqual(isValidEmail(''), false);
});

test('sanitizeInput: trims and escapes input', () => {
  assert.strictEqual(sanitizeInput('  hello  '), 'hello');
  assert.strictEqual(sanitizeInput('  <script>  '), '&lt;script&gt;');
  assert.strictEqual(sanitizeInput('   &   '), '&amp;');
});

test('sanitizeInput: handles non-string inputs gracefully', () => {
  // @ts-expect-error
  assert.strictEqual(sanitizeInput(null), '');
  // @ts-expect-error
  assert.strictEqual(sanitizeInput(123), '');
  // @ts-expect-error
  assert.strictEqual(sanitizeInput({}), '');
});
