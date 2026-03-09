import { spawnSync } from 'node:child_process';

const commandTemplates = {
  preview: {
    build: ['wrangler', 'deploy', '--dry-run', '--outdir=dist/preview', '--env', 'preview'],
  },
  prod: {
    build: ['wrangler', 'deploy', '--dry-run', '--outdir=dist/prod', '--env', 'prod'],
  },
};

const env = process.argv[2] ?? process.env.GS_GATEWAY_ENV;

if (!env || !commandTemplates[env]) {
  console.error('Missing or unsupported build environment. Use one of: preview, prod.');
  process.exit(1);
}

const result = spawnSync('npx', commandTemplates[env].build, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
