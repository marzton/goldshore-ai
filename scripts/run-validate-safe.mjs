#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const validators = [
  {
    name: 'workspace contract validator',
    command: ['tsx', 'scripts/validate-workspace-contract.ts'],
  },
  {
    name: 'worker structure validator',
    command: ['tsx', 'scripts/validate-worker-structure.ts'],
  },
  {
    name: 'worker names validator',
    command: ['tsx', 'scripts/validate-worker-names.ts'],
  },
];

const allowPartial = process.env.STABILIZATION_ALLOW_PARTIAL === 'true';
const failures = [];

console.log(
  `[validate-safe] Starting ${validators.length} validator(s). ` +
    `STABILIZATION_ALLOW_PARTIAL=${allowPartial ? 'true' : 'false'}`,
);

for (const validator of validators) {
  const [cmd, ...args] = validator.command;
  console.log(`\n[validate-safe] Running ${validator.name}: ${validator.command.join(' ')}`);

  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  const exitCode = result.status ?? 1;
  if (exitCode !== 0) {
    const reason = `${validator.name} failed with exit code ${exitCode}`;
    failures.push(reason);
    console.error(`[validate-safe] ❌ ${reason}`);

    if (!allowPartial) {
      console.error(
        '[validate-safe] Failing fast. Set STABILIZATION_ALLOW_PARTIAL=true only for temporary stabilization bypasses.',
      );
      process.exit(exitCode);
    }

    console.warn(
      '[validate-safe] ⚠️ Temporary bypass active; continuing despite this failure. ' +
        'Remove bypass after validator duplicate-symbol fixes are merged.',
    );
    continue;
  }

  console.log(`[validate-safe] ✅ ${validator.name} passed`);
}

if (failures.length > 0 && allowPartial) {
  console.warn('\n[validate-safe] Completed with bypassed validator failures:');
  for (const failure of failures) {
    console.warn(`[validate-safe] - ${failure}`);
  }
  // TODO(stabilization): Remove STABILIZATION_ALLOW_PARTIAL bypass after validator duplicate-symbol fixes are merged.
  process.exit(0);
}

console.log('\n[validate-safe] All validators passed.');
