import { z } from 'zod';

/**
 * Provenance labels (every rule carries exactly one)
 * Per AGENTS.md §4:
 * [GoUp] toolkit, page cited
 * [Decision] product owner choice
 * [Provisional] (ID PV-xx, configurable, shown as "Provisional, not GoUp method")
 * [Marketer-set] per-client definition (owner + date stored)
 * [Architecture] engineering choice, never user-facing, never changes a verdict
 */
export const ProvenanceEnum = z.enum([
  'GoUp',
  'Decision',
  'Provisional',
  'Marketer-set',
  'Architecture',
]);
export type Provenance = z.infer<typeof ProvenanceEnum>;

/**
 * Strength labels
 * Per AGENTS.md §4: firm rule · guideline · illustrative · provisional
 */
export const StrengthEnum = z.enum(['firm rule', 'guideline', 'illustrative', 'provisional']);
export type Strength = z.infer<typeof StrengthEnum>;

/**
 * Rule kind in registry
 * Per docs/03_ARCHITECTURE.md §5
 */
export const RuleKindEnum = z.enum([
  'Gate',
  'Ladder',
  'Catalogue',
  'Calculation',
  'Guideline range',
  'Definition slot',
  'Worked example',
  'Decision table',
  'Field matrix',
]);
export type RuleKind = z.infer<typeof RuleKindEnum>;

/**
 * Rule status in registry
 */
export const RuleStatusEnum = z.enum(['active', 'deprecated', 'deferred', 'draft']);
export type RuleStatus = z.infer<typeof RuleStatusEnum>;

/**
 * Workflows
 * MVP active: W1, W5, W6
 * Deferred: W2, W3, W4, W7
 */
export const WorkflowEnum = z.enum(['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']);
export type Workflow = z.infer<typeof WorkflowEnum>;

export const MVPWorkflowEnum = z.enum(['W1', 'W5', 'W6']);
export type MVPWorkflow = z.infer<typeof MVPWorkflowEnum>;

export const DeferredWorkflowEnum = z.enum(['W2', 'W3', 'W4', 'W7']);
export type DeferredWorkflow = z.infer<typeof DeferredWorkflowEnum>;

/**
 * Canonical Provisional Rule IDs from docs/06_PROVISIONAL_REGISTER.md
 */
export const ProvisionalIdEnum = z.enum([
  'PV-01',
  'PV-02',
  'PV-03',
  'PV-04',
  'PV-05',
  'PV-06',
  'PV-07',
  'PV-08',
  'PV-09',
  'PV-10',
  'PV-11',
  'PV-12',
  'PV-13',
  'PV-14',
  'PV-15',
  'PV-16',
  'PV-17',
  'PV-18',
  'PV-19',
  'PV-20',
  'PV-29',
  'PV-30',
  'PV-31',
  'PV-32',
]);
export type ProvisionalId = z.infer<typeof ProvisionalIdEnum>;

/**
 * Open Decisions from docs/06_PROVISIONAL_REGISTER.md §3
 */
export const OpenDecisionIdEnum = z.enum([
  'OD-01',
  'OD-02',
  'OD-03',
  'OD-04',
  'OD-05',
  'OD-06',
  'OD-07',
  'OD-08',
  'OD-09',
  'OD-10',
]);
export type OpenDecisionId = z.infer<typeof OpenDecisionIdEnum>;

/**
 * Core GoUp Principles (Constitution) from docs/02_KNOWLEDGE_DIGEST.md §2
 */
export const PrincipleIdEnum = z.enum([
  'P1',
  'P2',
  'P3',
  'P4',
  'P5',
  'P6',
  'P7',
  'P8',
  'P9',
  'P10',
  'P11',
]);
export type PrincipleId = z.infer<typeof PrincipleIdEnum>;

/**
 * Basis of evidence and context values (docs/04_ENGINE_SPEC.md §2)
 * confirmed: user-confirmed value
 * assumed: stated or accepted assumption
 * derived: calculated from other values
 * default: system default
 */
export const BasisEnum = z.enum(['confirmed', 'assumed', 'derived', 'default']);
export type Basis = z.infer<typeof BasisEnum>;

/**
 * Context and evidence field status (docs/05_DATA_MODEL.md §2)
 */
export const FieldStatusEnum = z.enum(['confirmed', 'unconfirmed', 'stale', 'conflict', 'invalid']);
export type FieldStatus = z.infer<typeof FieldStatusEnum>;

/**
 * Tracking confidence levels (docs/01_PRODUCT_SPEC.md §6, Toolkit p.34)
 */
export const TrackingConfidenceEnum = z.enum(['High', 'Medium', 'Low']);
export type TrackingConfidence = z.infer<typeof TrackingConfidenceEnum>;

/**
 * Launch readiness verdicts (W1)
 */
export const LaunchVerdictEnum = z.enum(['Go', 'No-Go']);
export type LaunchVerdict = z.infer<typeof LaunchVerdictEnum>;

/**
 * Funnel diagnosis stage states (W5)
 */
export const DiagnosisStageStateEnum = z.enum(['healthy', 'weak', 'cannot conclude']);
export type DiagnosisStageState = z.infer<typeof DiagnosisStageStateEnum>;

/**
 * Scaling decision verdicts (W6)
 */
export const ScalingVerdictEnum = z.enum(['Scale', 'Hold', 'Reduce', 'Diagnose']);
export type ScalingVerdict = z.infer<typeof ScalingVerdictEnum>;

/**
 * Scaling decision qualifier
 */
export const ScalingQualifierEnum = z.enum(['constrained (Medium tracking)']);
export type ScalingQualifier = z.infer<typeof ScalingQualifierEnum>;

/**
 * Question / Gate evaluation results
 * Conditional is allowed at W6 Q1 only (PV-11)
 */
export const QuestionResultEnum = z.enum(['Pass', 'Fail', 'Cannot evaluate', 'Conditional']);
export type QuestionResult = z.infer<typeof QuestionResultEnum>;

/**
 * Figure calculation statuses (docs/04_ENGINE_SPEC.md §1)
 */
export const FigureStatusEnum = z.enum([
  'computed',
  'derived',
  'not computable',
  'no incremental outcomes',
  'below minimum evidence',
]);
export type FigureStatus = z.infer<typeof FigureStatusEnum>;

/**
 * Closed intent router output enums (docs/03_ARCHITECTURE.md §8)
 */
export const IntentEnum = z.enum([
  'W1',
  'W5',
  'W6',
  'provide_data',
  'confirm_pending',
  'switch_client',
  'deferred_W2',
  'deferred_W3',
  'deferred_W4',
  'deferred_W7',
  'outside_framework',
  'benchmark_request',
  'credential_offered',
  'meta_policy_question',
  'unclear',
]);
export type Intent = z.infer<typeof IntentEnum>;
