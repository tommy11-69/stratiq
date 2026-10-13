import { describe, expect, it } from 'vitest';
import {
  BasisEnum,
  ClaimTypeEnum,
  FigureStatusEnum,
  LaunchVerdictEnum,
  NarrativeClaimSchema,
  ProvenanceEnum,
  ProvisionalIdEnum,
  QuestionResultEnum,
  ScalingVerdictEnum,
  StrengthEnum,
  TrackingConfidenceEnum,
  canonicalHash,
  canonicalJsonStringify,
} from './index.js';

describe('@stratiq/shared domain contracts', () => {
  it('validates provenance labels and strengths', () => {
    expect(ProvenanceEnum.safeParse('GoUp').success).toBe(true);
    expect(ProvenanceEnum.safeParse('Provisional').success).toBe(true);
    expect(ProvenanceEnum.safeParse('InvalidProvenance').success).toBe(false);

    expect(StrengthEnum.safeParse('firm rule').success).toBe(true);
    expect(StrengthEnum.safeParse('guideline').success).toBe(true);
    expect(StrengthEnum.safeParse('illustrative').success).toBe(true);
    expect(StrengthEnum.safeParse('provisional').success).toBe(true);
    expect(StrengthEnum.safeParse('unknown').success).toBe(false);
  });

  it('validates canonical PV IDs', () => {
    expect(ProvisionalIdEnum.safeParse('PV-01').success).toBe(true);
    expect(ProvisionalIdEnum.safeParse('PV-20').success).toBe(true);
    expect(ProvisionalIdEnum.safeParse('PV-99').success).toBe(false);
  });

  it('validates closed verdicts and status sets', () => {
    expect(LaunchVerdictEnum.safeParse('Go').success).toBe(true);
    expect(LaunchVerdictEnum.safeParse('No-Go').success).toBe(true);
    expect(ScalingVerdictEnum.safeParse('Scale').success).toBe(true);
    expect(QuestionResultEnum.safeParse('Conditional').success).toBe(true);
    expect(TrackingConfidenceEnum.safeParse('High').success).toBe(true);
    expect(BasisEnum.safeParse('confirmed').success).toBe(true);
    expect(FigureStatusEnum.safeParse('computed').success).toBe(true);
  });

  it('serializes JSON canonically with sorted keys and identical hashes', () => {
    const objA = { b: 2, a: 1, nested: { z: 10, y: 20 } };
    const objB = { a: 1, b: 2, nested: { y: 20, z: 10 } };

    const canonA = canonicalJsonStringify(objA);
    const canonB = canonicalJsonStringify(objB);

    expect(canonA).toBe('{"a":1,"b":2,"nested":{"y":20,"z":10}}');
    expect(canonA).toBe(canonB);

    const hashA = canonicalHash(objA);
    const hashB = canonicalHash(objB);
    expect(hashA).toBe(hashB);
    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
  });

  it('validates claim taxonomy', () => {
    expect(ClaimTypeEnum.safeParse('figure').success).toBe(true);
    expect(ClaimTypeEnum.safeParse('platform').success).toBe(true);

    const validClaim = {
      type: 'rule',
      content: 'Never scale on cheap CPL alone',
      ruleId: 'P2',
    };
    expect(NarrativeClaimSchema.safeParse(validClaim).success).toBe(true);
  });
});
