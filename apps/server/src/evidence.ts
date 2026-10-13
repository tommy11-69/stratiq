import { canonicalHash, scanAndRedactCredentials } from '@stratiq/shared';

export interface DatabaseClient {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export interface StageEvidenceParams {
  clientId: string;
  sessionId: string;
  workflow: 'W1' | 'W5' | 'W6';
  fieldKey: string;
  valueJson: unknown;
  valueType: string;
  unit?: string;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
  sourceLabel: string;
  sourceSystem?: string;
}

export interface ConfirmEvidenceParams {
  stagedId: string;
  contentHash: string;
  userId: string;
  clientId: string;
}

export class EvidenceService {
  constructor(private readonly db: DatabaseClient) {}

  /**
   * Stage an evidence item as unconfirmed.
   * Scans and rejects credentials before persistence.
   */
  async stageEvidence(params: StageEvidenceParams) {
    // 1. Scan for credentials in string representations
    const serialized = JSON.stringify(params.valueJson);
    const scan = scanAndRedactCredentials(serialized);
    if (scan.hasCredentials) {
      throw new Error(
        'SECURITY_VIOLATION: Inbound evidence contains credentials/passwords. Raw credentials cannot be persisted.',
      );
    }

    // 2. Compute canonical content hash
    const contentHash = canonicalHash(params.valueJson);

    // 3. Insert unconfirmed staged item
    const sql = `
      INSERT INTO evidence_items (
        client_id, session_id, workflow, field_key, value_json, value_type,
        unit, currency, period_start, period_end, source_label, source_system,
        basis, status, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'assumed', 'unconfirmed', 1)
      RETURNING *;
    `;

    const res = await this.db.query(sql, [
      params.clientId,
      params.sessionId,
      params.workflow,
      params.fieldKey,
      JSON.stringify(params.valueJson),
      params.valueType,
      params.unit ?? null,
      params.currency ?? null,
      params.periodStart ?? null,
      params.periodEnd ?? null,
      params.sourceLabel,
      params.sourceSystem ?? null,
    ]);

    const staged = res.rows[0];
    if (!staged) {
      throw new Error('Failed to insert staged evidence record.');
    }

    return {
      staged,
      contentHash,
    };
  }

  /**
   * Confirm a staged evidence item.
   * Verifies content hash match, session client scope, and writes a new confirmed version.
   * Staged item is never mutated. Model cannot invoke this transaction.
   */
  async confirmEvidence(params: ConfirmEvidenceParams) {
    // 1. Fetch staged record
    const fetchSql = `
      SELECT * FROM evidence_items
      WHERE id = $1 AND client_id = $2;
    `;
    const stagedRes = await this.db.query(fetchSql, [params.stagedId, params.clientId]);
    if (stagedRes.rows.length === 0) {
      throw new Error(`ERR_NOT_FOUND: Staged evidence item ${params.stagedId} not found.`);
    }

    const staged = stagedRes.rows[0] as Record<string, unknown>;

    // 2. Validate content hash
    const computedHash = canonicalHash(staged.value_json);
    if (computedHash !== params.contentHash) {
      throw new Error(
        `ERR_HASH_MISMATCH: Staged evidence content hash mismatch. Expected ${params.contentHash}, computed ${computedHash}. Confirmation aborted.`,
      );
    }

    // 3. Write a new confirmed version
    const insertConfirmedSql = `
      INSERT INTO evidence_items (
        client_id, session_id, workflow, field_key, value_json, value_type,
        unit, currency, period_start, period_end, source_label, source_system,
        basis, status, confirmed_by, confirmed_at, supersedes_id, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        'confirmed', 'confirmed', $13, now(), $14, $15
      )
      RETURNING *;
    `;

    const nextVersion = ((staged.version as number) || 1) + 1;
    const confirmedRes = await this.db.query(insertConfirmedSql, [
      staged.client_id,
      staged.session_id,
      staged.workflow,
      staged.field_key,
      JSON.stringify(staged.value_json),
      staged.value_type,
      staged.unit,
      staged.currency,
      staged.period_start,
      staged.period_end,
      staged.source_label,
      staged.source_system,
      params.userId,
      staged.id,
      nextVersion,
    ]);

    // 4. Audit the confirmation
    await this.db.query(
      `
      INSERT INTO audit_events (client_id, actor_user_id, event_type, target_type, target_id, metadata_json)
      VALUES ($1, $2, 'value_confirmed', 'evidence_items', $3, $4);
    `,
      [
        params.clientId,
        params.userId,
        confirmedRes.rows[0]?.id,
        JSON.stringify({ staged_id: params.stagedId, version: nextVersion }),
      ],
    );

    return confirmedRes.rows[0];
  }
}
