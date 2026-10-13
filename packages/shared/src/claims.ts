import { z } from 'zod';

/**
 * Claim taxonomy (PV-30)
 * Per docs/03_ARCHITECTURE.md §9:
 * figure | rule | hypothesis | question | platform | general
 */
export const ClaimTypeEnum = z.enum([
  'figure',
  'rule',
  'hypothesis',
  'question',
  'platform',
  'general',
]);
export type ClaimType = z.infer<typeof ClaimTypeEnum>;

export const NarrativeClaimSchema = z.object({
  type: ClaimTypeEnum,
  content: z.string(),
  referenceId: z.string().optional(),
  figureId: z.string().optional(),
  ruleId: z.string().optional(),
  hypothesisId: z.string().optional(),
  disclaimer: z.string().optional(),
});
export type NarrativeClaim = z.infer<typeof NarrativeClaimSchema>;
