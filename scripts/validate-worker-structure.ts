import { readdirSync, existsSync, readFileSync } from "node:fs";

const WORKERS = new Set(["gs-api","gs-control","gs-gateway","gs-agent","gs-mail"]);
let failed = false;

// Check if apps directory exists
if (!existsSync("apps")) {
  console.error("apps directory not found");
  process.exit(1);
}

for (const app of readdirSync("apps")) {
  if (!WORKERS.has(app)) continue;

  const path = `apps/${app}/wrangler.toml`;
  if (!existsSync(path)) {
    failed = true;
    console.error(`Missing wrangler.toml in ${app}`);
  } else {
    const content = readFileSync(path, "utf-8");
    const match = content.match(/name\s*=\s*["'](.+?)["']/);
    const wg = match ? match[1] : null;

    if (!wg) {
      failed = true;
      console.error(`Could not parse name from ${path}`);
    } else if (wg !== app) {
      failed = true;
      console.error(`Worker name mismatch: folder '${app}' vs config '${wg}'`);
    } else {
      console.log(`✅ ${app} is valid.`);
    }
  }
}

if (failed) process.exit(1);
else console.log("All canonical workers validated successfully.");
