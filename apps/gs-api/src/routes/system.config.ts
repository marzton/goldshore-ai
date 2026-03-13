import {
  AiOrchestrationSchema,
  ApiRuntimeConfigSchema,
  EmailInboxLogsSchema,
  RoutingTableSchema,
  ServiceStatusSchema,
  migrateLegacyApiConfig,
  normalizeApiRuntimeConfig
} from '@goldshore/schema';

export type SystemConfig = ReturnType<typeof normalizeApiRuntimeConfig>;

export const DEFAULT_CONFIG = ApiRuntimeConfigSchema.parse({});

export const parseConfig = (input: unknown): SystemConfig => normalizeApiRuntimeConfig(input);

export const loadSystemSyncSnapshot = async (kv: KVNamespace) => {
  const [ROUTING_TABLE, SERVICE_STATUS, AI_ORCHESTRATION, EMAIL_INBOX_LOGS] = await Promise.all([
    kv.get('ROUTING_TABLE', 'json'),
    kv.get('SERVICE_STATUS', 'json'),
    kv.get('AI_ORCHESTRATION', 'json'),
    kv.get('EMAIL_INBOX_LOGS', 'json'),
  ]);

  const parsedRouting = RoutingTableSchema.safeParse(ROUTING_TABLE);
  const parsedStatus = ServiceStatusSchema.safeParse(SERVICE_STATUS);
  const parsedOrchestration = AiOrchestrationSchema.safeParse(AI_ORCHESTRATION);
  const parsedInboxLogs = EmailInboxLogsSchema.safeParse(EMAIL_INBOX_LOGS);

  return {
    ROUTING_TABLE: parsedRouting.success ? parsedRouting.data : RoutingTableSchema.parse({}),
    SERVICE_STATUS: parsedStatus.success
      ? parsedStatus.data
      : ServiceStatusSchema.parse({
          maintenance_mode: false,
          active_services: [],
          version: 'unknown',
        }),
    AI_ORCHESTRATION: parsedOrchestration.success
      ? parsedOrchestration.data
      : AiOrchestrationSchema.parse({}),
    EMAIL_INBOX_LOGS: parsedInboxLogs.success ? parsedInboxLogs.data : EmailInboxLogsSchema.parse([]),
  };
};

export const resolveServiceStatusWithConfig = async (kv: KVNamespace) => {
  const rawStatus = await kv.get('SERVICE_STATUS', 'json');
  const statusResult = ServiceStatusSchema.safeParse(rawStatus);

  const baseStatus = statusResult.success
    ? statusResult.data
    : ServiceStatusSchema.parse({
        maintenance_mode: false,
        active_services: [],
        version: 'unknown',
      });

  const migration = migrateLegacyApiConfig(
    await kv.get('gs-api:config', 'json'),
    baseStatus.api_config,
  );

  const mergedStatus = {
    ...baseStatus,
    api_config: migration.config,
  };

  if (migration.migrated || !baseStatus.api_config) {
    await kv.put('SERVICE_STATUS', JSON.stringify(mergedStatus));
  }

  return {
    serviceStatus: mergedStatus,
    migrationApplied: migration.migrated,
  };
};
