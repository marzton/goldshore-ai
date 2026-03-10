import { z } from 'zod';

export const InquiryMetaSchema = z
  .object({
    type: z.string().trim().min(1).max(80),
    tier_assignment: z.number().int().min(1).max(5),
    priority: z.boolean(),
  })
  .strict();

export const AdvisorCredentialSchema = z.enum(['CFA', 'CFP']);

export const AdvisorStatsSchema = z
  .object({
    credentials: z.array(AdvisorCredentialSchema).min(1).max(2),
    aum_range: z.string().trim().min(1).max(40),
    intent_score: z.number().min(0).max(1),
  })
  .strict();

export const StrategicIntelligenceSyncSchema = z
  .object({
    inquiry_meta: InquiryMetaSchema,
    advisor_stats: AdvisorStatsSchema,
  })
  .strict();

export type StrategicIntelligenceSyncPayload = z.infer<
  typeof StrategicIntelligenceSyncSchema
>;

export const StrategicIntelligenceSyncJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://goldshore.ai/schemas/strategic-intelligence-sync.json',
  title: 'Strategic Intelligence Sync Payload',
  type: 'object',
  additionalProperties: false,
  required: ['inquiry_meta', 'advisor_stats'],
  properties: {
    inquiry_meta: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'tier_assignment', 'priority'],
      properties: {
        type: { type: 'string', minLength: 1, maxLength: 80 },
        tier_assignment: { type: 'integer', minimum: 1, maximum: 5 },
        priority: { type: 'boolean' },
      },
    },
    advisor_stats: {
      type: 'object',
      additionalProperties: false,
      required: ['credentials', 'aum_range', 'intent_score'],
      properties: {
        credentials: {
          type: 'array',
          minItems: 1,
          maxItems: 2,
          uniqueItems: true,
          items: { type: 'string', enum: ['CFA', 'CFP'] },
        },
        aum_range: { type: 'string', minLength: 1, maxLength: 40 },
        intent_score: { type: 'number', minimum: 0, maximum: 1 },
      },
    },
  },
} as const;
