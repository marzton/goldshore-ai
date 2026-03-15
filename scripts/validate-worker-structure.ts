import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APPS_DIR = path.resolve(ROOT, "apps");
const REQUIRED_FILES = ["wrangler.toml", "package.json", "tsconfig.json", "src/index.ts"] as const;
const CANONICAL_WORKERS = ["gs-agent", "gs-api", "gs-control", "gs-gateway", "gs-mail"] as const;

function getWorkerDirectories(): string[] {
  if (!existsSync(APPS_DIR)) {
    return [];
  }

  return readdirSync(APPS_DIR)
    .map((entry) => path.join(APPS_DIR, entry))
    .filter((fullPath) => statSync(fullPath).isDirectory())
    .filter((fullPath) => existsSync(path.join(fullPath, "wrangler.toml")))
    .filter((fullPath) => !fullPath.includes(`${path.sep}legacy${path.sep}`));
}

export function validateWorkerStructure(): string[] {
  const failures: string[] = [];

  if (!existsSync(APPS_DIR)) {
    return ["apps directory not found"];
  }

  for (const worker of CANONICAL_WORKERS) {
    const workerDir = path.join(APPS_DIR, worker);
    if (!existsSync(workerDir)) {
      failures.push(`Missing canonical worker directory: apps/${worker}`);
      continue;
    }

    const wranglerPath = path.join(workerDir, "wrangler.toml");
    if (!existsSync(wranglerPath)) {
      failures.push(`Missing wrangler.toml: apps/${worker}/wrangler.toml`);
    }
  }

  const workerDirs = getWorkerDirectories();
  for (const workerDir of workerDirs) {
    const missingFiles = REQUIRED_FILES.filter((file) => !existsSync(path.join(workerDir, file)));
    if (missingFiles.length > 0) {
      failures.push(`${path.basename(workerDir)}: missing required file(s): ${missingFiles.join(", ")}`);
    }
  }

  const unexpectedWorkers = workerDirs
    .map((dir) => path.basename(dir))
    .filter((folder) => folder.startsWith("gs-") && !CANONICAL_WORKERS.includes(folder as (typeof CANONICAL_WORKERS)[number]));

  if (unexpectedWorkers.length > 0) {
    failures.push(
      `Unexpected worker directories with wrangler.toml: ${unexpectedWorkers.map((dir) => `apps/${dir}`).join(", ")}`,
    );
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
