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
