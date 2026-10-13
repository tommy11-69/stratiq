import { z } from 'zod';
import {
  ProvenanceEnum,
  ProvisionalIdEnum,
  RuleKindEnum,
  RuleStatusEnum,
  StrengthEnum,
  WorkflowEnum,
} from '@stratiq/shared';

/**
 * Registry Entry Schema
 * Per docs/03_ARCHITECTURE.md §5 and docs/05_DATA_MODEL.md §2
 */
export const RegistryEntrySchema = z
  .object({
    id: z.string().min(1),
    kind: RuleKindEnum,
    status: RuleStatusEnum,
    strength: StrengthEnum,
    provenance: ProvenanceEnum,
    page_pdf: z.number().int().min(1).max(112).nullable().optional(),
    page_printed: z.number().int().nullable().optional(),
    statement_verbatim: z.string().min(1),
    parameters: z.record(z.unknown()).default({}),
    workflows: z.array(WorkflowEnum).default([]),
    register_id: ProvisionalIdEnum.nullable().optional(),
    default_value: z.unknown().optional(),
    overridable_by: z.array(z.enum(['agency', 'client'])).default([]),
    verified: z.boolean().default(false),
    version: z.string().default('1.0.0'),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Provenance validation rules (AGENTS.md §4)
    if (data.provenance === 'GoUp') {
      if (!data.page_pdf) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'GoUp provenance requires page_pdf to cite the toolkit page (1–112).',
          path: ['page_pdf'],
        });
      }
    }

    if (data.provenance === 'Provisional') {
      if (!data.register_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Provisional provenance requires a valid register_id (PV-xx).',
          path: ['register_id'],
        });
      }
      if (data.strength !== 'provisional') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Provisional provenance must have strength "provisional".',
          path: ['strength'],
        });
      }
    }
  });

export type RegistryEntry = z.infer<typeof RegistryEntrySchema>;

/**
 * Release Manifest Schema
 * Per docs/05_DATA_MODEL.md rule_registry_releases
 */
export const RegistryReleaseSchema = z.object({
  id: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be SemVer (X.Y.Z)'),
  released_at: z.string().datetime(),
  released_by: z.string().min(1),
  status: z.enum(['draft', 'released', 'retired']),
  entries: z.array(RegistryEntrySchema),
  content_hash: z.string().length(64),
});

export type RegistryRelease = z.infer<typeof RegistryReleaseSchema>;
