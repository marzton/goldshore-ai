<<<<<<< HEAD
import {
  AiOrchestrationSchema,
  RoutingTableSchema,
  ServiceStatusSchema,
} from '../packages/schema/src/system.ts';
import { z } from 'zod';
=======
import { MasterConfigSchema, type MasterConfig } from '../packages/schema/src/system.ts';
>>>>>>> 9a7cd1bf7c1ad35699a74d37fff8bae63408bf13

const DEFAULT_ACCOUNT_ID = 'f77de112d2019e5456a3198a8bb50bd2';
const DEFAULT_NAMESPACE_ID = '9cc2209906a94851b704be57543987a9';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? DEFAULT_ACCOUNT_ID;
const NAMESPACE_ID = process.env.GS_KV_NAMESPACE_ID ?? DEFAULT_NAMESPACE_ID;

const MASTER_CONFIG: MasterConfig = {
  ROUTING_TABLE: {
    'gateway.goldshore.ai': { role: 'ingress', worker: 'gs-gateway' },
    'agent.goldshore.ai': { role: 'alias', target: 'gateway.goldshore.ai' },
    'api.goldshore.ai': { role: 'backend', worker: 'gs-api' },
<<<<<<< HEAD
    'agent.internal.goldshore.ai': { role: 'backend', worker: 'gs-agent' },
=======
>>>>>>> 9a7cd1bf7c1ad35699a74d37fff8bae63408bf13
    'admin.goldshore.ai': { role: 'frontend', project: 'gs-admin-pages' },
    'mail.goldshore.ai': { role: 'mx-only', provider: 'cloudflare-email' },
  },
  SERVICE_STATUS: {
    maintenance_mode: false,
<<<<<<< HEAD
    active_services: ['gs-gateway', 'gs-api', 'gs-agent', 'gs-admin'],
=======
    active_services: ['gateway', 'api', 'agent', 'admin'],
>>>>>>> 9a7cd1bf7c1ad35699a74d37fff8bae63408bf13
  },
  AI_ORCHESTRATION: {
    preferred_model: 'gpt-4-turbo',
    agent_modules: ['operator-assist', 'market-intel'],
    queue_concurrency: 10,
  },
};

function assertEnvironment(): void {
  if (!CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN is required.');
  }
}

async function syncConfig(config: MasterConfig): Promise<void> {
  console.log('🚀 Starting GoldShore System Sync...');

  for (const [key, value] of Object.entries(config)) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/kv/namespaces/${NAMESPACE_ID}/values/${key}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(value),
      });

      if (response.ok) {
        console.log(`✅ ${key} synchronized successfully.`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed to sync ${key}: ${error}`);
      }
    } catch (error) {
      console.error(`🚨 Network Error syncing ${key}:`, error);
    }
  }
}

async function runFinalVerification(): Promise<void> {
  console.log('\n📬 Checking /internal/inbox-status...');
  try {
    const finalVerify = await fetch('https://api.goldshore.ai/internal/inbox-status');
    const data = await finalVerify.json() as { success?: boolean; inbox?: { count?: number } };

    if (data.success) {
      console.log(`🎉 SYSTEM ONLINE: ${data.inbox?.count ?? 0} emails logged in KV.`);
    } else {
      console.error('⚠️ SYSTEM PARTIAL: API is up but KV logs are inaccessible.');
    }
  } catch (error) {
    console.error('⚠️ Final verification failed due to network/auth issue:', error);
<<<<<<< HEAD
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
const SyncLedgerSchema = z
  .object({
    last_sync: z.string().datetime(),
    namespace_id: z.string().min(1),
    account_id_masked: z.string().min(4),
    hosts: z.array(z.string().min(1)).min(1),
    keys_uploaded: z.array(z.string().min(1)).min(1),
  })
  .strict();

type ConfigPayload = z.infer<typeof ConfigPayloadSchema>;
type ConfigKey = keyof ConfigPayload;

type SyncLedger = z.infer<typeof SyncLedgerSchema>;

const MASTER_CONFIG: ConfigPayload = {
  ROUTING_TABLE: {
    api: { role: "backend", worker: "gs-api", priority: 1 },
    gateway: { role: "ingress", worker: "gs-gateway", priority: 1 },
    agent: { role: "backend", worker: "gs-agent", priority: 1 },
    "agent.goldshore.ai": { role: "alias", target: "gateway", priority: 1 },
    admin: { role: "frontend", project: "gs-admin", priority: 1 },
    web: { role: "frontend", project: "gs-web", priority: 1 },
    mail: { role: "mx-only", target: "gs-mail", priority: 1 },
  },
  SERVICE_STATUS: {
    maintenance_mode: false,
    active_services: ["gs-api", "gs-gateway", "gs-agent", "gs-mail", "gs-web", "gs-admin"],
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
    preferred_model: 'gpt-5-mini',
    agent_modules: ['operator-assist', 'market-intel'],
    queue_concurrency: 10,
    retry_attempts: 2,
  },
};

function getRequiredEnv(name: 'CLOUDFLARE_API_TOKEN'): string {
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

function maskAccountId(accountId: string): string {
  return accountId.length > 4 ? `${'*'.repeat(accountId.length - 4)}${accountId.slice(-4)}` : accountId;
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
=======
>>>>>>> 9a7cd1bf7c1ad35699a74d37fff8bae63408bf13
  }
}

async function main(): Promise<void> {
<<<<<<< HEAD
  const token = getRequiredEnv('CLOUDFLARE_API_TOKEN');
  const accountId = resolveEnvWithFallback('CLOUDFLARE_ACCOUNT_ID', DEFAULT_ACCOUNT_ID);
  const namespaceId = resolveEnvWithFallback('GS_KV_NAMESPACE_ID', DEFAULT_NAMESPACE_ID);

  const validatedPayload = ConfigPayloadSchema.parse(MASTER_CONFIG);
  const configKeys = Object.keys(validatedPayload) as ConfigKey[];

  const syncLedger: SyncLedger = SyncLedgerSchema.parse({
    last_sync: new Date().toISOString(),
    namespace_id: namespaceId,
    account_id_masked: maskAccountId(accountId),
    hosts: Object.keys(validatedPayload.ROUTING_TABLE),
    keys_uploaded: [...configKeys, 'INFRA_SYNC_LEDGER'],
  });

  console.log('Starting Cloudflare KV sync...');
  console.log(`- Account: ${syncLedger.account_id_masked}`);
  console.log(`- Namespace: ${namespaceId}`);

  const results = await Promise.all([
    ...configKeys.map((key) =>
      putKvValue({
        accountId,
        namespaceId,
        token,
        key,
        value: validatedPayload[key],
      }),
    ),
    putKvValue({
      accountId,
      namespaceId,
      token,
      key: 'INFRA_SYNC_LEDGER',
      value: syncLedger,
    }),
  ]);

  for (const result of results) {
    if (result.ok) {
      console.log(`✅ ${result.key}: uploaded (HTTP ${result.status})`);
    } else {
      console.error(`❌ ${result.key}: failed (HTTP ${result.status}) ${result.detail ?? ''}`);
    }
  }

  const verifyResult = await verifyInboxStatus();
  if (verifyResult.ok) {
    console.log(`✅ Verification: /internal/inbox-status passed (HTTP ${verifyResult.status})`);
  } else {
    console.error(`❌ Verification: /internal/inbox-status failed (${verifyResult.detail ?? 'unknown error'})`);
  }

  const uploadFailures = results.filter((result) => !result.ok).length;
  const failures = uploadFailures + (verifyResult.ok ? 0 : 1);
  console.log(`Summary: ${results.length - uploadFailures}/${results.length} KV uploads passed; verification ${verifyResult.ok ? 'passed' : 'failed'}.`);

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`❌ sync:infra failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
=======
  assertEnvironment();
  const parseResult = MasterConfigSchema.safeParse(MASTER_CONFIG);

  if (!parseResult.success) {
    console.error('❌ Invalid MASTER_CONFIG.');
    console.error(parseResult.error.format());
    process.exitCode = 1;
    return;
  }

  await syncConfig(parseResult.data);
  await runFinalVerification();
}

main().catch((error) => {
  console.error('❌ System sync failed:', error);
  process.exitCode = 1;
>>>>>>> 9a7cd1bf7c1ad35699a74d37fff8bae63408bf13
});
