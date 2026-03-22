import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { WEB_CONNECT_SRC, WEB_HEADERS_CSP, WEB_META_CSP } from '../../src/utils/csp';

test('connect-src allows same-origin and GoldShore API origins used by browser runtime code', () => {
  assert.deepEqual(WEB_CONNECT_SRC, [
    "'self'",
    'https://api.goldshore.ai',
    'https://api-preview.goldshore.ai',
  ]);
});

test('meta CSP includes the required connect-src origins', () => {
  assert.match(
    WEB_META_CSP,
    /connect-src 'self' https:\/\/api\.goldshore\.ai https:\/\/api-preview\.goldshore\.ai/,
  );
});

test('headers CSP preserves frame-ancestors and the shared connect-src origins', () => {
  assert.match(
    WEB_HEADERS_CSP,
    /connect-src 'self' https:\/\/api\.goldshore\.ai https:\/\/api-preview\.goldshore\.ai/,
  );
  assert.match(WEB_HEADERS_CSP, /frame-ancestors 'none'/);
});
