import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { validateWorkerNames } from "./validate-worker-names";
import { validateWorkerStructure } from "./validate-worker-structure";

const ROOT = process.cwd();
const APPS_DIR = path.resolve(ROOT, "apps");
const REQUIRED_ROOT_FILES = ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml", "turbo.json"] as const;
const REQUIRED_APPS = ["gs-admin", "gs-api", "gs-control", "gs-gateway", "gs-web", "gs-agent"] as const;
const WORKSPACE_ROOT_MARKERS = ["pnpm-workspace.yaml", "turbo.json"] as const;
const IGNORE_DIRS = new Set([".git", "node_modules", ".turbo", "dist", "build", "coverage", "astro-goldshore"]);

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

function validateRootFiles(): string[] {
  return REQUIRED_ROOT_FILES.filter((file) => !existsSync(path.join(ROOT, file))).map(
    (file) => `Missing required workspace root file: ${file}`,
  );
}

function validateNoNestedWorkspaceRoots(): string[] {
  const nestedMarkers: string[] = [];

  const scan = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || IGNORE_DIRS.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(dir, entry.name);

      for (const marker of WORKSPACE_ROOT_MARKERS) {
        const markerPath = path.join(fullPath, marker);
        if (existsSync(markerPath)) {
          nestedMarkers.push(path.relative(ROOT, markerPath));
        }
      }

      scan(fullPath);
    }
  };

  scan(ROOT);

  if (nestedMarkers.length === 0) {
    return [];
  }

  return [
    `Nested workspace root markers detected (workspace contract violation): ${nestedMarkers.join(", ")}`,
  ];
}

function validateRequiredApps(): string[] {
  const failures: string[] = [];

  if (!existsSync(APPS_DIR)) {
    return ["apps directory missing"];
  }

  for (const app of REQUIRED_APPS) {
    const appPath = path.join(APPS_DIR, app);
    if (!existsSync(appPath)) {
      failures.push(`Missing app directory: ${app}`);
      continue;
    }

    const pkgPath = path.join(appPath, "package.json");
    if (!existsSync(pkgPath)) {
      failures.push(`Missing package.json in ${app}`);
      continue;
    }

    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { name?: string };
    const expected = `@goldshore/${app}`;
    if (pkg.name !== expected) {
      failures.push(`Invalid package name in ${app}: ${pkg.name ?? "<missing>"}. Expected ${expected}`);
    }
  }

  return failures;
}

function main() {
  const failures = [
    ...validateRootFiles(),
    ...validateNoNestedWorkspaceRoots(),
    ...validateRequiredApps(),
    ...validateWorkerStructure(),
    ...validateWorkerNames(),
    ...validatePackageNames(),
  ];

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
