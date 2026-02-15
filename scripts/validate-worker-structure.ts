import { existsSync, readdirSync, readFileSync } from 'node:fs';

const apps = readdirSync('apps', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => name.startsWith('gs-'));

let failed = false;

for (const app of apps) {
  const wranglerPath = `apps/${app}/wrangler.toml`;

  if (!existsSync(wranglerPath)) {
    console.error(`❌ Missing wrangler.toml in ${app}`);
    failed = true;
    continue;
  }

  const contents = readFileSync(wranglerPath, 'utf-8');
  const match = contents.match(/name\s*=\s*["'](.+?)["']/);

  if (!match) {
    console.error(`❌ No worker name defined in ${app}/wrangler.toml`);
    failed = true;
    continue;
  }

  const workerName = match[1];

  if (workerName !== app) {
    console.error(
      `❌ Worker name mismatch: folder '${app}' vs wrangler name '${workerName}'`
    );
    failed = true;
    continue;
  }

  console.log(`✅ ${app} structure valid`);
}

if (failed) {
  process.exit(1);
}
