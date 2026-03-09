#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const appsRoot = path.join(repoRoot, 'apps');
const workflowsRoot = path.join(repoRoot, '.github', 'workflows');

const extractEnvFlags = (command) => {
  const envs = [];
  const regex = /--env\s+([a-zA-Z0-9_-]+)/g;
  for (const match of command.matchAll(regex)) {
    envs.push(match[1]);
  }
  return envs;
};

const extractCommandVars = (command) => {
  const vars = new Map();
  for (const match of command.matchAll(/(^|\s)([A-Z_][A-Z0-9_]*)=([^\s]+)/g)) {
    vars.set(match[2], match[3]);
  }
  return vars;
};

const extractConfigApp = (command) => {
  const vars = extractCommandVars(command);
  const regex = /--config\s+([^\s]+)/g;
  for (const match of command.matchAll(regex)) {
    let raw = match[1].replace(/^['"]|['"]$/g, '').replace(/^\.\//, '');
    raw = raw.replace(/\$([A-Z_][A-Z0-9_]*)/g, (_, name) => vars.get(name) ?? `$${name}`);
    const appMatch = raw.match(/apps\/([^/]+)\/wrangler\.toml$/);
    if (appMatch) {
      return appMatch[1];
    }
  }
  return null;
};

const extractWorkingDirectoryApp = (value) => {
  if (!value) return null;
  const normalized = value.replace(/^['"]|['"]$/g, '').replace(/^\.\//, '');
  const match = normalized.match(/^apps\/([^/]+)$/);
  return match ? match[1] : null;
};

const parseWorkflowAppsFromPaths = (content, knownApps) => {
  const apps = new Set();
  for (const match of content.matchAll(/apps\/([^/]+)\/\*\*/g)) {
    if (knownApps.has(match[1])) apps.add(match[1]);
  }
  return apps;
};

const parseWorkflowRuns = (content) => {
  const lines = content.split(/\r?\n/);
  const results = [];

  for (let i = 0; i < lines.length; i += 1) {
    const runMatch = lines[i].match(/^\s*run:\s*(.+)\s*$/);
    if (!runMatch) continue;

    const runIndent = lines[i].match(/^\s*/)?.[0].length ?? 0;
    let runCommand = runMatch[1].trim();

    if (runCommand === '|' || runCommand === '>') {
      const chunks = [];
      for (let j = i + 1; j < lines.length; j += 1) {
        const indent = lines[j].match(/^\s*/)?.[0].length ?? 0;
        if (lines[j].trim() === '') {
          chunks.push('');
          continue;
        }
        if (indent <= runIndent) break;
        chunks.push(lines[j].trim());
        i = j;
      }
      runCommand = chunks.join(' ');
    }

    let workingDirectory = null;
    for (let j = i - 1; j >= 0; j -= 1) {
      const currentIndent = lines[j].match(/^\s*/)?.[0].length ?? 0;
      if (currentIndent < runIndent - 2) break;
      const wdMatch = lines[j].match(/^\s*working-directory:\s*(.+)\s*$/);
      if (wdMatch) {
        workingDirectory = wdMatch[1].trim();
        break;
      }
    }

    results.push({ runCommand, workingDirectory });
  }

  return results;
};

const readAppEnvDefinitions = async () => {
  const entries = await fs.readdir(appsRoot, { withFileTypes: true });
  const apps = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const defs = new Map();

  for (const app of apps) {
    const wranglerPath = path.join(appsRoot, app, 'wrangler.toml');
    try {
      const text = await fs.readFile(wranglerPath, 'utf8');
      const envs = new Set();
      for (const match of text.matchAll(/^\[env\.([a-zA-Z0-9_-]+)]/gm)) {
        envs.add(match[1]);
      }
      defs.set(app, { wranglerPath: path.relative(repoRoot, wranglerPath), envs });
    } catch {}
  }
  return defs;
};

const collectWorkflowUsages = async (knownApps) => {
  const usages = [];
  let files = [];
  try {
    files = await fs.readdir(workflowsRoot);
  } catch {
    return usages;
  }

  for (const fileName of files) {
    if (!/\.ya?ml(?:~HEAD)?$/.test(fileName)) continue;
    const workflowPath = path.join(workflowsRoot, fileName);
    const content = await fs.readFile(workflowPath, 'utf8');
    if (/^\s*if:\s*false\b/m.test(content)) {
      continue;
    }
    const relativePath = path.relative(repoRoot, workflowPath);
    const appsFromPaths = parseWorkflowAppsFromPaths(content, knownApps);

    for (const step of parseWorkflowRuns(content)) {
      const envFlags = extractEnvFlags(step.runCommand);
      if (envFlags.length === 0) continue;

      const appFromConfig = extractConfigApp(step.runCommand);
      const appFromWd = extractWorkingDirectoryApp(step.workingDirectory);
      const appFromFile = [...knownApps].find((candidate) => fileName.includes(candidate)) ?? null;
      const appFromPaths = appsFromPaths.size === 1 ? [...appsFromPaths][0] : null;
      const app = appFromConfig ?? appFromWd ?? appFromFile ?? appFromPaths;

      for (const envName of envFlags) {
        usages.push({
          app,
          envName,
          source: relativePath,
          detail: step.runCommand,
        });
      }
    }
  }
  return usages;
};

const collectPackageScriptUsages = async (knownApps) => {
  const usages = [];
  for (const app of knownApps) {
    const packagePath = path.join(appsRoot, app, 'package.json');
    try {
      const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8'));
      for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
        if (typeof command !== 'string') continue;
        for (const envName of extractEnvFlags(command)) {
          usages.push({
            app,
            envName,
            source: path.relative(repoRoot, packagePath),
            detail: `scripts.${name}: ${command}`,
          });
        }
      }
    } catch {}
  }
  return usages;
};

const appDefinitions = await readAppEnvDefinitions();
const knownApps = new Set(appDefinitions.keys());
const usages = [
  ...(await collectWorkflowUsages(knownApps)),
  ...(await collectPackageScriptUsages(knownApps)),
];

const mismatches = [];
const unmapped = [];

for (const usage of usages) {
  if (!usage.app) {
    unmapped.push(usage);
    continue;
  }
  const definition = appDefinitions.get(usage.app);
  if (!definition || !definition.envs.has(usage.envName)) {
    mismatches.push({
      ...usage,
      reason: definition
        ? `${definition.wranglerPath} is missing [env.${usage.envName}].`
        : `apps/${usage.app}/wrangler.toml was not found.`,
    });
  }
}

console.log('Wrangler environment audit summary:\n');
for (const [app, definition] of [...appDefinitions.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const envList = [...definition.envs].sort().join(', ') || '(none)';
  console.log(`- ${app}: env.prod=${definition.envs.has('prod') ? 'yes' : 'no'}, env.preview=${definition.envs.has('preview') ? 'yes' : 'no'}, envs=[${envList}]`);
}

if (unmapped.length) {
  console.log('\nUnmapped --env usages (informational):');
  for (const usage of unmapped) {
    console.log(`- ${usage.source}: ${usage.detail} (env=${usage.envName})`);
  }
}

if (mismatches.length) {
  console.error('\n❌ Wrangler env mismatches found:');
  for (const mismatch of mismatches) {
    console.error(`- [${mismatch.app ?? 'unknown'}] ${mismatch.source}: ${mismatch.detail}`);
    console.error(`  ${mismatch.reason}`);
  }
  process.exit(1);
}

console.log('\n✅ No wrangler env mismatches found.');
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const appsDir = './apps';
const apps = readdirSync(appsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

console.log('🔍 Auditing Wrangler Configurations for Production Readiness...\n');

let issuesFound = 0;

for (const app of apps) {
  const wranglerPath = join(appsDir, app, 'wrangler.toml');

  if (!existsSync(wranglerPath)) {
    continue;
  }

  const content = readFileSync(wranglerPath, 'utf8');
  const hasProdEnv = content.includes('[env.prod]') || content.includes('[env.production]');
  const hasProdAlias = content.includes('[env.prod]');
  const hasPreviewEnv = content.includes('[env.preview]');

  console.log(`📦 App: ${app}`);

  if (!hasProdEnv) {
    console.error('  ❌ Missing [env.prod] or [env.production] block!');
    issuesFound += 1;
  } else {
    console.log('  ✅ production environment found.');
    if (!hasProdAlias) {
      console.warn('  ⚠️  Using [env.production] instead of [env.prod]. Ensure deploy commands match.');
    }
  }

  if (!hasPreviewEnv) {
    console.warn('  ⚠️  Missing [env.preview] block.');
  } else {
    console.log('  ✅ [env.preview] found.');
  }
}

if (issuesFound > 0) {
  console.error(`\n🚨 Audit failed with ${issuesFound} critical issues.`);
  process.exit(1);
}

console.log('\n✨ All workers are production-configured.');
