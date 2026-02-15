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
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const APPS_DIR = path.resolve(process.cwd(), "apps");
const REQUIRED_FILES = ["wrangler.toml", "package.json", "tsconfig.json", "src/index.ts"];

function findWorkerDirectories(): string[] {
  return readdirSync(APPS_DIR)
    .map((entry) => path.join(APPS_DIR, entry))
    .filter((fullPath) => statSync(fullPath).isDirectory())
    .filter((fullPath) => existsSync(path.join(fullPath, "wrangler.toml")))
    .filter((fullPath) => !fullPath.includes(`${path.sep}legacy${path.sep}`));
}

export function validateWorkerStructure(): string[] {
  const failures: string[] = [];

  for (const workerDir of findWorkerDirectories()) {
    const missingFiles = REQUIRED_FILES.filter((file) => !existsSync(path.join(workerDir, file)));

    if (missingFiles.length > 0) {
      const folderName = path.basename(workerDir);
      failures.push(`${folderName}: missing required file(s): ${missingFiles.join(", ")}`);
    }
  }

  return failures;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const failures = validateWorkerStructure();

  if (failures.length > 0) {
    console.error("Worker structure validation failed:\n");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Worker structure validation passed.");
}
