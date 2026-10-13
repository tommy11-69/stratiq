import { RuleKind, Workflow } from '@stratiq/shared';
import { validateRegistryRelease } from './fidelity.js';
import { RegistryEntry, RegistryRelease } from './schema.js';

function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj as Readonly<T>;
  }

  Object.freeze(obj);

  for (const key of Object.getOwnPropertyNames(obj)) {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return obj as Readonly<T>;
}

export class RuleRegistry {
  private readonly release: Readonly<RegistryRelease>;
  private readonly entriesById: ReadonlyMap<string, Readonly<RegistryEntry>>;
  private readonly entriesByWorkflow: ReadonlyMap<Workflow, ReadonlyArray<Readonly<RegistryEntry>>>;
  private readonly entriesByKind: ReadonlyMap<RuleKind, ReadonlyArray<Readonly<RegistryEntry>>>;

  constructor(release: RegistryRelease, pdfPagesMap?: Map<number, string>) {
    // 1. Validate release integrity and fidelity before loading
    const validation = validateRegistryRelease(release, pdfPagesMap);
    if (!validation.valid) {
      throw new Error(
        `Failed to initialize RuleRegistry due to fidelity violations:\n${validation.errors.join('\n')}`,
      );
    }

    // 2. Deep-freeze the release to prevent runtime mutation
    this.release = deepFreeze(structuredClone(release));

    // 3. Build indexed lookups
    const byId = new Map<string, Readonly<RegistryEntry>>();
    const byWf = new Map<Workflow, RegistryEntry[]>();
    const byKind = new Map<RuleKind, RegistryEntry[]>();

    for (const entry of this.release.entries) {
      byId.set(entry.id, entry);

      for (const wf of entry.workflows) {
        if (!byWf.has(wf)) byWf.set(wf, []);
        byWf.get(wf)!.push(entry);
      }

      if (!byKind.has(entry.kind)) byKind.set(entry.kind, []);
      byKind.get(entry.kind)!.push(entry);
    }

    this.entriesById = byId;
    this.entriesByWorkflow = byWf;
    this.entriesByKind = byKind;
  }

  public getRelease(): Readonly<RegistryRelease> {
    return this.release;
  }

  public getVersion(): string {
    return this.release.version;
  }

  public getContentHash(): string {
    return this.release.content_hash;
  }

  public getEntry(id: string): Readonly<RegistryEntry> | undefined {
    return this.entriesById.get(id);
  }

  public getRequiredEntry(id: string): Readonly<RegistryEntry> {
    const entry = this.entriesById.get(id);
    if (!entry) {
      throw new Error(`Registry entry not found for ID: "${id}"`);
    }
    return entry;
  }

  public getEntriesByWorkflow(workflow: Workflow): ReadonlyArray<Readonly<RegistryEntry>> {
    return this.entriesByWorkflow.get(workflow) ?? [];
  }

  public getEntriesByKind(kind: RuleKind): ReadonlyArray<Readonly<RegistryEntry>> {
    return this.entriesByKind.get(kind) ?? [];
  }

  public getAllEntries(): ReadonlyArray<Readonly<RegistryEntry>> {
    return this.release.entries;
  }
}
