import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const APPS_DIR = resolve(ROOT, "apps");
const CANONICAL_WORKERS = new Set(["gs-agent", "gs-api", "gs-control", "gs-gateway", "gs-mail"]);

let failed = false;

if (!existsSync(APPS_DIR)) {
  console.error("❌ apps directory not found");
  process.exit(1);
}

// 1. Check Canonical Workers Naming
console.log("Validating canonical worker names...");
for (const worker of CANONICAL_WORKERS) {
  const workerDir = join(APPS_DIR, worker);
  const wranglerPath = join(workerDir, "wrangler.toml");

  if (!existsSync(workerDir)) {
      // Structure check handles missing dirs
      continue;
  }

  if (!existsSync(wranglerPath)) {
    console.error(`❌ Missing wrangler.toml for ${worker}`);
    failed = true;
    continue;
  }

  try {
    const content = readFileSync(wranglerPath, "utf8");
    const match = content.match(/^\s*name\s*=\s*["']([^"']+)["']/m);

    if (!match) {
        console.error(`❌ ${worker}: Could not parse 'name' from wrangler.toml`);
        failed = true;
        continue;
    }

    const configuredName = match[1]?.trim();
    if (configuredName !== worker) {
        console.error(`❌ ${worker}: name mismatch. Folder: "${worker}", wrangler name: "${configuredName}"`);
        failed = true;
    } else {
        console.log(`✅ ${worker} name matches`);
    }
  } catch (e) {
      console.error(`❌ ${worker}: Error reading wrangler.toml`);
      failed = true;
  }
}

// 2. Scan for other workers to ensure consistency
const allApps = readdirSync(APPS_DIR, { withFileTypes: true });
for (const entry of allApps) {
    if (!entry.isDirectory()) continue;
    const dirName = entry.name;
    const wranglerPath = join(APPS_DIR, dirName, "wrangler.toml");

    if (existsSync(wranglerPath)) {
        // We already checked canonicals.
        if (CANONICAL_WORKERS.has(dirName)) continue;

        try {
            const content = readFileSync(wranglerPath, "utf8");
            const match = content.match(/^\s*name\s*=\s*["']([^"']+)["']/m);
            if (match) {
                const configuredName = match[1]?.trim();
                if (configuredName !== dirName) {
                     console.error(`❌ Non-canonical worker ${dirName}: name mismatch. Folder: "${dirName}", wrangler name: "${configuredName}"`);
                     failed = true;
                }
            }
        } catch (e) {}
    }
}

if (failed) {
  console.error("Worker naming validation failed.");
  process.exit(1);
} else {
  console.log("Worker naming validation passed.");
}

export function validateWorkerNames() {
    return failed ? ["Validation failed"] : [];
}
