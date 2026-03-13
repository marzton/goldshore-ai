import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const APPS_DIR = path.resolve(process.cwd(), "apps");
const WRANGLER_NAME_PATTERN = /^\s*name\s*=\s*["']([^"']+)["']/m;

function getWorkerDirectories(): string[] {
  return readdirSync(APPS_DIR)
    .map((entry) => path.join(APPS_DIR, entry))
    .filter((fullPath) => statSync(fullPath).isDirectory())
    .filter((fullPath) => existsSync(path.join(fullPath, "wrangler.toml")))
    .filter((fullPath) => !fullPath.includes(`${path.sep}legacy${path.sep}`));
}

function expectedFoldersFromWorkerName(workerName: string): string[] {
  const slug = workerName.replace(/^gs-/, "");
  return [slug, `${slug}-worker`];
}

export function validateWorkerNames(): string[] {
  const failures: string[] = [];
  const names = new Map<string, string>();

  for (const workerDir of getWorkerDirectories()) {
    const folderName = path.basename(workerDir);
    const wranglerPath = path.join(workerDir, "wrangler.toml");
    const wranglerRaw = readFileSync(wranglerPath, "utf8");
    const nameMatch = wranglerRaw.match(WRANGLER_NAME_PATTERN);

    if (!nameMatch) {
      failures.push(`${folderName}: missing top-level name in wrangler.toml`);
      continue;
    }

    const workerName = nameMatch[1];
    const expectedFolders = expectedFoldersFromWorkerName(workerName);

    if (!expectedFolders.includes(folderName)) {
      failures.push(
        `${folderName}: wrangler name \"${workerName}\" requires folder to be one of [${expectedFolders.join(", ")}]`,
      );
    }

    if (names.has(workerName)) {
      failures.push(`${folderName}: duplicate wrangler name \"${workerName}\" also used by ${names.get(workerName)}`);
    } else {
      names.set(workerName, folderName);
    }
  }

  return failures;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const failures = validateWorkerNames();

  if (failures.length > 0) {
    console.error("Worker naming validation failed:\n");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Worker naming validation passed.");
}
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CANONICAL_WORKERS = ["gs-agent", "gs-api", "gs-control", "gs-gateway", "gs-mail"];
const CANONICAL_APPS_DIR = "apps";

let failed = false;

for (const worker of CANONICAL_WORKERS) {
  const wranglerPath = join(CANONICAL_APPS_DIR, worker, "wrangler.toml");

  if (!existsSync(wranglerPath)) {
    failed = true;
    console.error(`Missing wrangler.toml for ${worker}: ${wranglerPath}`);
    continue;
  }

  const content = readFileSync(wranglerPath, "utf8");
  const match = content.match(/^\s*name\s*=\s*["']([^"']+)["']/m);

  if (!match) {
    failed = true;
    console.error(`Could not parse worker name from ${wranglerPath}`);
    continue;
  }

  const configuredName = match[1]?.trim();
  if (configuredName !== worker) {
    failed = true;
    console.error(`Worker name mismatch in ${wranglerPath}: expected '${worker}', got '${configuredName}'`);
    continue;
  }

  console.log(`✅ ${worker} name matches wrangler.toml`);
}

if (failed) {
  process.exit(1);
}

console.log("All canonical worker name checks passed.");
