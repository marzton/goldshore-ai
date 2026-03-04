import type { ControlEnv } from "../libs/types";

type SyncOutcome = "success" | "error";

export async function syncDNS(env: ControlEnv) {
  const startedAt = new Date().toISOString();
  const subdomain = env.SYNC_TARGET_SUBDOMAIN ?? "api.goldshore.ai";
  const actor = "gs-control:cron";

  let result: SyncOutcome = "success";
  const drift: Record<string, unknown> = {
    checks: [],
  };

  try {
    const healthResponse = await env.API.fetch("https://api.goldshore.ai/health");
    (drift.checks as unknown[]).push({
      check: "api-health",
      ok: healthResponse.ok,
      status: healthResponse.status,
    });

    if (!healthResponse.ok) {
      result = "error";
    }
  } catch (error) {
    result = "error";
    (drift.checks as unknown[]).push({
      check: "api-health",
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const completedAt = new Date().toISOString();

  await env.API.fetch("https://api.goldshore.ai/internal/sync-runs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-control-sync-token": env.CONTROL_SYNC_TOKEN ?? "",
    },
    body: JSON.stringify({
      subdomain,
      actor,
      started_at: startedAt,
      completed_at: completedAt,
      result,
      drift_summary: JSON.stringify(drift),
    }),
  });

  return result === "success";
}
