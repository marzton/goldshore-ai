import { z } from 'zod';

<<<<<<< HEAD
/**
 * [SOP] Infrastructure Schema Definition
 * Authoritative source for all KV-stored configurations.
 */

// 1. ROUTING_TABLE: Maps subdomains to internal workers/projects
export const RoutingTableSchema = z.record(
  z.string(),
  z.object({
    role: z.enum(['ingress', 'alias', 'backend', 'frontend', 'mx-only']),
    worker: z.string().optional(),
    target: z.string().optional(),
    project: z.string().optional(),
    priority: z.number().int().min(1).default(1),
  })
);

export const ApiRuntimeConfigSchema = z.object({
  maintenanceMode: z.boolean().default(false),
  maxConcurrency: z.number().int().min(1).max(500).default(10),
  notes: z.string().max(500).default(''),
  migratedFromLegacy: z.boolean().default(false),
});

// 2. SERVICE_STATUS: Global maintenance and feature flags
export const ServiceStatusSchema = z.object({
  maintenance_mode: z.boolean().default(false),
  active_services: z.array(z.string()),
  version: z.string(),
  last_sync: z.string().datetime().optional(),
  api_config: ApiRuntimeConfigSchema.optional(),
});

// 3. AI_ORCHESTRATION: Orchestrator-level defaults and limits for AI calls
export const AiOrchestrationSchema = z.object({
  preferred_model: z.string().min(1).default('gpt-4o'),
  agent_modules: z.array(z.string()).default([]),
  queue_concurrency: z.number().int().min(1).max(100).default(5),
  retry_attempts: z.number().int().min(0).max(10).default(3),
});

// 4. SECRETS_METADATA: Tracking the key rotation audit trail
export const KeyRotationAuditSchema = z.object({
  action: z.literal('rotate_keys'),
  timestamp: z.string().datetime(),
  results: z.array(z.object({
    name: z.string(),
    status: z.enum(['success', 'error']),
    error: z.string().optional(),
  }))
});

// 5. EMAIL_INBOX_LOGS: Shared log structure for gs-mail
export const EmailLogSchema = z.object({
  id: z.string().uuid(),
  from: z.string(),
  to: z.string(),
  subject: z.string(),
  timestamp: z.string().datetime(),
});

export const EmailInboxLogsSchema = z.array(EmailLogSchema).max(100);

// Types for TypeScript implementation
export type RoutingTable = z.infer<typeof RoutingTableSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export type ApiRuntimeConfig = z.infer<typeof ApiRuntimeConfigSchema>;
export type AiOrchestration = z.infer<typeof AiOrchestrationSchema>;
=======
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
>>>>>>> 9a7cd1bf7c1ad35699a74d37fff8bae63408bf13
export type EmailLog = z.infer<typeof EmailLogSchema>;
