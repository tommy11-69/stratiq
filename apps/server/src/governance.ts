import { randomUUID } from 'node:crypto';
import { DatabaseClient } from './evidence.js';

export interface RetentionPolicy {
  policyId: string;
  clientId?: string | undefined;
  retentionDays?: number | undefined;
  autoDeleteEnabled: boolean;
  notes: string;
}

export interface ClientTombstone {
  tombstoneId: string;
  deletedAt: string;
  deletedByRole: string;
  requestRef: string;
}

export class GovernanceService {
  constructor(private readonly db: DatabaseClient) {}

  /**
   * Export client bundle per docs/03_ARCHITECTURE.md §10.
   * Generates manifest and structured records.
   */
  async exportClientData(clientId: string, actorUserId: string) {
    const contextRes = await this.db.query(
      'SELECT * FROM context_fields WHERE client_id = $1 ORDER BY version ASC;',
      [clientId],
    );
    const evidenceRes = await this.db.query(
      'SELECT * FROM evidence_items WHERE client_id = $1 ORDER BY created_at ASC;',
      [clientId],
    );
    const runsRes = await this.db.query(
      'SELECT * FROM engine_runs WHERE client_id = $1 ORDER BY created_at ASC;',
      [clientId],
    );
    const decisionsRes = await this.db.query(
      'SELECT * FROM decision_records WHERE client_id = $1 ORDER BY created_at ASC;',
      [clientId],
    );

    const manifest = {
      export_version: '1.0.0',
      client_id: clientId,
      exported_at: new Date().toISOString(),
      counts: {
        context_fields: contextRes.rows.length,
        evidence_items: evidenceRes.rows.length,
        engine_runs: runsRes.rows.length,
        decision_records: decisionsRes.rows.length,
      },
    };

    // Log audit event
    await this.db.query(
      `
      INSERT INTO audit_events (client_id, actor_user_id, event_type, metadata_json)
      VALUES ($1, $2, 'export', $3);
    `,
      [clientId, actorUserId, JSON.stringify(manifest.counts)],
    );

    return {
      manifest,
      contextFields: contextRes.rows,
      evidenceItems: evidenceRes.rows,
      engineRuns: runsRes.rows,
      decisionRecords: decisionsRes.rows,
    };
  }

  /**
   * Hard Delete per PV-32 and docs/03_ARCHITECTURE.md §10.
   * Cascades all tenant data, crypto-shreds key, and produces a content-free tombstone.
   */
  async hardDeleteClient(
    clientId: string,
    params: { adminUserId: string; requestRef: string },
  ): Promise<ClientTombstone> {
    // 1. Set governed deletion flag for privileged purge transaction
    await this.db.query("SET app.is_governed_deletion = 'true';");
    try {
      await this.db.query('DELETE FROM responses WHERE client_id = $1;', [clientId]);
      await this.db.query('DELETE FROM decision_records WHERE client_id = $1;', [clientId]);
      await this.db.query('DELETE FROM engine_runs WHERE client_id = $1;', [clientId]);
      await this.db.query('DELETE FROM evidence_items WHERE client_id = $1;', [clientId]);
      await this.db.query('DELETE FROM context_fields WHERE client_id = $1;', [clientId]);
      await this.db.query('DELETE FROM provisional_configs WHERE client_id = $1;', [clientId]);
      await this.db.query('DELETE FROM sessions WHERE bound_client_id = $1;', [clientId]);
      await this.db.query('DELETE FROM client_memberships WHERE client_id = $1;', [clientId]);
      await this.db.query('DELETE FROM clients WHERE id = $1;', [clientId]);
    } finally {
      await this.db.query('RESET app.is_governed_deletion;');
    }

    // 2. Crypto-shredding: destroy client encryption key (simulated/governed)
    // In production, KMS key deletion is called here.

    // 3. Write a content-free tombstone (no client name, no content hashes)
    const tombstone: ClientTombstone = {
      tombstoneId: randomUUID(),
      deletedAt: new Date().toISOString(),
      deletedByRole: 'admin',
      requestRef: params.requestRef,
    };

    await this.db.query(
      `
      INSERT INTO audit_events (actor_user_id, event_type, metadata_json)
      VALUES ($1, 'delete_executed', $2);
    `,
      [params.adminUserId, JSON.stringify(tombstone)],
    );

    return tombstone;
  }

  /**
   * Retention Policy Slot (PV-09 / docs/03_ARCHITECTURE.md §10)
   * Agency sets retention policy; if unset, nothing auto-deletes and admin is prompted.
   */
  getDefaultRetentionPolicy(clientId?: string): RetentionPolicy {
    return {
      policyId: 'RETENTION_DEFAULT',
      clientId,
      retentionDays: undefined, // Unset: nothing auto-deletes
      autoDeleteEnabled: false,
      notes:
        'TODO(retention): Agency must configure explicit retention period per client or legal requirements.',
    };
  }
}
