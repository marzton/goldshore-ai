import {
  AiOrchestrationSchema,
  RoutingTableSchema,
  ServiceStatusSchema,
} from '../packages/schema/src/system.ts';
import { z } from 'zod';

const DEFAULT_ACCOUNT_ID = 'f77de112d2019e5456a3198a8bb50bd2';
const DEFAULT_NAMESPACE_ID = '9cc2209906a94851b704be57543987a9';

const ConfigPayloadSchema = z
  .object({
    ROUTING_TABLE: RoutingTableSchema,
    SERVICE_STATUS: ServiceStatusSchema,
    AI_ORCHESTRATION: AiOrchestrationSchema,
  })
  .strict();

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
    'gw.goldshore.ai': { role: 'ingress', worker: 'gs-gateway', priority: 1 },
    'gateway.goldshore.ai': { role: 'ingress', worker: 'gs-gateway', priority: 2 },
    'agent.goldshore.ai': { role: 'alias', target: 'gw.goldshore.ai', priority: 1 },
    'api.goldshore.ai': { role: 'backend', worker: 'gs-api', priority: 1 },
    'admin.goldshore.ai': { role: 'frontend', project: 'gs-admin-pages', priority: 1 },
    'mail.goldshore.ai': { role: 'mx-only', target: 'cloudflare-email', priority: 1 },
    'ops.goldshore.ai': { role: 'backend', worker: 'gs-control', priority: 1 },
  },
  SERVICE_STATUS: {
    maintenance_mode: false,
    active_services: ['gs-gateway', 'gs-api', 'gs-agent', 'gs-admin', 'gs-mail', 'gs-control'],
    version: '2026-03-03',
    last_sync: new Date().toISOString(),
  },
  AI_ORCHESTRATION: {
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
  primary: 'CLOUDFLARE_ACCOUNT_ID' | 'GS_KV_NAMESPACE_ID',
  fallback: string,
): string {
  const value = process.env[primary]?.trim() ?? fallback;
  if (!value) {
    throw new Error(`Unable to resolve required environment variable: ${primary}.`);
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
  key: string;
  value: unknown;
}): Promise<{ key: string; ok: boolean; status: number; detail?: string }> {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${args.accountId}/storage/kv/namespaces/${args.namespaceId}/values/${encodeURIComponent(args.key)}`;
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${args.token}`,
      'Content-Type': 'application/json',
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
  const endpoint = 'https://api.goldshore.ai/internal/inbox-status';

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return { ok: false, status: response.status, detail: `HTTP ${response.status}` };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

async function main(): Promise<void> {
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
});
