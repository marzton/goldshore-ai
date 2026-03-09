#!/usr/bin/env node
import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const appsDir = resolve('apps');
if (!existsSync(appsDir)) {
  console.error('apps/ directory not found.');
  process.exit(1);
}

const workers = readdirSync(appsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `apps/${entry.name}`)
  .filter((worker) => existsSync(resolve(worker, 'wrangler.toml')))
  .sort();

if (workers.length === 0) {
  console.error('No workers with wrangler.toml were found under apps/.');
  process.exit(1);
}

console.log('Audit Environment Parity');
console.log('Workers eligible for preview secret sync:');
for (const worker of workers) {
  console.log(`- ${worker}`);
}
