import { z } from 'zod';

export const RoutingRoleSchema = z.enum(['ingress', 'alias', 'backend', 'frontend', 'mx-only']);

export const RoutingEntrySchema = z.object({
  role: RoutingRoleSchema,
  worker: z.string().optional(),
  target: z.string().optional(),
  project: z.string().optional(),
  provider: z.string().optional(),
});

export const RoutingTableSchema = z.record(z.string(), RoutingEntrySchema);

export const ServiceStatusSchema = z.object({
  maintenance_mode: z.boolean(),
  active_services: z.array(z.string()),
});

export const AiOrchestrationSchema = z.object({
  preferred_model: z.string(),
  agent_modules: z.array(z.string()),
  queue_concurrency: z.number().int().positive(),
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
