import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const APPS_DIR = path.resolve(process.cwd(), "apps");
const WRANGLER_NAME_PATTERN = /^\s*name\s*=\s*["']([^"']+)["']/m;
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

function expectedFoldersFromWorkerName(workerName: string): string[] {
  const slug = workerName.replace(/^gs-/, "");
  return [slug, `${slug}-worker`, workerName];
}

export function validateWorkerNames(): string[] {
  const failures: string[] = [];
  const names = new Map<string, string>();

  for (const worker of CANONICAL_WORKERS) {
    const wranglerPath = path.join(APPS_DIR, worker, "wrangler.toml");
    if (!existsSync(wranglerPath)) {
      failures.push(`Missing wrangler.toml for ${worker}: apps/${worker}/wrangler.toml`);
      continue;
    }

    const configured = readFileSync(wranglerPath, "utf8").match(WRANGLER_NAME_PATTERN)?.[1]?.trim();
    if (!configured) {
      failures.push(`Could not parse worker name from apps/${worker}/wrangler.toml`);
      continue;
    }

    if (configured !== worker) {
      failures.push(`Worker name mismatch in apps/${worker}/wrangler.toml: expected '${worker}', got '${configured}'`);
    }
  }

  for (const workerDir of getWorkerDirectories()) {
    const folderName = path.basename(workerDir);
    const wranglerPath = path.join(workerDir, "wrangler.toml");
    const workerName = readFileSync(wranglerPath, "utf8").match(WRANGLER_NAME_PATTERN)?.[1]?.trim();

    if (!workerName) {
      failures.push(`${folderName}: missing top-level name in wrangler.toml`);
      continue;
    }

    const expectedFolders = expectedFoldersFromWorkerName(workerName);
    if (!expectedFolders.includes(folderName)) {
      failures.push(
        `${folderName}: wrangler name "${workerName}" requires folder to be one of [${expectedFolders.join(", ")}]`,
      );
    }

    if (names.has(workerName)) {
      failures.push(`${folderName}: duplicate wrangler name "${workerName}" also used by ${names.get(workerName)}`);
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
