#!/usr/bin/env node
const { execSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');

const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    return '';
  }
}

function parseRefs(pattern) {
  const format = '%(refname:short)|%(committerdate:iso8601)|%(committerdate:unix)|%(objectname:short)';
  const out = run(`git for-each-ref --format='${format}' ${pattern}`);
  if (!out) return [];
  return out.split('\n').filter(Boolean).map((line) => {
    const [name, iso, unix, sha] = line.split('|');
    const ageDays = Math.floor((now - Number(unix) * 1000) / DAY_MS);
    return { name, iso, unix: Number(unix), sha, ageDays };
  });
}

const localBranches = parseRefs('refs/heads');
const remoteBranches = parseRefs('refs/remotes/origin').filter((b) => b.name !== 'origin/HEAD');
const allBranches = [...localBranches.map((b) => ({ ...b, scope: 'local' })), ...remoteBranches.map((b) => ({ ...b, scope: 'remote' }))];

const stale7 = allBranches.filter((b) => b.ageDays > 7);
const flag14NoPr = allBranches.filter((b) => b.ageDays > 14);
const flag30 = allBranches.filter((b) => b.ageDays > 30);

let merged = [];
const mergedOut = run('git branch -r --merged origin/main');
if (mergedOut) {
  merged = mergedOut
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s && s !== 'origin/main' && s !== 'origin/HEAD');
}

mkdirSync('docs/infra', { recursive: true });

const lines = [];
lines.push('# STALE BRANCH REPORT');
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push('');
lines.push('## Policy Checks');
lines.push('- Merged branches: candidates for deletion (manual approval required).');
lines.push('- Inactive >30 days: high-priority cleanup candidates.');
lines.push('- Inactive >14 days: review candidates; if no PR then cleanup candidate.');
lines.push('');
lines.push(`- Total local branches: ${localBranches.length}`);
lines.push(`- Total remote origin branches: ${remoteBranches.length}`);
lines.push(`- Inactive >7 days: ${stale7.length}`);
lines.push(`- Inactive >14 days: ${flag14NoPr.length}`);
lines.push(`- Inactive >30 days: ${flag30.length}`);
lines.push(`- Remote branches merged into origin/main: ${merged.length}`);
lines.push('');

function addTable(title, arr) {
  lines.push(`## ${title}`);
  lines.push('| Branch | Scope | Last Commit | Age (days) | SHA |');
  lines.push('|---|---|---:|---:|---|');
  if (!arr.length) {
    lines.push('| _none_ | - | - | - | - |');
  } else {
    for (const b of arr.sort((a, z) => z.ageDays - a.ageDays)) {
      lines.push(`| ${b.name} | ${b.scope} | ${b.iso} | ${b.ageDays} | ${b.sha} |`);
    }
  }
  lines.push('');
}

addTable('Inactive Branches >30 Days', flag30);
addTable('Inactive Branches >14 Days', flag14NoPr);

lines.push('## Remote Branches Merged into origin/main');
lines.push('| Branch |');
lines.push('|---|');
if (!merged.length) {
  lines.push('| _none_ |');
} else {
  for (const branch of merged) lines.push(`| ${branch} |`);
}
lines.push('');
lines.push('## Approval Gate');
lines.push('No branch deletions were performed by this script. This report is recommendation-only.');

writeFileSync('docs/infra/STALE_BRANCH_REPORT.md', lines.join('\n') + '\n');
console.log('Wrote docs/infra/STALE_BRANCH_REPORT.md');
