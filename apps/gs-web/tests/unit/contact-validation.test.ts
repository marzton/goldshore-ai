import { test } from 'node:test';
import assert from 'node:assert';
import { extractString, isSpamSubmission, validateRequiredFields, safeRedirect } from '../../src/services/contact/validation.ts';
import type { FormField, Submission } from '../../src/services/contact/types.ts';

test('extractString should handle valid strings', () => {
  assert.strictEqual(extractString(' hello '), 'hello');
  assert.strictEqual(extractString('test'), 'test');
});

test('extractString should handle null or non-strings gracefully', () => {
  assert.strictEqual(extractString(null), '');
  assert.strictEqual(extractString(123 as any), '');
  assert.strictEqual(extractString(undefined as any), '');
});

test('isSpamSubmission should identify honeypot filled as spam', () => {
  const formData = new FormData();
  formData.append('companyWebsite', 'http://spam.com');
  formData.append('formStartedAt', (Date.now() - 5000).toString());

  assert.strictEqual(isSpamSubmission(formData), true);
});

test('isSpamSubmission should not identify missing timer as spam', () => {
  const formData = new FormData();

  assert.strictEqual(isSpamSubmission(formData), false);
});

test('isSpamSubmission should identify invalid timer as spam', () => {
  const formData = new FormData();
  formData.append('formStartedAt', 'invalid_number');

  assert.strictEqual(isSpamSubmission(formData), true);
});

test('isSpamSubmission should identify fast submission as spam', () => {
  const formData = new FormData();
  formData.append('formStartedAt', (Date.now() - 1000).toString());

  assert.strictEqual(isSpamSubmission(formData), true);
});

test('isSpamSubmission should not identify slow submission as spam', () => {
  const formData = new FormData();
  formData.append('formStartedAt', (Date.now() - 5000).toString());

  assert.strictEqual(isSpamSubmission(formData), false);
});

test('validateRequiredFields should identify missing fields', () => {
  const fields: FormField[] = [
    { name: 'name', type: 'text', label: 'Name', required: true },
    { name: 'email', type: 'email', label: 'Email', required: true },
    { name: 'company', type: 'text', label: 'Company' }
  ];

  const submission: Submission = {
    name: 'John Doe',
  };

  const missing = validateRequiredFields(submission, fields);
  assert.strictEqual(missing.length, 1);
  assert.strictEqual(missing[0].name, 'email');
});

test('validateRequiredFields should return empty array when all required fields are present', () => {
  const fields: FormField[] = [
    { name: 'name', type: 'text', label: 'Name', required: true },
    { name: 'email', type: 'email', label: 'Email', required: true },
  ];

  const submission: Submission = {
    name: 'John Doe',
    email: 'john@example.com'
  };

  const missing = validateRequiredFields(submission, fields);
  assert.strictEqual(missing.length, 0);
});

test('safeRedirect should handle missing or invalid redirects', () => {
  const origin = 'http://localhost:3000';
  assert.strictEqual(safeRedirect(null, origin).href, 'http://localhost:3000/thank-you');
  assert.strictEqual(safeRedirect('https://external.com', origin).href, 'http://localhost:3000/thank-you');
});

test('safeRedirect should allow valid local redirects', () => {
  const origin = 'http://localhost:3000';
  assert.strictEqual(safeRedirect('/success', origin).href, 'http://localhost:3000/success');
  assert.strictEqual(safeRedirect(' /about ', origin).href, 'http://localhost:3000/about');
});
