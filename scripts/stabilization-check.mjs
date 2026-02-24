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
  'verify:workspace-filters',
  'verify:web-dist',
  'memory:check'
];

const KNOWN_WORKFLOWS = [
  'canonical-structure-check.yml',
  'deploy-gs-admin.yml',
  'deploy-gs-agent.yml.disabled',
  'deploy-gs-api.yml',
  'deploy-gs-control.yml.disabled',
  'deploy-gs-gateway.yml.disabled',
  'deploy-gs-mail.yml',
  'deploy-gs-web.yml',
  'jules-nightly.yml',
  'lockfile-guard.yml',
  'manual.yml',
  'naming-guard.yml',
  'naming-lint.yml',
  'neuralegion.yml',
  'palette-manual.yml',
  'pii-scan.yml',
  'preview-gs-admin.yml',
  'preview-gs-agent.yml',
  'preview-gs-api.yml',
  'preview-gs-gateway.yml',
  'preview-gs-web.yml',
  'route-collision-check.yml',
  'sonarcloud.yml',
  'stabilization-task.yml',
  'summary.yml',
  'tfsec.yml'
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

const run = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
const tryRun = (cmd) => { try { return run(cmd); } catch { return null; } };
const gitRefExists = (ref) => { try { execSync(`git rev-parse --verify ${ref}`, { stdio: 'ignore' }); return true; } catch { return false; } };

function resolveBaseRef() {
  if (gitRefExists('origin/main')) return 'origin/main';
  if (gitRefExists('main')) return 'main';
  return null;
}

function getBranchInfo() {
  const branch = tryRun('git rev-parse --abbrev-ref HEAD') || 'unknown';
  const baseRef = resolveBaseRef();
  if (!baseRef) {
    return { branch, baseRef: 'main (unavailable locally)', behind: 0, ahead: 0, divergenceNote: '⚠️ Could not resolve a local main tracking ref; divergence defaults to 0/0 in this checkout.' };
  }
  const [behindRaw, aheadRaw] = (tryRun(`git rev-list --left-right --count ${baseRef}...HEAD`) || '0 0').split(/\s+/);
  return { branch, baseRef, behind: Number.parseInt(behindRaw, 10), ahead: Number.parseInt(aheadRaw, 10) };
}

function getPrCiStatus(branch) {
  if (!tryRun('gh --version')) return { summary: '⚠️ gh CLI unavailable; unable to resolve PR CI status in this environment.' };

  // Try to find PR associated with current branch
  const prNumber = tryRun(`gh pr list --head "${branch}" --state open --limit 1 --json number --jq '.[0].number'`);
  if (!prNumber) return { summary: `⚠️ No open PR detected for branch \`${branch}\`; authoritative CI source: ${AUTHORITATIVE_CI_SOURCE}` };

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
}

function checkBuild(name, command) {
  try {
    execSync(command, { stdio: 'ignore' });
    return `| **${name}** | ✅ PASS | |`;
  } catch {
    appLevelIssues.push(`${name} build failed`);
    return `| **${name}** | ❌ FAIL | Check run logs |`;
  }
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

// 1. Governance Compliance Check
report += '## 1. Governance Compliance Check\n\n';
let governanceViolations = [];

try {
  const apps = fs.readdirSync(APPS_DIR).filter((f) => fs.statSync(path.join(APPS_DIR, f)).isDirectory());
  const forbiddenApps = apps.filter((app) => !ALLOWED_APPS.includes(app));
  if (forbiddenApps.length) {
    const msg = `Forbidden directories detected in apps/: ${forbiddenApps.join(', ')}`;
    governanceViolations.push(msg);
    violations.push(msg);
  }
} catch (e) {
  governanceViolations.push(`Could not scan apps directory: ${e.message}`);
}

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newScripts = Object.keys(pkg.scripts || {}).filter((s) => !BASELINE_BUILD_SCRIPTS.includes(s));
  if (newScripts.length) {
    const msg = `New scripts detected in root package.json: ${newScripts.join(', ')}`;
    governanceViolations.push(msg);
    violations.push(msg);
  }
} catch (e) {
  governanceViolations.push(`Could not parse root package.json: ${e.message}`);
}

try {
  const workflows = fs.readdirSync(WORKFLOW_DIR);
  const newWorkflows = workflows.filter((w) => !KNOWN_WORKFLOWS.includes(w));
  if (newWorkflows.length) {
    const msg = `New workflows detected: ${newWorkflows.join(', ')}`;
    governanceViolations.push(msg);
    violations.push(msg);
  }

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
  report += '\nDocumented in docs/ci/CURRENT_STATE.md. Do not self-fix. Escalate via comment only.\n\n';
} else {
  report += '✅ No governance violations detected.\n\n';
}

// 2. Branch Discipline Check
report += '## 2. Branch Discipline Check\n\n';
report += `**Current Branch:** ${branch}\n`;
report += `**Divergence vs ${baseRef}:** Behind: ${behind}, Ahead: ${ahead}\n\n`;

if (divergenceNote) report += `${divergenceNote}\n\n`;
if (ahead > 5) {
  report += `⚠️ **High Divergence Detected:** Branch is ahead of main by >5 commits (${ahead}).\n`;
  report += `Report branch name: ${branch}. Report behind/ahead counts: ${behind}/${ahead}. Do not create new PR.\n\n`;
} else {
  report += '✅ Branch divergence acceptable.\n\n';
}

// 3. CI State Snapshot
report += '## 3. CI State Snapshot\n\n';
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

// 4. App-Level Repairs Only
report += '## 4. App-Level Repairs Only\n\n';
if (appLevelIssues.length) {
  report += `Failures detected in: ${appLevelIssues.join(', ')}.\n`;
  report += '**Guidance:** You may fix these inside `apps/*`. Do not modify `.github/`, `infra/`, or root scripts.\n\n';
} else {
  report += '✅ No app-level repairs needed.\n\n';
}

// 5. No Expansion Rule
report += '## 5. No Expansion Rule\n\n';
if (violations.length === 0 && appLevelIssues.length === 0) {
  report += '✅ Stabilization check clean. No expansion actions taken.\n\n';
} else {
  report += '⚠️ Violations or issues detected. Focus on stabilization only. Do not add features or optimize pipelines.\n\n';
}

// Stop Condition
report += '## Stop Condition\n\n';
report += 'If CI is green across all required checks for 48 consecutive hours and no branch divergence >5 commits exists, recommend terminating recurring stabilization sync.\n';

if (!fs.existsSync(path.dirname(REPORT_PATH))) fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, report);
console.log(`Report generated at ${REPORT_PATH}`);
process.exit(violations.length || appLevelIssues.length ? 1 : 0);
