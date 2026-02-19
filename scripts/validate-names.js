#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

if (process.env.STABILIZATION_MODE === 'true') {
  console.log('Validation temporarily bypassed (stabilization mode): names');
  process.exit(0);
}

const result = spawnSync('pnpm', ['exec', 'tsx', 'scripts/validate-worker-names.ts'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
