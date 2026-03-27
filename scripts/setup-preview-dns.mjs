#!/usr/bin/env node
/**
 * One-shot script: configure preview.goldshore.ai DNS + Cloudflare Pages custom domain.
 *
 * Usage (from repo root):
 *   CF_API_TOKEN=<token> CF_ACCOUNT_ID=<account_id> CF_ZONE_ID=<zone_id> node scripts/setup-preview-dns.mjs
 *
 * Finds zone_id in Cloudflare dashboard → goldshore.ai → Overview → right sidebar.
 * Finds account_id in Cloudflare dashboard → top-right account menu → Account ID.
 */

const API = "https://api.cloudflare.com/client/v4";
const TOKEN = process.env.CF_API_TOKEN;
const ACCOUNT = process.env.CF_ACCOUNT_ID;
const ZONE = process.env.CF_ZONE_ID;

if (!TOKEN || !ACCOUNT || !ZONE) {
  console.error("Missing required env vars: CF_API_TOKEN, CF_ACCOUNT_ID, CF_ZONE_ID");
  process.exit(1);
}

async function cf(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(`CF ${path} failed: ${JSON.stringify(json.errors)}`);
  }
  return json.result;
}

async function main() {
  // ── 1. Add CNAME: preview.goldshore.ai → preview-web.pages.dev ──────────
  console.log("1. Creating DNS CNAME record...");

  // Check if record already exists
  const existing = await cf(`/zones/${ZONE}/dns_records?name=preview.goldshore.ai&type=CNAME`);
  if (existing.length > 0) {
    console.log("   ✓ CNAME already exists:", existing[0].content);
  } else {
    await cf(`/zones/${ZONE}/dns_records`, {
      method: "POST",
      body: JSON.stringify({
        type: "CNAME",
        name: "preview",
        content: "preview-web.pages.dev",
        proxied: true,
        ttl: 1, // auto when proxied
        comment: "Preview deployments for claude/* branches",
      }),
    });
    console.log("   ✓ CNAME created: preview.goldshore.ai → preview-web.pages.dev");
  }

  // ── 2. Add custom domain to preview-web Pages project ───────────────────
  console.log("2. Adding custom domain to preview-web Pages project...");

  try {
    await cf(`/accounts/${ACCOUNT}/pages/projects/preview-web/domains`, {
      method: "POST",
      body: JSON.stringify({ name: "preview.goldshore.ai" }),
    });
    console.log("   ✓ Custom domain added: preview.goldshore.ai → preview-web");
  } catch (err) {
    if (err.message.includes("already exists") || err.message.includes("taken")) {
      console.log("   ✓ Custom domain already configured");
    } else {
      // preview-web project may not exist yet — Pages creates it on first deploy
      console.warn("   ⚠ Could not add custom domain (project may not exist yet):", err.message);
      console.warn("   → Re-run this script after the first preview deploy completes.");
    }
  }

  console.log("\nDone. DNS propagation typically takes 1–5 minutes.");
  console.log("Preview URL: https://preview.goldshore.ai");
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
