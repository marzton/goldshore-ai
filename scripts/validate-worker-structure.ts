import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CANONICAL_WORKERS = ["gs-agent", "gs-api", "gs-control", "gs-gateway", "gs-mail"];
const APPS_DIR = "apps";

let failed = false;

if (!existsSync(APPS_DIR)) {
  console.error("apps directory not found");
  process.exit(1);
}

for (const worker of CANONICAL_WORKERS) {
  const workerDir = join(APPS_DIR, worker);
  const wranglerPath = join(workerDir, "wrangler.toml");

  if (!existsSync(workerDir)) {
    failed = true;
    console.error(`Missing canonical worker directory: ${workerDir}`);
    continue;
  }

  if (!existsSync(wranglerPath)) {
    failed = true;
    console.error(`Missing wrangler.toml: ${wranglerPath}`);
    continue;
  }

  console.log(`✅ ${workerDir} contains wrangler.toml`);
}

const appsDirs = readdirSync(APPS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("gs-"))
  .map((entry) => entry.name)
  .sort();

const unexpectedWorkers = appsDirs.filter(
  (dir) => existsSync(join(APPS_DIR, dir, "wrangler.toml")) && !CANONICAL_WORKERS.includes(dir),
);

if (unexpectedWorkers.length > 0) {
  failed = true;
  console.error(
    `Unexpected worker directories with wrangler.toml: ${unexpectedWorkers.map((dir) => `apps/${dir}`).join(", ")}`,
  );
}

if (failed) {
  process.exit(1);
}

console.log("All canonical worker structure checks passed.");
import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const WORKERS = new Set(["gs-api","gs-control","gs-gateway","gs-agent","gs-mail"]);
let failed = false;

const appsDir = "apps";

if (!existsSync(appsDir)) {
  console.error("apps directory missing");
  process.exit(1);
}

for (const app of readdirSync(appsDir)) {
  if (!WORKERS.has(app)) continue;

  const path = join(appsDir, app, "wrangler.toml");
  if (!existsSync(path)) {
    failed = true;
    console.error(`Missing wrangler.toml in ${app}`);
  } else {
    const content = readFileSync(path, "utf-8");
    const match = content.match(/name\s*=\s*["'](.+?)["']/);
    const wgName = match ? match[1] : null;

    if (wgName !== app) {
      failed = true;
      console.error(`Worker name mismatch: ${app} vs ${wgName}`);
    }
  }
}

if (failed) process.exit(1);
else console.log("Worker structure validation passed.");
