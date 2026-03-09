import { spawnSync } from 'node:child_process';

const templates = {
  preview: {
    build: ['wrangler', 'deploy', '--dry-run', '--outdir=dist/preview', '--env', 'preview'],
    deploy: ['wrangler', 'deploy', '--env', 'preview'],
  },
  prod: {
    build: ['wrangler', 'deploy', '--dry-run', '--outdir=dist/prod', '--env', 'prod'],
    deploy: ['wrangler', 'deploy', '--env', 'prod'],
  },
};

const action = process.argv[2] ?? 'build';
const env = process.argv[3] ?? process.env.GS_GATEWAY_ENV;

if (!(action === 'build' || action === 'deploy')) {
  console.error('Unsupported command. Use: build or deploy.');
  process.exit(1);
}

if (!env || !templates[env]) {
  console.error('Missing or unsupported environment. Use one of: preview, prod.');
  process.exit(1);
}

const result = spawnSync('npx', templates[env][action], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
