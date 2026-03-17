import { test } from 'node:test';
import assert from 'node:assert';
import { getGsApiBaseUrl, buildGsApiHeaders } from '../../src/lib/gs-api.ts';

test('getGsApiBaseUrl returns API_ORIGIN from env if present', () => {
  const env = { API_ORIGIN: 'https://custom-api.goldshore.ai' };
  const result = getGsApiBaseUrl(env);
  assert.strictEqual(result, 'https://custom-api.goldshore.ai');
});

test('getGsApiBaseUrl returns default URL if API_ORIGIN is missing', () => {
  const env = {};
  const result = getGsApiBaseUrl(env);
  assert.strictEqual(result, 'https://api.goldshore.ai');
});

test('buildGsApiHeaders includes Authorization header if present in request', () => {
  const request = new Request('https://example.com', {
    headers: {
      'Authorization': 'Bearer test-token'
    }
  });
  const headers = buildGsApiHeaders(request);
  assert.strictEqual(headers['Content-Type'], 'application/json');
  assert.strictEqual(headers['Authorization'], 'Bearer test-token');
});

test('buildGsApiHeaders includes empty Authorization header if missing in request', () => {
  const request = new Request('https://example.com');
  const headers = buildGsApiHeaders(request);
  assert.strictEqual(headers['Content-Type'], 'application/json');
  assert.strictEqual(headers['Authorization'], '');
});
