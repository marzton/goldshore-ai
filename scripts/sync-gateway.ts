import {
  AiOrchestrationSchema,
  RoutingTableSchema,
  ServiceStatusSchema,
} from '../packages/schema/src/system.ts';
import { z } from 'zod';

const DEFAULT_ACCOUNT_ID = 'f77de112d2019e5456a3198a8bb50bd2';
const DEFAULT_NAMESPACE_ID = '9cc2209906a94851b704be57543987a9';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? DEFAULT_ACCOUNT_ID;
const NAMESPACE_ID = process.env.GS_KV_NAMESPACE_ID ?? DEFAULT_NAMESPACE_ID;

type MasterConfig = {
  ROUTING_TABLE: z.infer<typeof RoutingTableSchema>;
  SERVICE_STATUS: z.infer<typeof ServiceStatusSchema>;
  AI_ORCHESTRATION: z.infer<typeof AiOrchestrationSchema>;
};

/**
 * MASTER_CONFIG - Authoritative system configuration.
 * Uses hostnames as keys for ROUTING_TABLE to maintain parity with ingress logic.
 */
const MASTER_CONFIG: MasterConfig = {
  ROUTING_TABLE: {
    'gateway.goldshore.ai': { role: 'ingress', worker: 'gs-gateway', priority: 1 },
    'agent.goldshore.ai': { role: 'alias', target: 'gateway.goldshore.ai', priority: 1 },
    'api.goldshore.ai': { role: 'backend', worker: 'gs-api', priority: 1 },
    'agent.internal.goldshore.ai': { role: 'backend', worker: 'gs-agent', priority: 1 },
    'admin.goldshore.ai': { role: 'frontend', project: 'gs-admin-pages', priority: 1 },
    'mail.goldshore.ai': { role: 'mx-only', target: 'gs-mail', priority: 1 },
  },
  SERVICE_STATUS: {
    maintenance_mode: false,
    active_services: ['gs-gateway', 'gs-api', 'gs-agent', 'gs-admin'],
    version: '2024-11-01',
    last_sync: new Date().toISOString(),
  },
  AI_ORCHESTRATION: {
    preferred_model: 'gpt-4-turbo',
    agent_modules: ['operator-assist', 'market-intel'],
    queue_concurrency: 10,
    retry_attempts: 3,
  },
};

function assertEnvironment(): void {
  if (!CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN is required.');
  }
}

async function syncConfig(config: MasterConfig): Promise<void> {
  console.log('🚀 Starting GoldShore System Sync (Concurrent)...');
  assertEnvironment();

  const entries = Object.entries(config);

  // Concurrently upload all configuration keys to Cloudflare KV
  const results = await Promise.all(entries.map(async ([key, value]) => {
    // Note: Cloudflare KV API uses /storage/kv/namespaces/... for some operations but
    // the original script used /workers/kv/namespaces/.../values/
    // We stick to the original endpoint logic as it was working before truncation.
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
        return { key, success: true, status: response.status };
      } else {
        const error = await response.text();
        return { key, success: false, status: response.status, error };
      }
    } catch (error) {
      return { key, success: false, status: 0, error: String(error) };
    }
  }));

  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.key} synchronized successfully (HTTP ${result.status}).`);
    } else {
      console.error(`❌ Failed to sync ${result.key} (HTTP ${result.status}): ${result.error}`);
    }
  }

  const failures = results.filter(r => !r.success).length;
  if (failures > 0) {
    throw new Error(`${failures} keys failed to synchronize.`);
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
  }
}

async function main() {
  try {
    await syncConfig(MASTER_CONFIG);
    await runFinalVerification();
  } catch (error) {
    console.error(`❌ sync:infra failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
