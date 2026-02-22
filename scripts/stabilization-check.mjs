import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const REPORT_PATH = 'docs/ci/CURRENT_STATE.md';
const APPS_DIR = 'apps';
const WORKFLOW_DIR = '.github/workflows';
const AUTHORITATIVE_CI_SOURCE = 'https://github.com/goldshore-ai/goldshore-ai/actions';

const ALLOWED_APPS = ['gs-web', 'gs-admin', 'gs-api', 'gs-mail', 'gs-gateway', 'gs-agent', 'gs-control'];
const BASELINE_BUILD_SCRIPTS = ['dev', 'build', 'build:openapi', 'lint', 'test', 'check:pages', 'scan:pii', 'check:docs-consistency', 'check:naming', 'validate:structure', 'validate:names', 'validate:workers', 'validate:workspace', 'validate', 'branch:bootstrap', 'scaffold:worker', 'workspaces:list', 'verify:workspace-filters'];
const KNOWN_WORKFLOWS = ['deploy-gs-admin.yml', 'deploy-gs-agent.yml.disabled', 'deploy-gs-api.yml', 'deploy-gs-control.yml.disabled', 'deploy-gs-gateway.yml.disabled', 'deploy-gs-mail.yml', 'deploy-gs-web.yml', 'jules-nightly.yml', 'lockfile-guard.yml', 'manual.yml', 'naming-guard.yml', 'naming-lint.yml', 'neuralegion.yml', 'palette-manual.yml', 'pii-scan.yml', 'preview-agent.yml', 'preview-gs-admin.yml', 'preview-gs-api.yml', 'preview-gs-gateway.yml', 'preview-gs-web.yml', 'route-collision-check.yml', 'sonarcloud.yml', 'summary.yml', 'tfsec.yml', 'stabilization-task.yml'];
const ALLOWED_ACTIONS = ['actions/checkout', 'actions/setup-node', 'actions/upload-artifact', 'aquasecurity/tfsec-sarif-action', 'cloudflare/pages-action', 'github/codeql-action/upload-sarif', 'pnpm/action-setup', 'stefanzweifel/git-auto-commit-action', 'NeuraLegion/run-scan', 'SonarSource/sonarcloud-github-action', 'actions/ai-inference'];

const violations = [];
const appLevelIssues = [];

const run = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
const tryRun = (cmd) => { try { return run(cmd); } catch { return null; } };
const gitRefExists = (ref) => { try { execSync(`git rev-parse --verify ${ref}`, { stdio: 'ignore' }); return true; } catch { return false; } };

function resolveBaseRef() {
  if (gitRefExists('origin/main')) return 'origin/main';
  if (gitRefExists('main')) return 'main';
  return null;
}

function getBranchInfo() {
  const branch = run('git rev-parse --abbrev-ref HEAD');
  const baseRef = resolveBaseRef();
  if (!baseRef) {
    return { branch, baseRef: 'main (unavailable locally)', behind: 0, ahead: 0, divergenceNote: '⚠️ Could not resolve a local main tracking ref; divergence defaults to 0/0 in this checkout.' };
  }
  const [behindRaw, aheadRaw] = run(`git rev-list --left-right --count ${baseRef}...HEAD`).split(/\s+/);
  return { branch, baseRef, behind: Number.parseInt(behindRaw, 10), ahead: Number.parseInt(aheadRaw, 10) };
}

function getPrCiStatus(branch) {
  if (!tryRun('gh --version')) return { summary: '⚠️ gh CLI unavailable; unable to resolve PR CI status in this environment.' };
  const prNumberFromRef = process.env.GITHUB_REF?.startsWith('refs/pull/') ? process.env.GITHUB_REF.split('/')[2] : null;
  const prNumber = prNumberFromRef ?? tryRun(`gh pr list --head "${branch}" --state open --limit 1 --json number --jq '.[0].number'`);
  if (!prNumber) return { summary: `⚠️ No open PR detected for branch \`${branch}\`; authoritative CI source: ${AUTHORITATIVE_CI_SOURCE}` };

  const rollupRaw = tryRun(`gh pr view ${prNumber} --json number,url,statusCheckRollup`);
  if (!rollupRaw) return { summary: `⚠️ Unable to fetch status checks for PR #${prNumber}; authoritative CI source: ${AUTHORITATIVE_CI_SOURCE}` };

  const pr = JSON.parse(rollupRaw);
  const checks = (pr.statusCheckRollup || []).map((c) => ({ name: c.name ?? c.context ?? 'unknown-check', status: c.status ?? 'UNKNOWN', conclusion: c.conclusion ?? 'PENDING' }));
  if (!checks.length) return { summary: `⚠️ PR #${pr.number} has no reported checks yet. [PR Link](${pr.url})` };

  const failed = checks.filter((c) => ['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED'].includes(c.conclusion));
  const pending = checks.filter((c) => c.status !== 'COMPLETED');
  const state = failed.length ? '❌ FAIL' : pending.length ? '🟡 PENDING' : '✅ PASS';
  return { summary: `${state} PR #${pr.number} checks (${checks.length} total). [PR Link](${pr.url})`, checks };
}

function checkBuild(name, command) {
  try { execSync(command, { stdio: 'ignore' }); return `| **${name}** | ✅ PASS | |`; }
  catch { appLevelIssues.push(`${name} build failed`); return `| **${name}** | ❌ FAIL | Check run logs |`; }
}

const historical = ['1', 'true', 'yes'].includes((process.env.STABILIZATION_REPORT_HISTORICAL || '').toLowerCase());
const { branch, baseRef, behind, ahead, divergenceNote } = getBranchInfo();

let report = '# Stabilization Sync Check Report\n\n';
if (historical) {
  report += '> [!WARNING]\n';
  report += '> **Historical Snapshot (Non-Authoritative).** This report is intentionally historical and must not be used as source of truth for CI decisions.\n';
  report += `> Authoritative CI source: ${AUTHORITATIVE_CI_SOURCE}\n\n`;
}
report += `**Date:** ${new Date().toUTCString()}\n\n`;

report += '## 1. Governance Compliance Check\n\n';
try {
  const apps = fs.readdirSync(APPS_DIR).filter((f) => fs.statSync(path.join(APPS_DIR, f)).isDirectory());
  const forbiddenApps = apps.filter((app) => !ALLOWED_APPS.includes(app));
  if (forbiddenApps.length) { const msg = `Forbidden directories detected in apps/: ${forbiddenApps.join(', ')}`; violations.push(msg); report += `### ❌ App Structure Violation\n- ${msg}\n\n`; }
  else report += '✅ Directory structure compliant.\n\n';
} catch (e) { report += `⚠️ Could not scan apps directory: ${e.message}\n\n`; }

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newScripts = Object.keys(pkg.scripts || {}).filter((s) => !BASELINE_BUILD_SCRIPTS.includes(s));
  if (newScripts.length) { const msg = `New scripts detected in root package.json: ${newScripts.join(', ')}`; violations.push(msg); report += `### ❌ Build Script Violation\n- ${msg}\n\n`; }
  else report += '✅ Root build scripts compliant.\n\n';
} catch (e) { report += `⚠️ Could not parse root package.json: ${e.message}\n\n`; }

try {
  const workflows = fs.readdirSync(WORKFLOW_DIR);
  const newWorkflows = workflows.filter((w) => !KNOWN_WORKFLOWS.includes(w));
  if (newWorkflows.length) { const msg = `New workflows detected: ${newWorkflows.join(', ')}`; violations.push(msg); report += `### ❌ Workflow Violation (New Files)\n- ${msg}\n\n`; }
  else report += '✅ Workflow file list compliant.\n\n';

  const unauthorizedActions = [...new Set(workflows
    .filter((w) => w.endsWith('.yml') || w.endsWith('.yaml'))
    .flatMap((w) => fs.readFileSync(path.join(WORKFLOW_DIR, w), 'utf8').split('\n').filter((l) => l.trim().startsWith('uses:')).map((line) => ({ w, action: line.split('uses:')[1].trim().split('@')[0] })))
    .filter(({ action }) => !action.startsWith('./') && !ALLOWED_ACTIONS.includes(action))
    .map(({ w, action }) => `${action} (in ${w})`))];

  if (unauthorizedActions.length) { const msg = `Unauthorized CI Actions detected: ${unauthorizedActions.join(', ')}`; violations.push(msg); report += `### ❌ CI Action Violation\n- ${msg}\n\n`; }
  else report += '✅ CI Actions compliant.\n\n';
} catch (e) { report += `⚠️ Could not scan workflows: ${e.message}\n\n`; }

report += '## 2. Branch Discipline Check\n\n';
report += `**Current Branch:** ${branch}\n\n`;
report += `**Divergence vs ${baseRef}:** Behind: ${behind}, Ahead: ${ahead}\n\n`;
if (divergenceNote) report += `${divergenceNote}\n\n`;
if (ahead > 5) report += `⚠️ **High Divergence Detected:** Branch is ahead of main by >5 commits (${ahead}).\n\n`;

report += '## 3. CI State Snapshot (PR Context)\n\n';
const ci = getPrCiStatus(branch);
report += `${ci.summary}\n\n`;
if (ci.checks?.length) {
  report += '| Check | Status | Conclusion |\n|---|---|---|\n';
  ci.checks.forEach((c) => { report += `| ${c.name} | ${c.status} | ${c.conclusion} |\n`; });
  report += '\n';
}

report += '### Local Build Verification\n\n';
report += `| App | Status | Notes |\n|---|---|---|\n${[
  checkBuild('gs-web', 'pnpm --filter @goldshore/gs-web build'),
  checkBuild('gs-admin', 'pnpm --filter @goldshore/gs-admin build'),
  checkBuild('gs-api', 'pnpm --filter @goldshore/gs-api build'),
  checkBuild('gs-mail', 'pnpm --filter @goldshore/gs-mail build')
].join('\n')}\n\n`;

if (appLevelIssues.length) {
  report += '## 4. App-Level Repairs Required\n\n';
  report += `Failures detected in: ${appLevelIssues.join(', ')}.\n`;
  report += '**Guidance:** You may fix these inside `apps/*`. Do not modify `.github/`, `infra/`, or root scripts.\n\n';
} else {
  report += '## 4. App-Level Repairs\n\n✅ No app-level repairs needed.\n\n';
}

report += '## 5. Recommendations\n\n';
if (!violations.length && !appLevelIssues.length) {
  report += '### ✅ Clean State\n\n';
  report += '**Stop Condition Status:**\n';
  report += 'If this state persists for 48 consecutive hours (4 checks), recommend terminating recurring stabilization sync.\n';
} else {
  report += '### ❌ Actions Required\n\n';
  violations.forEach((v) => { report += `- ${v}\n`; });
  report += '\n**Do not self-fix. Escalate governance violations.**\n';
  report += '**App-level repairs (types, imports) are permitted in apps/* only.**\n';
}

if (!fs.existsSync(path.dirname(REPORT_PATH))) fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, report);
console.log(`Report generated at ${REPORT_PATH}`);
process.exit(violations.length || appLevelIssues.length ? 1 : 0);
