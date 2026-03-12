import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const APPS_DIR = join(ROOT, "apps");

// 1. Check Root Files
const ROOT_REQUIRED_FILES = ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml", "turbo.json"];
let failed = false;

console.log("Validating workspace root...");
for (const file of ROOT_REQUIRED_FILES) {
  if (!existsSync(join(ROOT, file))) {
    failed = true;
    console.error(`❌ Missing required workspace root file: ${file}`);
  } else {
    console.log(`✅ Found root workspace file: ${file}`);
  }
}

// 2. Check Required Apps and Package Names
// Based on GoldShore Multi-Agent Stabilization & Governance Framework v1.0
const REQUIRED_APPS = [
  "gs-admin",
  "gs-api",
  "gs-control",
  "gs-gateway",
  "gs-web",
  "gs-agent",
  "gs-mail"
];

if (!existsSync(APPS_DIR)) {
  console.error("❌ apps directory missing");
  failed = true;
} else {
  for (const app of REQUIRED_APPS) {
    const appPath = join(APPS_DIR, app);

    // Check existence
    if (!existsSync(appPath)) {
      // It's possible some apps are optional in early phases, but let's warn.
      // For now, if the directory is missing, we fail the contract check.
      console.error(`❌ Missing app directory: ${app}`);
      failed = true;
      continue;
    }

    const pkgPath = join(appPath, "package.json");
    if (!existsSync(pkgPath)) {
      console.error(`❌ Missing package.json in ${app}`);
      failed = true;
      continue;
    }

    try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        const expectedName = `@goldshore/${app}`;
        if (pkg.name !== expectedName) {
            console.error(`❌ Invalid package name in ${app}: "${pkg.name}". Expected "${expectedName}"`);
            failed = true;
        } else {
            console.log(`✅ App ${app} valid (@goldshore/${app})`);
        }
    } catch (e) {
        console.error(`❌ Error parsing package.json for ${app}`);
        failed = true;
    }
  }
}

if (failed) {
  console.error("Workspace contract validation failed.");
  process.exit(1);
} else {
  console.log("Workspace contract validation passed.");
}
