import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ExtractedPage,
  RegistryEntry,
  RegistryEntrySchema,
  RegistryRelease,
  RuleRegistry,
  validateEntryFidelity,
  validateRegistryRelease,
} from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..', '..');

const releaseJsonPath = path.resolve(
  rootDir,
  'packages',
  'registry',
  'seed',
  'initial_release.json',
);

const extractedPagesPath = path.resolve(
  rootDir,
  'packages',
  'registry',
  'data',
  'extracted_pages.json',
);

describe('@stratiq/registry domain contracts and fidelity', () => {
  const seedRelease: RegistryRelease = JSON.parse(fs.readFileSync(releaseJsonPath, 'utf8'));

  const extractedData = JSON.parse(fs.readFileSync(extractedPagesPath, 'utf8'));
  const pagesMap = new Map<number, string>();
  for (const p of extractedData.pages as ExtractedPage[]) {
    pagesMap.set(p.page_pdf, p.text);
  }

  it('validates the complete initial seed release against source PDF extraction', () => {
    const result = validateRegistryRelease(seedRelease, pagesMap);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('enforces schema rules: GoUp requires page_pdf and Provisional requires register_id', () => {
    // Missing page_pdf on GoUp
    const invalidGoUp = {
      id: 'TEST_GOUP',
      kind: 'Gate',
      status: 'active',
      strength: 'firm rule',
      provenance: 'GoUp',
      statement_verbatim: 'Some text',
      workflows: ['W1'],
    };
    expect(RegistryEntrySchema.safeParse(invalidGoUp).success).toBe(false);

    // Missing register_id on Provisional
    const invalidProvisional = {
      id: 'TEST_PV',
      kind: 'Gate',
      status: 'active',
      strength: 'provisional',
      provenance: 'Provisional',
      statement_verbatim: 'Provisional, not GoUp method: text',
      workflows: ['W1'],
    };
    expect(RegistryEntrySchema.safeParse(invalidProvisional).success).toBe(false);

    // Provisional with non-provisional strength
    const wrongStrength = {
      id: 'TEST_PV_2',
      kind: 'Gate',
      status: 'active',
      strength: 'firm rule',
      provenance: 'Provisional',
      register_id: 'PV-01',
      statement_verbatim: 'Provisional, not GoUp method: text',
      workflows: ['W1'],
    };
    expect(RegistryEntrySchema.safeParse(wrongStrength).success).toBe(false);
  });

  it('Hard Rule 10: rejects any entry containing the stray note from toolkit p.5', () => {
    const strayEntry: RegistryEntry = {
      id: 'TEST_STRAY_NOTE',
      kind: 'Gate',
      status: 'active',
      strength: 'firm rule',
      provenance: 'GoUp',
      page_pdf: 5,
      statement_verbatim:
        "This structure is the one I'd keep consistently across all the toolkit documents.",
      workflows: ['W1'],
      verified: true,
      version: '1.0.0',
      overridable_by: [],
      parameters: {},
    };

    const result = validateEntryFidelity(strayEntry, pagesMap);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Hard Rule 10'))).toBe(true);
  });

  it('rejects fabricated or non-substring statements for verified GoUp entries', () => {
    const fabricatedEntry: RegistryEntry = {
      id: 'TEST_FABRICATED',
      kind: 'Gate',
      status: 'active',
      strength: 'firm rule',
      provenance: 'GoUp',
      page_pdf: 5,
      statement_verbatim: 'This is a fabricated statement that never appeared in the GoUp toolkit.',
      workflows: ['W1'],
      verified: true,
      version: '1.0.0',
      overridable_by: [],
      parameters: {},
    };

    const result = validateEntryFidelity(fabricatedEntry, pagesMap);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('fidelity failure'))).toBe(true);
  });

  it('rejects release if content_hash does not match canonical hash of entries', () => {
    const tamperedRelease: RegistryRelease = {
      ...seedRelease,
      content_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    };

    const result = validateRegistryRelease(tamperedRelease, pagesMap);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('content_hash mismatch'))).toBe(true);
  });

  it('loads registry and enforces runtime immutability (cannot be edited silently at runtime)', () => {
    const registry = new RuleRegistry(seedRelease, pagesMap);

    expect(registry.getVersion()).toBe('1.0.0');
    expect(registry.getContentHash()).toBe(seedRelease.content_hash);

    const goRule = registry.getRequiredEntry('GOUP_T1_GO');
    expect(goRule.statement_verbatim).toBe(
      'GO: Business goal + offer + funnel + tracking + creative + sales process are ready.',
    );

    // Attempting to mutate a loaded rule throws at runtime
    expect(() => {
      (goRule as unknown as Record<string, unknown>).statement_verbatim = 'Tampered statement';
    }).toThrow(TypeError);

    expect(() => {
      (goRule.parameters as Record<string, unknown>).newField = 123;
    }).toThrow(TypeError);

    // Lookups work accurately
    const w6Rules = registry.getEntriesByWorkflow('W6');
    expect(w6Rules.length).toBeGreaterThan(5);

    const gateRules = registry.getEntriesByKind('Gate');
    expect(gateRules.length).toBeGreaterThan(5);

    expect(() => registry.getRequiredEntry('NON_EXISTENT')).toThrow(
      'Registry entry not found for ID: "NON_EXISTENT"',
    );
  });
});
