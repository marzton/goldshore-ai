import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { join } from "node:path";

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
    const folderName = path.basename(workerDir);
    // Ignore frontend apps for typical worker validation
    if (folderName === 'gs-admin' || folderName === 'gs-web') continue;

    const missingFiles = REQUIRED_FILES.filter((file) => !existsSync(path.join(workerDir, file)));

    if (missingFiles.length > 0) {
      failures.push(`${folderName}: missing required file(s): ${missingFiles.join(", ")}`);
    }
  }

  return failures;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const failures = validateWorkerStructure();
  let failed = false;

  if (failures.length > 0) {
    console.error("Worker structure validation failed:\n");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    failed = true;
  }

  const CANONICAL_WORKERS = ["gs-agent", "gs-api", "gs-control", "gs-gateway", "gs-mail"];

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
  }

  const appsDirs = readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("gs-"))
    .map((entry) => entry.name)
    .sort();

  const unexpectedWorkers = appsDirs.filter(
    (dir) => existsSync(join(APPS_DIR, dir, "wrangler.toml")) && !CANONICAL_WORKERS.includes(dir) && dir !== 'gs-admin' && dir !== 'gs-web',
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

  console.log("Worker structure validation passed.");
}
