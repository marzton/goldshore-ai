import { z } from 'zod';

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
    priority: z.number().default(1),
  })
);

// 2. SERVICE_STATUS: Global maintenance and feature flags
export const ServiceStatusSchema = z.object({
  maintenance_mode: z.boolean().default(false),
  active_services: z.array(z.string()),
  version: z.string(),
  last_sync: z.string().datetime().optional(),
});

// 3. SECRETS_METADATA: Tracking the key rotation audit trail
export const KeyRotationAuditSchema = z.object({
  action: z.literal("rotate_keys"),
  timestamp: z.string().datetime(),
  results: z.array(z.object({
    name: z.string(),
    status: z.enum(['success', 'error']),
    error: z.string().optional(),
  }))
});

// 4. EMAIL_INBOX_LOGS: Shared log structure for gs-mail
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
export type EmailLog = z.infer<typeof EmailLogSchema>;
