import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// --- Configuration Constants ---
const REPORT_PATH = 'docs/ci/CURRENT_STATE.md';
const APPS_DIR = 'apps';
const WORKFLOW_DIR = '.github/workflows';
const AUTHORITATIVE_CI_SOURCE = 'GitHub Actions status checks on the pull request';

const ALLOWED_APPS = [
  'gs-web', 'gs-admin', 'gs-api', 'gs-mail', 'gs-gateway', 'gs-agent', 'gs-control',
];

const BASELINE_BUILD_SCRIPTS = [
  'dev', 'build', 'build:openapi', 'lint', 'test', 'check:pages', 'scan:pii',
  'check:docs-consistency', 'check:naming', 'validate:structure', 'validate:names',
  'validate:workers', 'validate:workspace', 'validate', 'branch:bootstrap',
  'scaffold:worker', 'workspaces:list', 'verify:workspace-filters',
];

const KNOWN_WORKFLOWS = [
  'archive-path-guard.yml', 'canonical-structure-check.yml', 'deploy-gs-admin.yml',
  'deploy-gs-agent.yml.disabled', 'deploy-gs-api.yml', 'deploy-gs-control.yml.disabled',
  'deploy-gs-gateway.yml.disabled', 'deploy-gs-mail.yml', 'deploy-gs-web.yml',
  'jules-nightly.yml', 'lockfile-guard.yml', 'manual.yml', 'naming-guard.yml',
  'naming-lint.yml', 'neuralegion.yml', 'palette-manual.yml', 'pii-scan.yml',
  'preview-gs-agent.yml', 'preview-gs-admin.yml', 'preview-gs-api.yml',
  'preview-gs-gateway.yml', 'preview-gs-web.yml', 'route-collision-check.yml',
  'sonarcloud.yml', 'summary.yml', 'tfsec.yml', 'stabilization-task.yml',
];

const ALLOWED_ACTIONS = [
  'actions/checkout', 'actions/setup-node', 'actions/upload-artifact',
  'aquasecurity/tfsec-sarif-action', 'cloudflare/pages-action',
  'github/codeql-action/upload-sarif', 'pnpm/action-setup',
  'stefanzweifel/git-auto-commit-action', 'NeuraLegion/run-scan',
  'SonarSource/sonarcloud-github-action', 'actions/ai-inference',
];

// --- State Tracking ---
const governanceViolations = [];
const appLevelIssues = [];

// --- Utilities ---
const run = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
const tryRun = (cmd) => { try { return run(cmd); } catch { return null; } };
const gitRefExists = (ref) => {
  try { execSync(`git rev-parse --verify ${ref}`, { stdio: 'ignore' }); return true; } 
  catch { return false; }
};

function resolveBaseRef() {
  if (gitRefExists('origin/main')) return 'origin/main';
  if (gitRefExists('main')) return 'main';
  return null;
}

function getBranchInfo() {
  const branch = run('git rev-parse --abbrev-ref HEAD');
  const baseRef = resolveBaseRef();
  if (!baseRef) {
    return {
      branch,
      baseRef: 'main (unavailable)',
      behind: 0,
      ahead: 0,
      divergenceNote: '⚠️ Could not resolve main tracking ref; divergence defaults to 0/0.',
    };
  }
  const [behindRaw, aheadRaw] = run(`git rev-list --left-right --count ${baseRef}...HEAD`).split(/\s+/);
  return { branch, baseRef, behind: parseInt(behindRaw, 10), ahead: parseInt(aheadRaw, 10) };
}

function getCiStatus(branch) {
  if (!tryRun('gh --version')) return { summary: '⚠️ gh CLI unavailable.' };

  const prNumberFromRef = process.env.GITHUB_REF?.startsWith('refs/pull/')
  const prNumber = process.env.GITHUB_REF?.startsWith('refs/pull/')
    ? process.env.GITHUB_REF.split('/')[2]
    : tryRun(`gh pr list --head "${branch}" --state open --limit 1 --json number --jq '.[0].number'`);

  if (prNumber) {
    const rollupRaw = tryRun(
      `gh pr view ${prNumber} --json number,url,statusCheckRollup`,
    );
    if (!rollupRaw)
      return {
        summary: `⚠️ Unable to fetch status checks for PR #${prNumber}; authoritative CI source: ${AUTHORITATIVE_CI_SOURCE}`,
      };

    const pr = JSON.parse(rollupRaw);
    const checks = (pr.statusCheckRollup || []).map((item) => {
      if (item.__typename === 'CheckRun') {
        return {
          name: item.name,
          status: item.status,
          conclusion: item.conclusion,
        };
      }
      return {
        name: item.context,
        status: item.state === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED',
        conclusion: item.state === 'SUCCESS' ? 'SUCCESS' : item.state,
      };
    });

    const failed = checks.filter((c) =>
      ['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED'].includes(
        c.conclusion,
      ),
    );
    const pending = checks.filter((c) => c.status !== 'COMPLETED');
    const state = failed.length
      ? '❌ FAIL'
      : pending.length
        ? '🟡 PENDING'
        : '✅ PASS';
    return {
      summary: `${state} PR #${pr.number} checks (${checks.length} total). [PR Link](${pr.url})`,
      checks,
    };
  } else {
    const commitSha = run('git rev-parse HEAD');
    const runsRaw = tryRun(
      `gh run list --limit 20 --json headSha,conclusion,name,url,status`,
    );
    if (!runsRaw)
      return { summary: `⚠️ Unable to fetch runs for commit ${commitSha}.` };

    const allRuns = JSON.parse(runsRaw);
    const commitRuns = allRuns.filter((r) => r.headSha === commitSha);

    if (commitRuns.length === 0) {
      return { summary: `⚠️ No CI runs found for commit ${commitSha}.` };
    }

    const checks = commitRuns.map((r) => ({
      name: r.name,
      status: r.status,
      conclusion: r.conclusion,
    const prData = tryRun(`gh pr view ${prNumber} --json number,url,statusCheckRollup`);
    if (!prData) return { summary: `⚠️ Unable to fetch checks for PR #${prNumber}.` };

    const pr = JSON.parse(prData);
    const checks = (pr.statusCheckRollup || []).map(item => ({
      name: item.name || item.context,
      status: item.status || (item.state === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED'),
      conclusion: item.conclusion || (item.state === 'SUCCESS' ? 'SUCCESS' : item.state),
    }));

    const hasFailed = checks.some(c => ['FAILURE', 'TIMED_OUT', 'CANCELLED'].includes(c.conclusion));
    const state = hasFailed ? '❌ FAIL' : checks.every(c => c.status === 'COMPLETED') ? '✅ PASS' : '🟡 PENDING';
    return { summary: `${state} PR #${pr.number} checks. [Link](${pr.url})`, checks };
  }
  return { summary: '⚠️ No active PR found for this branch; skipping detailed check rollup.' };
}

function checkBranchDiscipline() {
  if (!tryRun('gh --version')) return [];
  const violations = [];

  const openPrsRaw = tryRun(
    `gh pr list --state open --json number,baseRefName,headRefName,autoMergeRequest,url`,
  );
  if (openPrsRaw) {
    const openPrs = JSON.parse(openPrsRaw);

    openPrs.forEach((pr) => {
      if (pr.baseRefName !== 'main') {
        violations.push(
          `PR #${pr.number} targets '${pr.baseRefName}' (not 'main'). Stacked PRs on codex/* branches are discouraged.`,
        );
      }

      if (pr.autoMergeRequest) {
        violations.push(
          `PR #${pr.number} has auto-merge enabled. Auto-merge on unstable PRs is discouraged.`,
        );
      }
  const discViolations = [];
  const openPrsRaw = tryRun(`gh pr list --state open --json number,baseRefName,autoMergeRequest`);
  if (openPrsRaw) {
    JSON.parse(openPrsRaw).forEach(pr => {
      if (pr.baseRefName !== 'main') discViolations.push(`PR #${pr.number} targets '${pr.baseRefName}' (not 'main').`);
      if (pr.autoMergeRequest) discViolations.push(`PR #${pr.number} has auto-merge enabled (discouraged).`);
    });
  }
  return discViolations;
}

function checkBuild(name, command) {
  try {
    execSync(command, { stdio: 'ignore' });
    return `| **${name}** | ✅ PASS | |`;
  } catch {
    appLevelIssues.push(`${name} build failed`);
    return `| **${name}** | ❌ FAIL | Check logs |`;
  }
}

// --- Report Generation ---
const { branch, baseRef, behind, ahead, divergenceNote } = getBranchInfo();
let report = `# Stabilization Sync Check Report\n\n**Date:** ${new Date().toUTCString()}\n\n`;

// Section 1: Governance
report += '## 1. Governance Compliance Check\n\n';

try {
  const apps = fs
    .readdirSync(APPS_DIR)
    .filter((f) => fs.statSync(path.join(APPS_DIR, f)).isDirectory());
  const forbiddenApps = apps.filter((app) => !ALLOWED_APPS.includes(app));
  if (forbiddenApps.length) {
    governanceViolations.push(`Forbidden directories detected in apps/: ${forbiddenApps.join(', ')}`);
  }
} catch (e) {
  governanceViolations.push(`Could not scan apps directory: ${e.message}`);
}

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newScripts = Object.keys(pkg.scripts || {}).filter(
    (s) => !BASELINE_BUILD_SCRIPTS.includes(s),
  );
  if (newScripts.length) {
    governanceViolations.push(`New scripts detected in root package.json: ${newScripts.join(', ')}`);
  }
} catch (e) {
  governanceViolations.push(`Could not parse root package.json: ${e.message}`);
}

try {
  const workflows = fs.readdirSync(WORKFLOW_DIR);
  const newWorkflows = workflows.filter((w) => !KNOWN_WORKFLOWS.includes(w));
  if (newWorkflows.length) {
    governanceViolations.push(`New workflows detected: ${newWorkflows.join(', ')}`);
  }

  const unauthorizedActions = [];
  const unpinnedActions = [];
  const duplicateKeys = [];

  workflows
    .filter((w) => w.endsWith('.yml') || w.endsWith('.yaml'))
    .forEach((w) => {
      try {
        const content = fs.readFileSync(path.join(WORKFLOW_DIR, w), 'utf8');
        const lines = content.split('\n');

        let lastIndent = -1;
        let lastKey = '';

        lines.forEach((line, idx) => {
          if (!line.trim() || line.trim().startsWith('#')) return;

          const match = line.match(/^(\s*)([a-zA-Z0-9_-]+):/);
          if (match) {
            const indent = match[1].length;
            const key = match[2];

            if (indent === lastIndent && key === lastKey) {
              duplicateKeys.push(
                `Duplicate key '${key}' in ${w} around line ${idx + 1}`,
              );
            }
            lastIndent = indent;
            lastKey = key;
          } else if (line.trim().startsWith('-')) {
            lastIndent = -1;
            lastKey = '';
          } else {
            lastIndent = -1;
            lastKey = '';
          }

          const usesMatch = line.match(/uses:\s*([\"']?)([^\"'\s#]+)\1/);
          if (usesMatch) {
            let actionRef = usesMatch[2];
            if (actionRef.startsWith('./') || actionRef.startsWith('docker://'))
              return;

            const [actionName, version] = actionRef.split('@');

            if (!ALLOWED_ACTIONS.includes(actionName)) {
              unauthorizedActions.push(`${actionName} (in ${w})`);
            }

            const isSha = version && /^[0-9a-f]{40}$/.test(version);
            if (!isSha) {
              unpinnedActions.push(
                `${actionName} is unpinned (uses @${version}) in ${w}`,
              );
            }
          }
        });
      } catch (e) {
        governanceViolations.push(`Error scanning workflow ${w}: ${e.message}`);
      }
    });

  const uniqueUnauthorized = [...new Set(unauthorizedActions)];
  if (uniqueUnauthorized.length) {
    governanceViolations.push(`Unauthorized CI Actions detected: ${uniqueUnauthorized.join(', ')}`);
  }

  const uniqueUnpinned = [...new Set(unpinnedActions)];
  if (uniqueUnpinned.length) {
    governanceViolations.push(`Unpinned CI Actions detected (must use SHA): ${uniqueUnpinned.join(', ')}`);
  }

  const uniqueDuplicates = [...new Set(duplicateKeys)];
  if (uniqueDuplicates.length) {
    governanceViolations.push(`YAML syntax errors (duplicate keys) detected: ${uniqueDuplicates.join(', ')}`);
  }
} catch (e) {
  governanceViolations.push(`Could not scan workflows: ${e.message}`);
}
const apps = fs.readdirSync(APPS_DIR).filter(f => fs.statSync(path.join(APPS_DIR, f)).isDirectory());
apps.filter(a => !ALLOWED_APPS.includes(a)).forEach(a => governanceViolations.push(`Forbidden app directory: ${a}`));

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
Object.keys(pkg.scripts || {}).filter(s => !BASELINE_BUILD_SCRIPTS.includes(s))
  .forEach(s => governanceViolations.push(`Unauthorized root script: ${s}`));

const workflows = fs.readdirSync(WORKFLOW_DIR);
workflows.filter(w => !KNOWN_WORKFLOWS.includes(w)).forEach(w => governanceViolations.push(`Unknown workflow file: ${w}`));

// Deep scan workflows for unpinned/unauthorized actions
workflows.filter(w => w.endsWith('.yml')).forEach(w => {
  const content = fs.readFileSync(path.join(WORKFLOW_DIR, w), 'utf8');
  const actionMatches = content.matchAll(/uses:\s*([\w\-\/]+)@([\w\.]+)/g);
  for (const match of actionMatches) {
    const [_, action, version] = match;
    if (!ALLOWED_ACTIONS.includes(action)) governanceViolations.push(`Unauthorized Action: ${action} in ${w}`);
    if (!/^[0-9a-f]{40}$/.test(version)) governanceViolations.push(`Unpinned Action: ${action}@${version} in ${w} (use SHA)`);
  }
});

if (governanceViolations.length) {
  report += '### ❌ Violations Detected\n';
  governanceViolations.forEach(v => report += `- ${v}\n`);
  report += '\n**Action:** Do not self-fix. Escalate via comment only.\n\n';
} else {
  report += '✅ No governance violations detected.\n\n';
}

// Section 2: Branch Discipline
report += `## 2. Branch Discipline Check\n\n**Branch:** ${branch} | **Divergence:** -${behind} / +${ahead}\n\n`;
if (divergenceNote) report += `${divergenceNote}\n\n`;
const branchViolations = checkBranchDiscipline();
branchViolations.forEach(v => report += `- ${v}\n`);

// Section 3: CI Status
report += '## 3. CI State Snapshot\n\n' + getCiStatus(branch).summary + '\n\n';
report += '### Local Build Verification\n\n| App | Status | Notes |\n|---|---|---|\n';
['gs-web', 'gs-admin', 'gs-api', 'gs-mail'].forEach(app => {
  report += checkBuild(app, `pnpm --filter @goldshore/${app} build`) + '\n';
});

// Section 4 & 5: Repairs & Recommendations
report += `\n## 4. App-Level Repairs\n\n${appLevelIssues.length ? '❌ Failures: ' + appLevelIssues.join(', ') : '✅ None required.'}\n\n`;
report += '## 5. Recommendations\n\n';
if (governanceViolations.length || appLevelIssues.length || branchViolations.length) {
  report += '### ❌ Actions Required\n- Fix app-level build issues in `apps/*`.\n- Escalate governance violations.\n';
} else {
  report += '### ✅ Clean State\nNo immediate actions required.\n';
}

report += `## 5. Recommendations\n\n`;

if (
  governanceViolations.length === 0 &&
  appLevelIssues.length === 0 &&
  branchDisciplineViolations.length === 0
) {
  report += `### ✅ Clean State\n\n`;
} else {
  report += '### ❌ Actions Required\n\n';
  governanceViolations.forEach((v) => {
    report += `- ${v}\n`;
  });
  appLevelIssues.forEach((v) => {
    report += `- ${v}\n`;
  });
  branchDisciplineViolations.forEach((v) => {
    report += `- ${v}\n`;
  });

  report += '\n**Do not self-fix.** Escalate governance violations.\n';
  report +=
    '**App-level repairs (types, imports) are permitted in `apps/*` only.**\n';
}

report += `\n**Stop Condition:**\n`;
report += `If CI is green across all required checks for 48 consecutive hours and no branch divergence >5 commits exists, recommend terminating recurring stabilization sync.\n`;

if (!fs.existsSync(path.dirname(REPORT_PATH)))
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, report);
console.log(`Report generated at ${REPORT_PATH}`);

// Finalize
if (!fs.existsSync(path.dirname(REPORT_PATH))) fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, report);
console.log(`Report successfully generated at ${REPORT_PATH}`);
process.exit(0);
