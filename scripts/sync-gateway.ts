import { z } from "zod";

type ConfigKey = "ROUTING_TABLE" | "SERVICE_STATUS" | "AI_ORCHESTRATION";

const RoutingTargetSchema = z
  .object({
    role: z.enum(["ingress", "alias", "backend", "frontend", "mx-only"]),
    worker: z.string().min(1).optional(),
    target: z.string().min(1).optional(),
    project: z.string().min(1).optional(),
    priority: z.number().int().min(1).default(1),
  })
  .strict();

const RoutingTableSchema = z.record(z.string().min(1), RoutingTargetSchema);

const ServiceStatusSchema = z
  .object({
    maintenance_mode: z.boolean().default(false),
    active_services: z.array(z.string().min(1)).min(1),
    version: z.string().min(1),
    last_sync: z.string().datetime().optional(),
  })
  .strict();

const AiProviderConfigSchema = z
  .object({
    provider: z.enum(["openai", "anthropic", "google", "cloudflare-ai"]),
    model: z.string().min(1),
    enabled: z.boolean().default(true),
    priority: z.number().int().min(1),
  })
  .strict();

const AiOrchestrationSchema = z
  .object({
    default_provider: z.string().min(1),
    providers: z.array(AiProviderConfigSchema).min(1),
    fallback_chain: z.array(z.string().min(1)).min(1),
    max_retries: z.number().int().min(0).max(10).default(2),
  })
  .strict();

const ConfigPayloadSchema = z
  .object({
    ROUTING_TABLE: RoutingTableSchema,
    SERVICE_STATUS: ServiceStatusSchema,
    AI_ORCHESTRATION: AiOrchestrationSchema,
  })
  .strict();

type ConfigPayload = z.infer<typeof ConfigPayloadSchema>;

const DEFAULT_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const DEFAULT_NAMESPACE_ID = "9cc2209906a94851b704be57543987a9";

const payload: ConfigPayload = {
  ROUTING_TABLE: {
    api: { role: "backend", worker: "gs-api", priority: 1 },
    gateway: { role: "ingress", worker: "gs-gateway", priority: 1 },
    admin: { role: "frontend", project: "gs-admin", priority: 1 },
    web: { role: "frontend", project: "gs-web", priority: 1 },
    mail: { role: "mx-only", target: "gs-mail", priority: 1 },
  },
  SERVICE_STATUS: {
    maintenance_mode: false,
    active_services: ["gs-api", "gs-gateway", "gs-mail", "gs-web", "gs-admin"],
    version: "2026-03-03",
    last_sync: new Date().toISOString(),
  },
  AI_ORCHESTRATION: {
    default_provider: "openai",
    providers: [
      { provider: "openai", model: "gpt-5-mini", enabled: true, priority: 1 },
      { provider: "anthropic", model: "claude-3-5-sonnet", enabled: true, priority: 2 },
    ],
    fallback_chain: ["openai", "anthropic"],
    max_retries: 2,
  },
};

function getRequiredEnv(name: "CLOUDFLARE_API_TOKEN"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`);
  }
  return value;
}

function resolveEnvWithFallback(
  primary: "CLOUDFLARE_ACCOUNT_ID" | "GS_KV_NAMESPACE_ID",
  fallback: string | undefined,
  hint: string,
): string {
  const value = process.env[primary]?.trim() ?? fallback?.trim();
  if (!value) {
    throw new Error(
      `Unable to resolve ${primary}. Set ${primary}${hint ? ` (${hint})` : ""}.`,
    );
  }
  return value;
}

async function putKvValue(args: {
  accountId: string;
  namespaceId: string;
  token: string;
  key: ConfigKey;
  value: unknown;
}): Promise<{ key: ConfigKey; ok: boolean; status: number; detail?: string }> {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${args.accountId}/storage/kv/namespaces/${args.namespaceId}/values/${encodeURIComponent(args.key)}`;
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${args.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args.value),
  });

  if (response.ok) {
    return { key: args.key, ok: true, status: response.status };
  }

  const bodyText = await response.text();
  return {
    key: args.key,
    ok: false,
    status: response.status,
    detail: bodyText.slice(0, 500),
  };
}

async function verifyInboxStatus(): Promise<{ ok: boolean; status?: number; detail?: string }> {
  const endpoint = "https://api.goldshore.ai/internal/inbox-status";
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return { ok: false, status: response.status, detail: `HTTP ${response.status}` };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Unknown verification error",
    };
  }
}

async function main(): Promise<void> {
  const token = getRequiredEnv("CLOUDFLARE_API_TOKEN");
  const accountId = resolveEnvWithFallback(
    "CLOUDFLARE_ACCOUNT_ID",
    DEFAULT_ACCOUNT_ID,
    "fallback available via CF_ACCOUNT_ID",
  );
  const namespaceId = resolveEnvWithFallback(
    "GS_KV_NAMESPACE_ID",
    DEFAULT_NAMESPACE_ID,
    "fallback available via repository default",
  );

  const validatedPayload = ConfigPayloadSchema.parse(payload);

  const keys: ConfigKey[] = ["ROUTING_TABLE", "SERVICE_STATUS", "AI_ORCHESTRATION"];

  console.log("Starting Cloudflare KV sync...");
  console.log(`- Account: ${accountId}`);
  console.log(`- Namespace: ${namespaceId}`);

  const results = await Promise.all(
    keys.map((key) =>
      putKvValue({
        accountId,
        namespaceId,
        token,
        key,
        value: validatedPayload[key],
      }),
    ),
  );

  for (const result of results) {
    if (result.ok) {
      console.log(`✅ ${result.key}: uploaded (HTTP ${result.status})`);
    } else {
      console.error(`❌ ${result.key}: failed (HTTP ${result.status}) ${result.detail ?? ""}`);
    }
  }

  const verifyResult = await verifyInboxStatus();
  if (verifyResult.ok) {
    console.log(`✅ Verification: /internal/inbox-status passed (HTTP ${verifyResult.status})`);
  } else {
    console.error(`❌ Verification: /internal/inbox-status failed (${verifyResult.detail ?? "unknown error"})`);
  }

  const failures = results.filter((result) => !result.ok).length + (verifyResult.ok ? 0 : 1);
  console.log(`Summary: ${results.length - results.filter((r) => !r.ok).length}/${results.length} KV uploads passed; verification ${verifyResult.ok ? "passed" : "failed"}.`);

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`❌ sync:infra failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
