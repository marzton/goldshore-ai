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
