import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const testDir = dirname(fileURLToPath(import.meta.url));
const wranglerToml = readFileSync(join(testDir, '..', '..', 'wrangler.toml'), 'utf8');

const getEnvBlock = (env: 'prod' | 'production' | 'preview') => {
  const envHeader = `[env.${env}]`;
  const start = wranglerToml.indexOf(envHeader);

  assert.notStrictEqual(start, -1, `Expected ${envHeader} to exist in wrangler.toml`);

  const remaining = wranglerToml.slice(start + envHeader.length);
  const nextEnvMatch = remaining.match(/\n\[env\.(?:prod|production|preview)\]/);
  const end = nextEnvMatch ? start + envHeader.length + nextEnvMatch.index! : wranglerToml.length;

  return wranglerToml.slice(start, end);
};

describe('wrangler runtime bindings', () => {
  for (const env of ['prod', 'production', 'preview'] as const) {
    it(`keeps required bindings for ${env}`, () => {
      const block = getEnvBlock(env);

      for (const binding of ['KV', 'CONTROL_LOGS', 'ASSETS', 'DB', 'AI']) {
        assert.match(
          block,
          new RegExp(`binding = "${binding}"`),
          `Expected env.${env} to declare ${binding}`,
        );
      }
    });
  }
});
