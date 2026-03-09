import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getGsApiBaseUrl, buildGsApiHeaders } from './gs-api.ts';

describe('getGsApiBaseUrl', () => {
  test('returns GS_API_URL if present', () => {
    const env = { GS_API_URL: 'https://api.gs.com', PUBLIC_API: 'https://public.api', API_ORIGIN: 'https://origin.api' };
    assert.strictEqual(getGsApiBaseUrl(env), 'https://api.gs.com');
  });

  test('returns PUBLIC_API if GS_API_URL is missing', () => {
    const env = { PUBLIC_API: 'https://public.api', API_ORIGIN: 'https://origin.api' };
    assert.strictEqual(getGsApiBaseUrl(env), 'https://public.api');
  });

  test('returns API_ORIGIN if GS_API_URL and PUBLIC_API are missing', () => {
    const env = { API_ORIGIN: 'https://origin.api' };
    assert.strictEqual(getGsApiBaseUrl(env), 'https://origin.api');
  });

  test('returns empty string if all are missing', () => {
    const env = {};
    assert.strictEqual(getGsApiBaseUrl(env), '');
  });
});

describe('buildGsApiHeaders', () => {
  test('includes Content-Type application/json', () => {
    const request = new Request('https://example.com');
    const headers = buildGsApiHeaders(request);
    assert.strictEqual(headers['Content-Type'], 'application/json');
  });

  test('extracts Authorization header from request', () => {
    const request = new Request('https://example.com', {
      headers: { 'Authorization': 'Bearer token123' }
    });
    const headers = buildGsApiHeaders(request);
    assert.strictEqual(headers['Authorization'], 'Bearer token123');
  });

  test('defaults Authorization header to empty string if missing', () => {
    const request = new Request('https://example.com');
    const headers = buildGsApiHeaders(request);
    assert.strictEqual(headers['Authorization'], '');
  });
});
