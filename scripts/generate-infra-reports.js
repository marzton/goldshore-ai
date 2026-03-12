#!/usr/bin/env node
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function refs(pattern) {
  const out = run(`git for-each-ref --format='%(refname:short)|%(committerdate:iso8601)|%(committerdate:unix)' ${pattern}`);
  if (!out) return [];
  return out.split('\n').filter(Boolean).map((line) => {
    const [name, iso, unix] = line.split('|');
    const ageDays = Math.floor((now - Number(unix) * 1000) / DAY_MS);
    return { name, iso, unix: Number(unix), ageDays };
  });
}

function parseWorkflow(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const doc = YAML.parse(raw) || {};
  const on = doc.on || {};
  const triggers = typeof on === 'string' ? [on] : Object.keys(on);
  const jobs = doc.jobs || {};
  const deps = new Set();
  const reusableRefs = new Set();
  const crossRepo = new Set();

  Object.values(jobs).forEach((job) => {
    if (job.uses && typeof job.uses === 'string') {
      reusableRefs.add(job.uses);
      if (!job.uses.startsWith('./')) crossRepo.add(job.uses);
    }
    (job.steps || []).forEach((step) => {
      if (step.uses && typeof step.uses === 'string') {
        deps.add(step.uses);
        if (step.uses.includes('/.github/workflows/')) {
          reusableRefs.add(step.uses);
          if (!step.uses.startsWith('./')) crossRepo.add(step.uses);
        }
      }
      if (step.run && typeof step.run === 'string') {
        if (step.run.includes('gh ')) deps.add('gh-cli');
        if (step.run.includes('wrangler')) deps.add('wrangler-cli');
      }
    });
  });

  const hasSchedule = triggers.includes('schedule');
  const hasDispatch = triggers.includes('repository_dispatch') || raw.includes('repository_dispatch');
  const hasWorkflowCall = triggers.includes('workflow_call');
  const recursiveRisk = hasSchedule || hasDispatch || hasWorkflowCall || crossRepo.size > 0;
  let status = 'valid';
  try {
    YAML.parse(raw, { uniqueKeys: true });
  } catch {
    status = 'invalid';
  }

  return {
    triggers: triggers.join(', ') || 'none',
    dependencies: [...deps],
    status,
    reusableRefs: [...reusableRefs],
    crossRepo: [...crossRepo],
    class: hasSchedule ? 'Scheduled' : recursiveRisk ? 'Recursive risk' : 'Core',
  };
}

fs.mkdirSync('docs/infra', { recursive: true });

const localBranches = refs('refs/heads');
const remoteBranches = refs('refs/remotes/origin').filter((b) => b.name !== 'origin/HEAD');
const all = [...localBranches, ...remoteBranches];
const stale7 = all.filter((b) => b.ageDays > 7);

let openPrs = [];
const ghJson = run('gh pr list --state open --json number,title,headRefName,baseRefName,updatedAt,url');
let ghAvailable = false;
if (ghJson) {
  try { openPrs = JSON.parse(ghJson); ghAvailable = true; } catch {}
}

const branchSet = new Set(all.map((b) => b.name.replace(/^origin\//, '')));
const prsWithoutHead = ghAvailable ? openPrs.filter((pr) => !branchSet.has(pr.headRefName)) : [];

const branchAudit = [];
branchAudit.push('# BRANCH AUDIT REPORT');
branchAudit.push('');
branchAudit.push(`Generated: ${new Date().toISOString()}`);
branchAudit.push('');
branchAudit.push(`Total branches: ${all.length}`);
branchAudit.push(`Remote branches: ${remoteBranches.length}`);
branchAudit.push(`Local branches: ${localBranches.length}`);
branchAudit.push(`Branches older than 7 days: ${stale7.length}`);
branchAudit.push(`Branches without PR: ${ghAvailable ? Math.max(branchSet.size - new Set(openPrs.map((p) => p.headRefName)).size, 0) : 'unknown (GH auth unavailable)'}`);
branchAudit.push(`PRs without head branch: ${ghAvailable ? prsWithoutHead.length : 'unknown (GH auth unavailable)'}`);
branchAudit.push('');
branchAudit.push('## Branches older than 7 days');
branchAudit.push('| Branch | Last commit | Age days | Scope |');
branchAudit.push('|---|---:|---:|---|');
if (!stale7.length) branchAudit.push('| _none_ | - | - | - |');
for (const b of stale7.sort((a, z) => z.ageDays - a.ageDays)) {
  const scope = b.name.startsWith('origin/') ? 'remote' : 'local';
  branchAudit.push(`| ${b.name} | ${b.iso} | ${b.ageDays} | ${scope} |`);
}
branchAudit.push('');
branchAudit.push('## Deletion candidates (approval required)');
branchAudit.push('No deletions were performed. Use this as proposal-only input for manual approval.');
branchAudit.push('');
branchAudit.push('## Data collection notes');
branchAudit.push('- Branch data source: local git refs.');
branchAudit.push(`- Open PR data source: ${ghAvailable ? 'GitHub CLI' : 'unavailable (no auth/tooling)' }.`);
fs.writeFileSync('docs/infra/BRANCH_AUDIT_REPORT.md', branchAudit.join('\n') + '\n');

const workflows = fs.readdirSync('.github/workflows').filter((f) => f.endsWith('.yml') || f.endsWith('.yaml')).sort();
const wfLines = ['# WORKFLOW MAP', '', `Generated: ${new Date().toISOString()}`, '', '| Workflow | Trigger(s) | Dependencies | Status | Reusable refs | Cross-repo refs | Class |', '|---|---|---|---|---|---|---|'];
for (const wf of workflows) {
  const full = path.join('.github/workflows', wf);
  const meta = parseWorkflow(full);
  wfLines.push(`| ${wf} | ${meta.triggers || 'none'} | ${(meta.dependencies.join('<br>') || 'none')} | ${meta.status} | ${(meta.reusableRefs.join('<br>') || 'none')} | ${(meta.crossRepo.join('<br>') || 'none')} | ${meta.class} |`);
}
fs.writeFileSync('docs/infra/WORKFLOW_MAP.md', wfLines.join('\n') + '\n');

const prLines = ['# PR RECONCILIATION REPORT', '', `Generated: ${new Date().toISOString()}`, ''];
if (!ghAvailable) {
  prLines.push('GitHub PR API/CLI access unavailable in this environment.');
  prLines.push('No PR close/reconcile actions were executed.');
  prLines.push('');
  prLines.push('## Required manual follow-up');
  prLines.push('1. List all open PRs.');
  prLines.push('2. Close non-stabilization PRs.');
  prLines.push('3. Close PRs with missing head branches.');
} else {
  const nonStab = openPrs.filter((pr) => !/^stabilize\//.test(pr.headRefName));
  prLines.push(`Open PRs: ${openPrs.length}`);
  prLines.push(`Non-stabilization PRs: ${nonStab.length}`);
  prLines.push(`PRs without head branch: ${prsWithoutHead.length}`);
}
fs.writeFileSync('docs/infra/PR_RECONCILIATION_REPORT.md', prLines.join('\n') + '\n');

const depLines = ['# REPO DEPENDENCY GRAPH', '', `Generated: ${new Date().toISOString()}`, '', '## Cross-repo / dispatch workflow edges (detected)', ''];
let edges = [];
for (const wf of workflows) {
  const full = path.join('.github/workflows', wf);
  const raw = fs.readFileSync(full, 'utf8');
  const matches = raw.match(/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/.github\/workflows\/[A-Za-z0-9_.-]+\.ya?ml/g) || [];
  for (const m of matches) edges.push(`${wf} -> ${m}`);
  if (raw.includes('repository_dispatch')) edges.push(`${wf} -> repository_dispatch`);
  if (raw.includes('workflow_call')) edges.push(`${wf} -> workflow_call`);
}
edges = [...new Set(edges)].sort();
if (!edges.length) {
  depLines.push('- No explicit cross-repo reusable workflow calls detected in current workflow files.');
} else {
  for (const edge of edges) depLines.push(`- ${edge}`);
}
depLines.push('');
depLines.push('## Simple graph');
if (!edges.length) {
  depLines.push('goldshore-ai workflows -> (no cross-repo edges detected)');
} else {
  depLines.push('goldshore-ai workflows');
  for (const edge of edges) depLines.push(`  └─ ${edge}`);
}
fs.writeFileSync('docs/infra/REPO_DEPENDENCY_GRAPH.md', depLines.join('\n') + '\n');

console.log('Generated docs/infra reports.');
