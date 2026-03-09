#!/usr/bin/env node

const { execSync } = require('node:child_process');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--' || !token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];

    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    i += 1;
  }
  return args;
}

function getCurrentBranch() {
  return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
}

function fail(message) {
  console.error(`✖ ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`✔ ${message}`);
}

function usage() {
  console.log(`Usage:\n  node scripts/validate-preview-bindings.js \\
    --worker <worker-preview-name> \\
    --env preview \\
    --version-id <deployment-id-or-hash> \\
    [--expected-branch <branch>] \\
    [--health-url <https://.../healthz>]`);
}

function isPreviewWorkerName(worker) {
  return /-preview$/i.test(worker);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    usage();
    return;
  }

  const required = ['worker', 'env', 'version-id'];
  const missing = required.filter((key) => !args[key]);

  if (missing.length > 0) {
    fail(`Missing required arguments: ${missing.join(', ')}`);
    usage();
    process.exit(1);
  }

  let currentBranch = '';
  try {
    currentBranch = getCurrentBranch();
    pass(`Current git branch: ${currentBranch}`);
  } catch (error) {
    fail(`Unable to determine current branch: ${error.message}`);
  }

  if (args['expected-branch']) {
    if (currentBranch !== args['expected-branch']) {
      fail(`Current branch '${currentBranch}' does not match --expected-branch '${args['expected-branch']}'`);
    } else {
      pass(`Branch matches expected target: ${args['expected-branch']}`);
    }
  }

  if (args.env !== 'preview') {
    fail(`--env must be 'preview' (received '${args.env}')`);
  } else {
    pass(`Environment is preview`);
  }

  if (!isPreviewWorkerName(args.worker)) {
    fail(`Worker name must end with '-preview' (received '${args.worker}')`);
  } else {
    pass(`Worker naming matches preview convention: ${args.worker}`);
  }

  if (String(args['version-id']).trim().length === 0) {
    fail(`--version-id must not be empty`);
  } else {
    pass(`Version identifier captured: ${args['version-id']}`);
  }

  if (args['health-url']) {
    const expectedPath = '/healthz';
    if (!String(args['health-url']).startsWith('https://')) {
      fail(`--health-url must use https:// (received '${args['health-url']}')`);
    } else if (!String(args['health-url']).includes(expectedPath)) {
      fail(`--health-url should include '${expectedPath}' (received '${args['health-url']}')`);
    } else {
      pass(`Health URL looks valid: ${args['health-url']}`);
    }
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error('\nPreview rollback preconditions FAILED. Do not run wrangler delete.');
    process.exit(process.exitCode);
  }

  console.log('\nAll preview rollback safety preconditions passed.');
}

main();
