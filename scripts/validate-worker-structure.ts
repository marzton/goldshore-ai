import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve, basename, sep } from "node:path";

const ROOT = process.cwd();
const APPS_DIR = resolve(ROOT, "apps");
// Workers that MUST exist and have the standard structure
const CANONICAL_WORKERS = new Set(["gs-agent", "gs-api", "gs-control", "gs-gateway", "gs-mail"]);
// Files required in a canonical worker
const REQUIRED_FILES = ["wrangler.toml", "package.json", "tsconfig.json", "src/index.ts"];

let failed = false;

if (!existsSync(APPS_DIR)) {
  console.error("❌ apps directory not found");
  process.exit(1);
}

// 1. Check Canonical Workers Structure
console.log("Validating canonical worker structure...");
for (const worker of CANONICAL_WORKERS) {
  const workerDir = join(APPS_DIR, worker);

  if (!existsSync(workerDir)) {
    console.error(`❌ Missing canonical worker directory: apps/${worker}`);
    failed = true;
    continue;
  }

  // Check required files
  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(workerDir, file))) {
        console.error(`❌ ${worker}: missing required file: ${file}`);
        failed = true;
    }
  }

  // Check wrangler name match (basic check)
  const wranglerPath = join(workerDir, "wrangler.toml");
  if (existsSync(wranglerPath)) {
      try {
        const content = readFileSync(wranglerPath, "utf-8");
        const match = content.match(/name\s*=\s*["'](.+?)["']/);
        const wgName = match ? match[1] : null;
        if (wgName !== worker) {
            console.error(`❌ ${worker}: wrangler.toml name mismatch. Found "${wgName}", expected "${worker}"`);
            failed = true;
        }
      } catch (e) {
          console.error(`❌ ${worker}: Error reading wrangler.toml`);
          failed = true;
      }
  }
}

// 2. Check for Unexpected Workers
console.log("Checking for unexpected workers...");
const appsEntries = readdirSync(APPS_DIR, { withFileTypes: true });
for (const entry of appsEntries) {
    if (!entry.isDirectory()) continue;
    const dirName = entry.name;
    const fullPath = join(APPS_DIR, dirName);

    // If it has a wrangler.toml, it's a worker.
    if (existsSync(join(fullPath, "wrangler.toml"))) {
        if (!CANONICAL_WORKERS.has(dirName)) {
            console.error(`❌ Unexpected worker detected: apps/${dirName}`);
            failed = true;
        }
    }
}

if (failed) {
  console.error("Worker structure validation failed.");
  process.exit(1);
} else {
  console.log("Worker structure validation passed.");
}

// Export for compatibility if needed
export function validateWorkerStructure() {
    return failed ? ["Validation failed"] : [];
}
