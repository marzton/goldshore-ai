import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const REPORT_PATH = 'docs/ci/CURRENT_STATE.md';
const APPS_DIR = 'apps';
const WORKFLOW_DIR = '.github/workflows';
const AUTHORITATIVE_CI_SOURCE = 'GitHub Actions status checks on the pull request';
const ALLOWED_APPS = [
  'gs-web',
  'gs-admin',
  'gs-api',
  'gs-mail',
  'gs-gateway',
  'gs-agent',
  'gs-control'
];

const BASELINE_BUILD_SCRIPTS = [
  'dev',
  'build',
  'build:openapi',
  'lint',
  'test',
  'check:pages',
  'scan:pii',
  'check:docs-consistency',
  'check:naming',
  'validate:structure',
  'validate:names',
  'validate:workers',
  'validate:workspace',
  'validate',
  'branch:bootstrap',
  'scaffold:worker',
  'workspaces:list',
  'verify:workspace-filters'
];

const KNOWN_WORKFLOWS = [
  'archive-path-guard.yml', 'canonical-structure-check.yml',
  'deploy-gs-admin.yml', 'deploy-gs-agent.yml.disabled', 'deploy-gs-api.yml', 'deploy-gs-control.yml.disabled',
  'deploy-gs-gateway.yml.disabled', 'deploy-gs-mail.yml', 'deploy-gs-web.yml', 'jules-nightly.yml',
  'lockfile-guard.yml', 'manual.yml', 'naming-guard.yml', 'naming-lint.yml', 'neuralegion.yml',
  'palette-manual.yml', 'pii-scan.yml', 'preview-gs-agent.yml', 'preview-gs-admin.yml',
  'preview-gs-api.yml', 'preview-gs-gateway.yml', 'preview-gs-web.yml', 'route-collision-check.yml',
  'sonarcloud.yml', 'summary.yml', 'tfsec.yml', 'stabilization-task.yml'
];

const ALLOWED_ACTIONS = [
  'actions/checkout',
  'actions/setup-node',
  'actions/upload-artifact',
  'aquasecurity/tfsec-sarif-action',
  'cloudflare/pages-action',
  'github/codeql-action/upload-sarif',
  'pnpm/action-setup',
  'stefanzweifel/git-auto-commit-action',
  'NeuraLegion/run-scan',
  'SonarSource/sonarcloud-github-action',
  'actions/ai-inference'
];

const violations = [];
const appLevelIssues = [];
const governanceViolations = [];

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

function getCiStatus(branch) {
  if (!tryRun('gh --version')) return { summary: '⚠️ gh CLI unavailable; unable to resolve CI status in this environment.' };

  // 1. Try to find PR for current branch
  const prNumberFromRef = process.env.GITHUB_REF?.startsWith('refs/pull/') ? process.env.GITHUB_REF.split('/')[2] : null;
  const prNumber = prNumberFromRef ?? tryRun(`gh pr list --head "${branch}" --state open --limit 1 --json number --jq '.[0].number'`);

  if (prNumber) {
    const rollupRaw = tryRun(`gh pr view ${prNumber} --json number,url,statusCheckRollup`);
    if (!rollupRaw) return { summary: `⚠️ Unable to fetch status checks for PR #${prNumber}; authoritative CI source: ${AUTHORITATIVE_CI_SOURCE}` };

    const pr = JSON.parse(rollupRaw);
    const checks = (pr.statusCheckRollup || []).map((item) => {
      if (item.__typename === 'CheckRun') {
        return {
          name: item.name,
          status: item.status,
          conclusion: item.conclusion
        };
      }
      return {
        name: item.context,
        status: item.state === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED',
        conclusion: item.state === 'SUCCESS' ? 'SUCCESS' : item.state
      };
    });

    const failed = checks.filter((c) => ['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED'].includes(c.conclusion));
    const pending = checks.filter((c) => c.status !== 'COMPLETED');
    const state = failed.length ? '❌ FAIL' : pending.length ? '🟡 PENDING' : '✅ PASS';
    return { summary: `${state} PR #${pr.number} checks (${checks.length} total). [PR Link](${pr.url})`, checks };
  } else {
    // 2. Fallback: Check commit status (e.g. running on main)
    const commitSha = run('git rev-parse HEAD');
    // gh run list --commit is not supported directly in all versions, try checking runs for the commit via api or list
    // A simpler way: gh run list --json headSha,conclusion,name,url
    const runsRaw = tryRun(`gh run list --limit 20 --json headSha,conclusion,name,url,status`);
    if (!runsRaw) return { summary: `⚠️ Unable to fetch runs for commit ${commitSha}.` };

    const allRuns = JSON.parse(runsRaw);
    const commitRuns = allRuns.filter(r => r.headSha === commitSha);

    if (commitRuns.length === 0) {
       return { summary: `⚠️ No CI runs found for commit ${commitSha}.` };
    }

    const checks = commitRuns.map(r => ({
      name: r.name,
      status: r.status,
      conclusion: r.conclusion
    }));

    const failed = checks.filter((c) => ['failure', 'timed_out', 'cancelled', 'action_required'].includes(c.conclusion));
    const pending = checks.filter((c) => c.status !== 'completed');
    const state = failed.length ? '❌ FAIL' : pending.length ? '🟡 PENDING' : '✅ PASS';
     return { summary: `${state} Commit ${commitSha.substring(0,7)} checks (${checks.length} total).`, checks };
  }
}

function checkBranchDiscipline() {
  if (!tryRun('gh --version')) return [];
  const violations = [];

  // Check open PRs for base branch != main (Stacked PRs)
  const openPrsRaw = tryRun(`gh pr list --state open --json number,baseRefName,headRefName,autoMergeRequest,url`);
  if (openPrsRaw) {
    const openPrs = JSON.parse(openPrsRaw);

    openPrs.forEach(pr => {
      // Stacked PR Check
      if (pr.baseRefName !== 'main') {
        violations.push(`PR #${pr.number} targets '${pr.baseRefName}' (not 'main'). Stacked PRs on codex/* branches are discouraged.`);
      }

      // Auto-merge Check
      if (pr.autoMergeRequest) {
        violations.push(`PR #${pr.number} has auto-merge enabled. Auto-merge on unstable PRs is discouraged.`);
      }
    });
  }
  return violations;
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

// Check Apps Structure
try {
  const apps = fs.readdirSync(APPS_DIR).filter((f) => fs.statSync(path.join(APPS_DIR, f)).isDirectory());
  const forbiddenApps = apps.filter((app) => !ALLOWED_APPS.includes(app));
  if (forbiddenApps.length) {
    const msg = `Forbidden directories detected in apps/: ${forbiddenApps.join(', ')}`;
    governanceViolations.push(msg);
    violations.push(msg);
  }
} catch (e) { governanceViolations.push(`Could not scan apps directory: ${e.message}`); }

// Check Root Scripts
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newScripts = Object.keys(pkg.scripts || {}).filter((s) => !BASELINE_BUILD_SCRIPTS.includes(s));
  if (newScripts.length) {
    const msg = `New scripts detected in root package.json: ${newScripts.join(', ')}`;
    governanceViolations.push(msg);
    violations.push(msg);
  }
} catch (e) { governanceViolations.push(`Could not parse root package.json: ${e.message}`); }

// Check Workflows
try {
  const workflows = fs.readdirSync(WORKFLOW_DIR);
  const newWorkflows = workflows.filter((w) => !KNOWN_WORKFLOWS.includes(w));
  if (newWorkflows.length) { const msg = `New workflows detected: ${newWorkflows.join(', ')}`; violations.push(msg); report += `### ❌ Workflow Violation (New Files)\n- ${msg}\n\n`; }
  else report += '✅ Workflow file list compliant.\n\n';

  // Check for unauthorized actions and unpinned SHAs and duplicate keys
  const unauthorizedActions = [];
  const unpinnedActions = [];
  const duplicateKeys = [];

  workflows.filter((w) => w.endsWith('.yml') || w.endsWith('.yaml')).forEach((w) => {
    try {
      const content = fs.readFileSync(path.join(WORKFLOW_DIR, w), 'utf8');
      const lines = content.split('\n');

      // Duplicate Key Heuristic
      let lastIndent = -1;
      let lastKey = '';

      lines.forEach((line, idx) => {
        if (!line.trim() || line.trim().startsWith('#')) return;

        // Check for key pattern "  key:" (no dash)
        const match = line.match(/^(\s*)([a-zA-Z0-9_-]+):/);
        if (match) {
          const indent = match[1].length;
          const key = match[2];

          if (indent === lastIndent && key === lastKey) {
             duplicateKeys.push(`Duplicate key '${key}' in ${w} around line ${idx + 1}`);
          }
          lastIndent = indent;
          lastKey = key;
        } else if (line.trim().startsWith('-')) {
          // List item resets simple heuristic
          lastIndent = -1;
          lastKey = '';
        } else {
          // Other content resets
          lastIndent = -1;
          lastKey = '';
        }

        // Check for actions
        const usesMatch = line.match(/uses:\s*([\"']?)([^\"'\s#]+)\1/);
        if (usesMatch) {
          let actionRef = usesMatch[2];
          if (actionRef.startsWith('./') || actionRef.startsWith('docker://')) return;

          const [actionName, version] = actionRef.split('@');

          if (!ALLOWED_ACTIONS.includes(actionName)) {
            unauthorizedActions.push(`${actionName} (in ${w})`);
          }

          // Check for unpinned SHA (must be 40 hex chars)
          const isSha = version && /^[0-9a-f]{40}$/.test(version);
          if (!isSha) {
             unpinnedActions.push(`${actionName} is unpinned (uses @${version}) in ${w}`);
          }
        }
      });

    } catch (e) {
      governanceViolations.push(`Error scanning workflow ${w}: ${e.message}`);
    }
  });

  const uniqueUnauthorized = [...new Set(unauthorizedActions)];
  if (uniqueUnauthorized.length) {
    const msg = `Unauthorized CI Actions detected: ${uniqueUnauthorized.join(', ')}`;
    governanceViolations.push(msg);
    violations.push(msg);
  }

  const uniqueUnpinned = [...new Set(unpinnedActions)];
  if (uniqueUnpinned.length) {
    const msg = `Unpinned CI Actions detected (must use SHA): ${uniqueUnpinned.join(', ')}`;
    governanceViolations.push(msg);
    violations.push(msg);
  }

  const uniqueDuplicates = [...new Set(duplicateKeys)];
  if (uniqueDuplicates.length) {
    const msg = `YAML syntax errors (duplicate keys) detected: ${uniqueDuplicates.join(', ')}`;
    governanceViolations.push(msg);
    violations.push(msg);
  }

} catch (e) {
  governanceViolations.push(`Could not scan workflows: ${e.message}`);
}

if (governanceViolations.length) {
  report += '### ❌ Violations Detected\n';
  governanceViolations.forEach(v => report += `- ${v}\n`);
  report += '\n**Action:** Document in `docs/ci/CURRENT_STATE.md`. Do not self-fix. Escalate via comment only.\n\n';
} else {
  report += '✅ No governance violations detected (Structure, Scripts, Workflows).\n\n';
}

report += '## 2. Branch Discipline Check\n\n';
report += `**Current Branch:** ${branch}\n\n`;
report += `**Divergence vs ${baseRef}:** Behind: ${behind}, Ahead: ${ahead}\n\n`;
if (divergenceNote) report += `${divergenceNote}\n\n`;
if (ahead > 5) report += `⚠️ **High Divergence Detected:** Branch is ahead of main by >5 commits (${ahead}).\n\n`;

const branchDisciplineViolations = checkBranchDiscipline();
if (branchDisciplineViolations.length) {
  report += '### ❌ Branch Discipline Violations\n';
  branchDisciplineViolations.forEach(v => report += `- ${v}\n`);
  report += '\n';
} else {
  report += '✅ No stacked PRs or auto-merge violations detected on open PRs.\n\n';
}

report += '## 3. CI State Snapshot\n\n';
const ci = getCiStatus(branch);
report += `${ci.summary}\n\n`;
if (ci.checks?.length) {
  report += '| Check | Status | Conclusion |\n|---|---|---|\n';
  ci.checks.forEach((c) => { report += `| ${c.name} | ${c.status} | ${c.conclusion || '-'} |\n`; });
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
  report += '**Guidance:** You may fix these inside `apps/*`. **Do not modify** `.github/`, `infra/`, or root scripts.\n\n';
} else {
  report += '## 4. App-Level Repairs\n\n✅ No app-level repairs needed.\n\n';
}

// 5. Recommendations & Stop Condition
report += `## 5. Recommendations\n\n`;

if (violations.length === 0 && appLevelIssues.length === 0 && branchDisciplineViolations.length === 0) {
  report += `### ✅ Clean State\n\n`;
} else {
  report += '### ❌ Actions Required\n\n';
  violations.forEach((v) => { report += `- ${v}\n`; });
  appLevelIssues.forEach((v) => { report += `- ${v}\n`; });
  branchDisciplineViolations.forEach((v) => { report += `- ${v}\n`; });

  report += '\n**Do not self-fix.** Escalate governance violations.\n';
  report += '**App-level repairs (types, imports) are permitted in `apps/*` only.**\n';
}

report += `\n**Stop Condition:**\n`;
report += `If CI is green across all required checks for 48 consecutive hours and no branch divergence >5 commits exists, recommend terminating recurring stabilization sync.\n`;

// Ensure directory exists
if (!fs.existsSync(path.dirname(REPORT_PATH))) fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, report);
console.log(`Report generated at ${REPORT_PATH}`);

// Exit non-zero if issues found, to flag in CI log (but maybe we want to commit the report anyway, so exit 0?)
// The user says "Do not self-fix. Escalate via comment only."
// But in a workflow, if we exit 1, the workflow fails.
// We want the workflow to succeed in *running* and *reporting*.
// So we exit 0, but the report contains the failures.
process.exit(0);
