import { z } from 'zod';
import { AiOrchestrationSchema } from './ai.ts';

export const RoutingRoleSchema = z.enum(['ingress', 'alias', 'backend', 'frontend', 'mx-only']);

export const RoutingEntrySchema = z.object({
  role: RoutingRoleSchema,
  worker: z.string().optional(),
  target: z.string().optional(),
  project: z.string().optional(),
  provider: z.string().optional(),
  priority: z.number().int().min(1).default(1),
});

export const RoutingTableSchema = z.record(z.string(), RoutingEntrySchema);

export const ApiRuntimeConfigSchema = z.object({
  maintenanceMode: z.boolean().default(false),
  maxConcurrency: z.number().int().min(1).max(500).default(10),
  notes: z.string().max(500).default(''),
  migratedFromLegacy: z.boolean().default(false),
});

export const ServiceStatusSchema = z.object({
  maintenance_mode: z.boolean().default(false),
  active_services: z.array(z.string()),
  version: z.string().optional(),
  last_sync: z.string().datetime().optional(),
  api_config: ApiRuntimeConfigSchema.optional(),
});

export const EmailLogSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  subject: z.string(),
  timestamp: z.string(),
});

export const EmailInboxLogsSchema = z.array(EmailLogSchema);

export const MasterConfigSchema = z.object({
  ROUTING_TABLE: RoutingTableSchema,
  SERVICE_STATUS: ServiceStatusSchema,
  AI_ORCHESTRATION: AiOrchestrationSchema,
});

export type MasterConfig = z.infer<typeof MasterConfigSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export type EmailLog = z.infer<typeof EmailLogSchema>;
export { AiOrchestrationSchema };
