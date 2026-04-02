#!/usr/bin/env node
/**
 * One-shot script: configure preview.goldshore.ai DNS + Cloudflare Pages custom domain.
 *
 * Accepts either naming convention for env vars:
 *   CLOUDFLARE_API_TOKEN  or  CF_API_TOKEN
 *   CLOUDFLARE_ACCOUNT_ID or  CF_ACCOUNT_ID
 *   CLOUDFLARE_ZONE_ID    or  CF_ZONE_ID  (optional — auto-resolved from domain if omitted)
 */

const API = "https://api.cloudflare.com/client/v4";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
let ZONE = process.env.CLOUDFLARE_ZONE_ID || process.env.CF_ZONE_ID;
const DRY_RUN = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";

if (!TOKEN || !ACCOUNT) {
  console.error(
    "Missing required env vars for Cloudflare API auth.\n" +
    "Set either CLOUDFLARE_API_TOKEN or CF_API_TOKEN, and either CLOUDFLARE_ACCOUNT_ID or CF_ACCOUNT_ID.\n" +
    "(Optional: CLOUDFLARE_ZONE_ID or CF_ZONE_ID — will be auto-resolved from the domain if omitted.)"
  );
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

async function resolveZoneId(domain) {
  console.log(`Resolving zone ID for ${domain}...`);
  const zones = await cf(`/zones?name=${encodeURIComponent(domain)}&account.id=${encodeURIComponent(ACCOUNT)}`);
  if (!zones.length) {
    throw new Error(`No Cloudflare zone found for ${domain} in account ${ACCOUNT}`);
  }
  if (zones.length > 1) {
    const ids = zones.map(z => z.id).join(", ");
    throw new Error(
      `Multiple Cloudflare zones found for ${domain} in account ${ACCOUNT}: ${ids}. ` +
      "Refine the lookup or specify CLOUDFLARE_ZONE_ID / CF_ZONE_ID explicitly."
    );
  }
  console.log(`  ✓ Zone ID: ${zones[0].id}`);
  return zones[0].id;
}

async function main() {
  if (DRY_RUN) {
    console.log("[DRY RUN] No API writes will be performed.\n");
  }

  if (!ZONE) {
    ZONE = await resolveZoneId("goldshore.ai");
  }

  // ── 1. Add CNAME: preview.goldshore.ai → preview-web.pages.dev ──────────
  console.log("1. Creating DNS CNAME record...");
  const existing = await cf(`/zones/${ZONE}/dns_records?name=preview.goldshore.ai&type=CNAME`);
  if (existing.length > 0) {
    console.log("   ✓ CNAME already exists:", existing[0].content);
  } else if (DRY_RUN) {
    console.log("   [DRY RUN] Would create CNAME: preview.goldshore.ai → preview-web.pages.dev");
  } else {
    await cf(`/zones/${ZONE}/dns_records`, {
      method: "POST",
      body: JSON.stringify({
        type: "CNAME",
        name: "preview",
        content: "preview-web.pages.dev",
        proxied: true,
        ttl: 1,
        comment: "Preview deployments for claude/* branches",
      }),
    });
    console.log("   ✓ CNAME created: preview.goldshore.ai → preview-web.pages.dev");
  }

  // ── 2. Add custom domain to preview-web Pages project ───────────────────
  console.log("2. Adding custom domain to preview-web Pages project...");
  if (DRY_RUN) {
    console.log("   [DRY RUN] Would add custom domain: preview.goldshore.ai → preview-web");
  } else {
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
        console.warn("   ⚠ Could not add custom domain (project may not exist yet).");
        console.warn("   → Re-run after the first preview deploy completes.");
      }
    }
  }

  console.log("\nDone. DNS propagation typically takes 1–5 minutes.");
  console.log("Preview URL: https://preview.goldshore.ai");
}

main().catch(err => {
  console.error("Error: setup-preview-dns script failed. See logs or rerun with debugging enabled.");
  // Avoid logging err.message directly to prevent leaking potentially sensitive data.
  process.exit(1);
});
