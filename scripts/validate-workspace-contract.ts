import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { validateWorkerStructure } from "./validate-worker-structure";
import { validateWorkerNames } from "./validate-worker-names";

const APPS_DIR = path.resolve(process.cwd(), "apps");

function getWorkerDirectories(): string[] {
  return readdirSync(APPS_DIR)
    .map((entry) => path.join(APPS_DIR, entry))
    .filter((fullPath) => statSync(fullPath).isDirectory())
    .filter((fullPath) => existsSync(path.join(fullPath, "wrangler.toml")))
    .filter((fullPath) => !fullPath.includes(`${path.sep}legacy${path.sep}`));
}

function validatePackageNames(): string[] {
  const failures: string[] = [];

  for (const workerDir of getWorkerDirectories()) {
    const folderName = path.basename(workerDir);
    const packagePath = path.join(workerDir, "package.json");

    if (!existsSync(packagePath)) {
      failures.push(`${folderName}: missing package.json`);
      continue;
    }

    const parsed = JSON.parse(readFileSync(packagePath, "utf8")) as { name?: string };
    const packageName = parsed.name;

    if (!packageName) {
      failures.push(`${folderName}: missing package.json name field`);
      continue;
    }

    if (!packageName.startsWith("@goldshore/")) {
      failures.push(`${folderName}: package name must start with @goldshore/ (found ${packageName})`);
    }
  }

  return failures;
}

function main() {
  const failures = [...validateWorkerStructure(), ...validateWorkerNames(), ...validatePackageNames()];

  if (failures.length > 0) {
    console.error("Workspace worker contract validation failed:\n");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Workspace worker contract validation passed.");
}

main();
