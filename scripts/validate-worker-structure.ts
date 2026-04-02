import { existsSync, readdirSync, readFileSync } from 'node:fs';

const apps = readdirSync('apps', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => name.startsWith('gs-'))
  .filter((name) => existsSync(`apps/${name}/wrangler.toml`));

let failed = false;

for (const app of apps) {
  const wranglerPath = `apps/${app}/wrangler.toml`;
  const contents = readFileSync(wranglerPath, 'utf-8');
  const topLevelSection = contents
    .split(/\r?\n/)
    .filter((line, index, lines) => {
      // Keep lines only until the first TOML table header (e.g., [env.production])
      const firstTableIndex = lines.findIndex((l) => l.trim().startsWith('['));
      return firstTableIndex === -1 || index < firstTableIndex;
    })
    .join('\n');
  const match = topLevelSection.match(/^\s*name\s*=\s*["']([^"']+)["']/m);

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
