import { canonicalHash } from '@stratiq/shared';
import { RegistryEntry, RegistryEntrySchema, RegistryRelease } from './schema.js';

export interface ExtractedPage {
  page_pdf: number;
  text: string;
}

export interface FidelityValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Normalizes text for verbatim substring comparison.
 * Collapses whitespace, normalizes unicode quotes and common PDF ligatures.
 */
export function normalizeToolkitText(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬀ/g, 'ff')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬄ/g, 'ffl')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const BANNED_P5_STRAY_NOTE =
  "this structure is the one i'd keep consistently across all the toolkit documents";

/**
 * Validates a single registry entry against architectural and toolkit fidelity rules.
 */
export function validateEntryFidelity(
  entry: RegistryEntry,
  pdfPagesMap?: Map<number, string>,
): FidelityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Zod Schema validation
  const parsed = RegistryEntrySchema.safeParse(entry);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`Entry [${entry.id}] schema error at ${issue.path.join('.')}: ${issue.message}`);
    }
  }

  // 2. Hard Rule 10: Exclude stray note from toolkit p.5 (AGENTS.md §5.10)
  const normalizedStatement = normalizeToolkitText(entry.statement_verbatim);
  if (
    normalizedStatement.includes(BANNED_P5_STRAY_NOTE) ||
    normalizedStatement.includes("this structure is the one i'd keep")
  ) {
    errors.push(
      `Entry [${entry.id}] violates Hard Rule 10 (AGENTS.md §5.10): The stray drafting note at toolkit p.5 ("This structure is the one I'd keep...") is excluded from all knowledge.`,
    );
  }

  // 3. GoUp provenance validation against toolkit PDF
  if (entry.provenance === 'GoUp') {
    if (!entry.page_pdf) {
      errors.push(`Entry [${entry.id}] has GoUp provenance but is missing page_pdf.`);
    } else {
      if (entry.statement_verbatim.trim() === 'TODO_SEED') {
        if (entry.verified) {
          errors.push(
            `Entry [${entry.id}] cannot be marked verified:true while statement_verbatim is TODO_SEED.`,
          );
        } else {
          warnings.push(`Entry [${entry.id}] is unseeded (TODO_SEED).`);
        }
      } else if (entry.verified) {
        if (pdfPagesMap && pdfPagesMap.has(entry.page_pdf)) {
          const rawPageText = pdfPagesMap.get(entry.page_pdf)!;
          const normalizedPage = normalizeToolkitText(rawPageText);

          if (!normalizedPage.includes(normalizedStatement)) {
            errors.push(
              `Entry [${entry.id}] fidelity failure: statement_verbatim was not found on PDF page ${entry.page_pdf}. Verified GoUp statements must be exact verbatim substrings of the source toolkit.`,
            );
          }
        } else if (pdfPagesMap) {
          errors.push(
            `Entry [${entry.id}] references PDF page ${entry.page_pdf}, which does not exist in extracted PDF pages.`,
          );
        }
      }
    }
  }

  // 4. Provisional rule validation
  if (entry.provenance === 'Provisional') {
    if (!entry.register_id) {
      errors.push(`Entry [${entry.id}] has Provisional provenance but lacks register_id (PV-xx).`);
    }

    const hasNotice =
      entry.statement_verbatim.includes('Provisional, not GoUp method') ||
      (entry.notes && entry.notes.includes('Provisional, not GoUp method'));

    if (!hasNotice) {
      errors.push(
        `Entry [${entry.id}] violates Provisional rule requirement: statement or notes must explicitly state "Provisional, not GoUp method" (AGENTS.md §4).`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates an entire registry release including content hash and entry uniqueness.
 */
export function validateRegistryRelease(
  release: RegistryRelease,
  pdfPagesMap?: Map<number, string>,
): FidelityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const seenIds = new Set<string>();

  for (const entry of release.entries) {
    if (seenIds.has(entry.id)) {
      errors.push(
        `Duplicate registry entry ID detected: "${entry.id}". All entry IDs must be unique.`,
      );
    }
    seenIds.add(entry.id);

    const result = validateEntryFidelity(entry, pdfPagesMap);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Validate release content hash
  const expectedHash = canonicalHash(release.entries);
  if (release.content_hash !== expectedHash) {
    errors.push(
      `Registry release content_hash mismatch. Expected "${expectedHash}", but found "${release.content_hash}".`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
