import { createHash } from 'node:crypto';

/**
 * Deterministic canonical JSON serialization.
 * - Sorts object keys recursively
 * - Filters out undefined keys
 * - Encodes decimals/primitives deterministically
 */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const elements = value.map((v) => canonicalJsonStringify(v));
    return `[${elements.join(',')}]`;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const entries: string[] = [];
    for (const key of keys) {
      const val = (value as Record<string, unknown>)[key];
      if (val !== undefined) {
        entries.push(`${JSON.stringify(key)}:${canonicalJsonStringify(val)}`);
      }
    }
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

/**
 * Computes deterministic SHA-256 hash of canonical JSON representation.
 */
export function canonicalHash(value: unknown): string {
  const canonicalStr = canonicalJsonStringify(value);
  return createHash('sha256').update(canonicalStr, 'utf8').digest('hex');
}
