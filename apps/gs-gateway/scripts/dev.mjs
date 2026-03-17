import { spawnSync } from 'node:child_process';

const isCI = process.env.CI === 'true' || process.env.CI === '1';

const args = isCI
  ? ['wrangler', 'dev', '--help']
  : ['wrangler', 'dev', 'src/index.ts', ...process.argv.slice(2)];

const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
