import { test } from 'node:test';
import assert from 'node:assert';
import { getGsApiBaseUrl, buildGsApiHeaders } from '../../src/lib/gs-api.ts';

test('getGsApiBaseUrl should return API_ORIGIN from env if provided', () => {
  const env = { API_ORIGIN: 'https://custom-api.example.com' };
  assert.strictEqual(getGsApiBaseUrl(env), 'https://custom-api.example.com');
});

test('getGsApiBaseUrl should return default URL if API_ORIGIN is not provided', () => {
  const env = {};
  assert.strictEqual(getGsApiBaseUrl(env), 'https://api.goldshore.ai');
});

test('buildGsApiHeaders should include Content-Type and Authorization from request', () => {
  const request = new Request('https://example.com', {
    headers: {
      'Authorization': 'Bearer test-token'
    }
  });

  const headers = buildGsApiHeaders(request);

  assert.strictEqual(headers['Content-Type'], 'application/json');
  assert.strictEqual(headers['Authorization'], 'Bearer test-token');
});

test('buildGsApiHeaders should have empty Authorization if not present in request', () => {
  const request = new Request('https://example.com');

  const headers = buildGsApiHeaders(request);

  assert.strictEqual(headers['Content-Type'], 'application/json');
  assert.strictEqual(headers['Authorization'], '');
});
