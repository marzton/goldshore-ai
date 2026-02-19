#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

if (process.env.STABILIZATION_MODE === 'true') {
  console.log('Validation temporarily bypassed (stabilization mode): structure');
  process.exit(0);
}

const result = spawnSync('pnpm', ['exec', 'tsx', 'scripts/validate-worker-structure.ts'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
