import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const REPORT_PATH = 'docs/ci/CURRENT_STATE.md';
const APPS_DIR = 'apps';
const ALLOWED_APPS = [
  'gs-web',
  'gs-admin',
  'gs-api',
  'gs-mail',
  'gs-gateway',
  'gs-agent',
  'gs-control'
];

// Current build scripts in root package.json for baseline check
const BASELINE_BUILD_SCRIPTS = [
  'build',
  'build:openapi',
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

let report = `# Stabilization Sync Check Report\n\n**Date:** ${new Date().toUTCString()}\n\n`;
let violations = [];

// 1. Governance Compliance Check
report += `## 1. Governance Compliance Check\n\n`;

// 1.1 App Directory Structure
const apps = fs.readdirSync(APPS_DIR).filter(f => fs.statSync(path.join(APPS_DIR, f)).isDirectory());
const forbiddenApps = apps.filter(app => !ALLOWED_APPS.includes(app));

if (forbiddenApps.length > 0) {
  const msg = `Forbidden directories detected in apps/: ${forbiddenApps.join(', ')}`;
  violations.push(msg);
  report += `### ❌ App Structure Violation:\n- ${msg}\n\n`;
} else {
  report += `✅ Directory structure compliant.\n\n`;
}

// 1.2 Root package.json Build Keys
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const currentScripts = Object.keys(pkg.scripts || {});
  const newScripts = currentScripts.filter(s => !BASELINE_BUILD_SCRIPTS.includes(s) && s !== 'dev' && s !== 'lint' && s !== 'test');

  if (newScripts.length > 0) {
     const msg = `New scripts detected in root package.json: ${newScripts.join(', ')}`;
     violations.push(msg);
     report += `### ❌ Build Script Violation:\n- ${msg}\n\n`;
  } else {
    report += `✅ Root build scripts compliant.\n\n`;
  }
} catch (e) {
  report += `⚠️ Could not parse root package.json: ${e.message}\n\n`;
}

// 1.3 Workflow Modifications (New files check)
const WORKFLOW_DIR = '.github/workflows';
// List of known authorized workflows (simplified for this check)
const KNOWN_WORKFLOWS = [
  'deploy-gs-admin.yml', 'deploy-gs-agent.yml', 'deploy-gs-api.yml', 'deploy-gs-control.yml',
  'deploy-gs-gateway.yml', 'deploy-gs-mail.yml', 'deploy-gs-web.yml', 'jules-nightly.yml',
  'lockfile-guard.yml', 'manual.yml', 'naming-guard.yml', 'naming-lint.yml', 'neuralegion.yml',
  'palette-manual.yml', 'pii-scan.yml', 'preview-agent.yml', 'preview-gs-admin.yml',
  'preview-gs-api.yml', 'preview-gs-gateway.yml', 'preview-gs-web.yml', 'route-collision-check.yml',
  'sonarcloud.yml', 'summary.yml', 'tfsec.yml', 'stabilization-task.yml'
];

try {
  const workflows = fs.readdirSync(WORKFLOW_DIR);
  const newWorkflows = workflows.filter(w => !KNOWN_WORKFLOWS.includes(w));
  if (newWorkflows.length > 0) {
    const msg = `New workflows detected: ${newWorkflows.join(', ')}`;
    violations.push(msg);
    report += `### ❌ Workflow Violation:\n- ${msg}\n\n`;
  } else {
    report += `✅ Workflow files compliant.\n\n`;
  }
} catch (e) {
  report += `⚠️ Could not scan workflows: ${e.message}\n\n`;
}


// 2. Branch Discipline Check
report += `## 2. Branch Discipline Check\n\n`;
try {
  // Try to check branch status if git is available
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  report += `**Current Branch:** ${branch}\n\n`;

  if (branch === 'main') {
      report += `✅ Running on main.\n\n`;
  } else {
      // Check behind/ahead
      try {
        const counts = execSync('git rev-list --left-right --count origin/main...HEAD', { encoding: 'utf8' }).trim();
        const [behind, ahead] = counts.split('\t');
        report += `**Divergence:** Behind: ${behind}, Ahead: ${ahead}\n\n`;
        if (parseInt(ahead) > 5) {
             const msg = `Branch is ahead of main by >5 commits (${ahead})`;
             violations.push(msg);
             report += `❌ **High Divergence Detected:** ${msg}\n\n`;
        }
      } catch (e) {
         report += `⚠️ Could not verify divergence (fetch depth might be shallow).\n\n`;
      }
  }
} catch (e) {
  report += `⚠️ Git checks failed: ${e.message}\n\n`;
}

// 3. CI State Snapshot (Simulated via build checks)
report += `## 3. CI State Snapshot\n\n`;

const buildStatus = [];

function checkBuild(name, command) {
  console.log(`Checking ${name} build...`);
  try {
    // Inherit stdio so logs appear in the runner console for debugging
    execSync(command, { stdio: 'inherit' });
    return `| **${name}** | ✅ PASS | |`;
  } catch (e) {
    violations.push(`${name} build failed`);
    return `| **${name}** | ❌ FAIL | Check run logs |`;
  }
}

buildStatus.push(checkBuild('gs-web', 'pnpm --filter @goldshore/gs-web build'));
buildStatus.push(checkBuild('gs-admin', 'pnpm --filter @goldshore/gs-admin build'));
buildStatus.push(checkBuild('gs-api', 'pnpm --filter @goldshore/gs-api build'));
buildStatus.push(checkBuild('gs-mail', 'pnpm --filter @goldshore/gs-mail build'));

report += `| App | Status | Notes |\n|---|---|---|\n${buildStatus.join('\n')}\n\n`;

// 4. Recommendations & Stop Condition
report += `## 4. Recommendations\n\n`;

if (violations.length === 0) {
  report += `### ✅ Clean State\n\n`;
  report += `**Stop Condition Status:**\n`;
  report += `If this state persists for 48 consecutive hours (4 checks), recommend terminating recurring stabilization sync.\n`;
} else {
  report += `### ❌ Actions Required\n\n`;
  violations.forEach(v => report += `- ${v}\n`);
  report += `\n**Do not self-fix. Escalate governance violations.**\n`;
}

// Write Report
fs.writeFileSync(REPORT_PATH, report);
console.log(`Report generated at ${REPORT_PATH}`);

if (violations.length > 0) {
  console.error('Stabilization check failed with violations.');
  process.exit(1);
}
