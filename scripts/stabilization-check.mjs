import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { parse } from 'yaml';

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
  'preview-agent.yml',
  'preview-gs-admin.yml',
  'preview-gs-api.yml',
  'preview-gs-gateway.yml',
  'preview-gs-web.yml',
  'route-collision-check.yml',
  'sonarcloud.yml',
  'stabilization-task.yml',
  'summary.yml',
  'tfsec.yml'
];

let report = `# Stabilization Sync Check (Recurring)\n\n**Date:** ${new Date().toUTCString()}\n\n`;
let governanceViolations = [];
let appLevelIssues = [];

// 1. Governance Compliance Check
report += `## 1. Governance Compliance Check\n\n`;

// 1.1 App Directory Structure
try {
  const apps = fs.readdirSync(APPS_DIR).filter(f => fs.statSync(path.join(APPS_DIR, f)).isDirectory());
  const forbiddenApps = apps.filter(app => !ALLOWED_APPS.includes(app));

  if (forbiddenApps.length > 0) {
    const msg = `Forbidden directories detected in apps/: ${forbiddenApps.join(', ')}`;
    governanceViolations.push(msg);
    report += `### ❌ App Structure Violation:\n- ${msg}\n\n`;
  } else {
    report += `✅ Directory structure compliant.\n\n`;
  }
} catch (e) {
  report += `⚠️ Could not scan apps directory: ${e.message}\n\n`;
}

// 1.2 Root package.json Build Keys
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const currentScripts = Object.keys(pkg.scripts || {});
  const newScripts = currentScripts.filter(s => !BASELINE_BUILD_SCRIPTS.includes(s));

  if (newScripts.length > 0) {
     const msg = `New scripts detected in root package.json: ${newScripts.join(', ')}`;
     governanceViolations.push(msg);
     report += `### ❌ Build Script Violation:\n- ${msg}\n\n`;
  } else {
    report += `✅ Root build scripts compliant.\n\n`;
  }
} catch (e) {
  report += `⚠️ Could not parse root package.json: ${e.message}\n\n`;
}

// 1.3 Workflow Modifications & Syntax
const WORKFLOW_DIR = '.github/workflows';
try {
  const workflows = fs.readdirSync(WORKFLOW_DIR);
  const newWorkflows = workflows.filter(w => !KNOWN_WORKFLOWS.includes(w));

  if (newWorkflows.length > 0) {
    const msg = `New workflows detected: ${newWorkflows.join(', ')}`;
    governanceViolations.push(msg);
    report += `### ❌ New Workflows Detected:\n- ${msg}\n\n`;
  } else {
    report += `✅ No new workflows detected.\n\n`;
  }

  // Check syntax and duplicates
  let syntaxErrors = [];
  workflows.forEach(w => {
    try {
      const content = fs.readFileSync(path.join(WORKFLOW_DIR, w), 'utf8');

      // Basic parse check using 'yaml' package
      try {
        parse(content);
      } catch (e) {
        syntaxErrors.push(`${w}: ${e.message}`);
      }

      // Check for duplicate keys using a simple regex scan for top-level keys
      const lines = content.split('\n');
      const topLevelKeys = new Set();
      lines.forEach((line, index) => {
        const match = line.match(/^([\w-]+):/);
        if (match) {
          const key = match[1];
          if (topLevelKeys.has(key)) {
             syntaxErrors.push(`${w}: Duplicate top-level key '${key}' at line ${index + 1}`);
          }
          topLevelKeys.add(key);
        }
      });

    } catch (e) {
      syntaxErrors.push(`${w}: Could not read file`);
    }
  });

  if (syntaxErrors.length > 0) {
    const msg = `Workflow syntax errors detected:\n${syntaxErrors.map(e => `- ${e}`).join('\n')}`;
    governanceViolations.push(msg);
    report += `### ❌ Workflow Syntax Errors:\n${syntaxErrors.map(e => `- ${e}`).join('\n')}\n\n`;
  } else {
    report += `✅ Workflow syntax compliant.\n\n`;
  }

} catch (e) {
  report += `⚠️ Could not scan workflows: ${e.message}\n\n`;
}

// 2. Branch Discipline Check
report += `## 2. Branch Discipline Check\n\n`;
try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  report += `**Current Branch:** ${branch}\n\n`;

  if (branch === 'main') {
      report += `✅ Running on main.\n\n`;
  } else {
      try {
        const counts = execSync('git rev-list --left-right --count origin/main...HEAD', { encoding: 'utf8' }).trim();
        const [behind, ahead] = counts.split('\t');
        report += `**Divergence:** Behind: ${behind}, Ahead: ${ahead}\n\n`;
        if (parseInt(ahead) > 5) {
             const msg = `Branch is ahead of main by >5 commits (${ahead})`;
             report += `⚠️ **High Divergence Detected:** ${msg}\n\n`;
        }
      } catch (e) {
         report += `⚠️ Could not verify divergence (fetch depth might be shallow).\n\n`;
      }
  }
} catch (e) {
  report += `⚠️ Git checks failed: ${e.message}\n\n`;
}

// 3. CI State Snapshot
report += `## 3. CI State Snapshot\n\n`;

const buildStatus = [];

function checkBuild(name, command) {
  console.log(`Checking ${name} build...`);
  try {
    execSync(command, { stdio: 'inherit' });
    return `| **${name}** | ✅ PASS | |`;
  } catch (e) {
    appLevelIssues.push(`${name} build failed`);
    return `| **${name}** | ❌ FAIL | Check run logs |`;
  }
}

// Only check core apps for build stability
buildStatus.push(checkBuild('gs-web', 'pnpm --filter @goldshore/gs-web build'));
buildStatus.push(checkBuild('gs-admin', 'pnpm --filter @goldshore/gs-admin build'));
buildStatus.push(checkBuild('gs-api', 'pnpm --filter @goldshore/gs-api build'));
buildStatus.push(checkBuild('gs-mail', 'pnpm --filter @goldshore/gs-mail build'));

report += `| App | Status | Notes |\n|---|---|---|\n${buildStatus.join('\n')}\n\n`;

// 4. App-Level Repairs Only (Guidance)
if (appLevelIssues.length > 0) {
    report += `## 4. App-Level Repairs Required\n\n`;
    report += `Failures detected in: ${appLevelIssues.join(', ')}.\n`;
    report += `**Guidance:** You may fix these inside \`apps/*\`. Do not modify \`.github/\`, \`infra/\`, or root scripts.\n\n`;
} else {
    report += `## 4. App-Level Repairs\n\n✅ No app-level repairs needed.\n\n`;
}

// 5. Recommendations & Stop Condition
report += `## 5. Recommendations\n\n`;

if (governanceViolations.length === 0 && appLevelIssues.length === 0) {
  report += `### ✅ Clean State\n\n`;
  report += `**Stop Condition Status:**\n`;
  report += `If CI is green across all required checks for 48 consecutive hours and no branch divergence >5 commits exists, recommend terminating recurring stabilization sync.\n`;
} else {
  report += `### ❌ Actions Required\n\n`;
  if (governanceViolations.length > 0) {
      report += `**Governance Violations:**\n`;
      governanceViolations.forEach(v => report += `- ${v}\n`);
      report += `\n**Do not self-fix. Escalate via comment only.**\n`;
  }
  if (appLevelIssues.length > 0) {
      report += `\n**App-Level Issues:**\n`;
      appLevelIssues.forEach(v => report += `- ${v}\n`);
  }
}

// Ensure report directory exists
fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });

// Write Report
fs.writeFileSync(REPORT_PATH, report);
console.log(`Report generated at ${REPORT_PATH}`);

// Exit Code Logic
if (governanceViolations.length > 0) {
  console.error('❌ Governance violations detected. Failing check.');
  process.exit(1);
} else if (appLevelIssues.length > 0) {
  console.warn('⚠️ App-level issues detected. Report generated.');
  process.exit(1);
} else {
  console.log('✅ All checks passed.');
  process.exit(0);
}
