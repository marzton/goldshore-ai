import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const appsDir = "apps";
const requiredApps = ["gs-admin", "gs-api", "gs-control", "gs-gateway", "gs-web", "gs-agent"];
let failed = false;

if (!existsSync(appsDir)) {
  console.error("apps directory missing");
  process.exit(1);
}

for (const app of requiredApps) {
  const appPath = join(appsDir, app);
  if (!existsSync(appPath)) {
    console.error(`Missing app directory: ${app}`);
    failed = true;
    continue;
  }

  const pkgPath = join(appPath, "package.json");
  if (!existsSync(pkgPath)) {
    console.error(`Missing package.json in ${app}`);
    failed = true;
    continue;
  }

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  if (pkg.name !== `@goldshore/${app}`) {
    console.error(`Invalid package name in ${app}: ${pkg.name}. Expected @goldshore/${app}`);
    failed = true;
  }
}

if (failed) process.exit(1);
else console.log("Workspace contract validation passed.");
