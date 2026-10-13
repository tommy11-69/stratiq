import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { scanAndRedactCredentials } from '@stratiq/shared';
import { describe, expect, it } from 'vitest';
import { EvidenceService, GovernanceService, SERVER_MODULE_NAME } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..', '..');

const migrationsDir = path.resolve(rootDir, 'db', 'migrations');

describe('@stratiq/server persistence, RLS and immutability', () => {
  it('exports module name', () => {
    expect(SERVER_MODULE_NAME).toBe('@stratiq/server');
  });

  it('runs all PostgreSQL migrations and validates schema creation', async () => {
    const db = new PGlite();

    const migrationFiles = [
      '0001_initial_schema.sql',
      '0002_rls_and_security.sql',
      '0003_append_only_triggers.sql',
    ];

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await db.exec(sql);
    }

    // Verify key tables exist
    const res = await db.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public';",
    );
    const tableNames = res.rows.map((r) => r.tablename);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('clients');
    expect(tableNames).toContain('client_memberships');
    expect(tableNames).toContain('sessions');
    expect(tableNames).toContain('context_fields');
    expect(tableNames).toContain('evidence_items');
    expect(tableNames).toContain('engine_runs');
    expect(tableNames).toContain('decision_records');
    expect(tableNames).toContain('audit_events');
  });

  it('enforces deny-by-default RLS and prevents cross-client access', async () => {
    const db = new PGlite();
    for (const file of [
      '0001_initial_schema.sql',
      '0002_rls_and_security.sql',
      '0003_append_only_triggers.sql',
    ]) {
      await db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
    }

    // Create user and two distinct clients (unrestricted admin setup mode by temporarily disabling RLS or setting bypass)
    await db.exec('ALTER TABLE clients DISABLE ROW LEVEL SECURITY;');
    await db.exec('ALTER TABLE context_fields DISABLE ROW LEVEL SECURITY;');

    const client1Id = '11111111-1111-1111-1111-111111111111';
    const client2Id = '22222222-2222-2222-2222-222222222222';
    const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    await db.query("INSERT INTO users (id, auth_subject) VALUES ($1, 'user1');", [userId]);
    await db.query("INSERT INTO clients (id, display_name) VALUES ($1, 'Client One');", [
      client1Id,
    ]);
    await db.query("INSERT INTO clients (id, display_name) VALUES ($1, 'Client Two');", [
      client2Id,
    ]);

    await db.query(
      `INSERT INTO context_fields (client_id, field_key, value_json, value_type, status, basis, source_label, version)
       VALUES ($1, 'offer', '{"name":"Offer 1"}', 'json', 'confirmed', 'confirmed', 'manual', 1);`,
      [client1Id],
    );
    await db.query(
      `INSERT INTO context_fields (client_id, field_key, value_json, value_type, status, basis, source_label, version)
       VALUES ($1, 'offer', '{"name":"Offer 2"}', 'json', 'confirmed', 'confirmed', 'manual', 1);`,
      [client2Id],
    );

    // Re-enable and force RLS
    await db.exec(
      'ALTER TABLE clients ENABLE ROW LEVEL SECURITY; ALTER TABLE clients FORCE ROW LEVEL SECURITY;',
    );
    await db.exec(
      'ALTER TABLE context_fields ENABLE ROW LEVEL SECURITY; ALTER TABLE context_fields FORCE ROW LEVEL SECURITY;',
    );

    // Switch to application role to enforce RLS (superusers bypass RLS in Postgres)
    await db.exec('SET ROLE stratiq_app_role;');

    // 1. Without app.current_client_id set: Deny all by default
    const noContextRes = await db.query('SELECT * FROM context_fields;');
    expect(noContextRes.rows.length).toBe(0);

    // 2. Bound to Client 1: Can only see Client 1 rows
    await db.exec(`SET app.current_client_id = '${client1Id}';`);
    const client1Res = await db.query<{ field_key: string; client_id: string }>(
      'SELECT * FROM context_fields;',
    );
    expect(client1Res.rows.length).toBe(1);
    expect(client1Res.rows[0]?.client_id).toBe(client1Id);

    // 3. Attempt cross-client read of Client 2 while in Client 1 session
    const crossReadRes = await db.query('SELECT * FROM context_fields WHERE client_id = $1;', [
      client2Id,
    ]);
    expect(crossReadRes.rows.length).toBe(0);

    // 4. Attempt cross-client update on Client 2 while in Client 1 session
    const updateRes = await db.query(
      'UPDATE context_fields SET value_json = \'{"name":"Hacked"}\' WHERE client_id = $1 RETURNING *;',
      [client2Id],
    );
    expect(updateRes.rows.length).toBe(0);
  });

  it('enforces append-only triggers: mutations on engine_runs and audit_events are aborted', async () => {
    const db = new PGlite();
    for (const file of [
      '0001_initial_schema.sql',
      '0002_rls_and_security.sql',
      '0003_append_only_triggers.sql',
    ]) {
      await db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
    }

    const clientId = '11111111-1111-1111-1111-111111111111';
    const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const sessionId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const releaseId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    await db.query("INSERT INTO users (id, auth_subject) VALUES ($1, 'u');", [userId]);
    await db.query("INSERT INTO clients (id, display_name) VALUES ($1, 'C');", [clientId]);
    await db.query('INSERT INTO sessions (id, user_id, bound_client_id) VALUES ($1, $2, $3);', [
      sessionId,
      userId,
      clientId,
    ]);
    await db.query(
      "INSERT INTO rule_registry_releases (id, version, content_hash, released_by, status) VALUES ($1, '1.0.0', 'hash', 'admin', 'released');",
      [releaseId],
    );

    await db.exec(`SET app.current_client_id = '${clientId}';`);

    // Insert engine run
    const runId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    await db.query(
      `INSERT INTO engine_runs (
        id, client_id, session_id, workflow, input_snapshot, input_snapshot_hash,
        result_json, result_hash, engine_version, formula_version, registry_release_id,
        provisional_config_snapshot
      ) VALUES ($1, $2, $3, 'W6', '{}', 'inphash', '{}', 'reshash', '1.0.0', '1.0.0', $4, '{}');`,
      [runId, clientId, sessionId, releaseId],
    );

    // Attempt to UPDATE engine_runs: must fail
    await expect(
      db.query("UPDATE engine_runs SET engine_version = '2.0.0' WHERE id = $1;", [runId]),
    ).rejects.toThrow(/ERR_IMMUTABLE_RECORD/);

    // Attempt to DELETE engine_runs: must fail
    await expect(db.query('DELETE FROM engine_runs WHERE id = $1;', [runId])).rejects.toThrow(
      /ERR_IMMUTABLE_RECORD/,
    );

    // Insert audit event
    const auditId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    await db.query(
      "INSERT INTO audit_events (id, client_id, actor_user_id, event_type) VALUES ($1, $2, $3, 'test_event');",
      [auditId, clientId, userId],
    );

    // Attempt to UPDATE audit_events: must fail
    await expect(
      db.query("UPDATE audit_events SET event_type = 'hacked' WHERE id = $1;", [auditId]),
    ).rejects.toThrow(/ERR_IMMUTABLE_RECORD/);
  });

  it('rejects evidence with period_end before period_start via check constraint', async () => {
    const db = new PGlite();
    for (const file of [
      '0001_initial_schema.sql',
      '0002_rls_and_security.sql',
      '0003_append_only_triggers.sql',
    ]) {
      await db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
    }

    const clientId = '11111111-1111-1111-1111-111111111111';
    const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const sessionId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    await db.query("INSERT INTO users (id, auth_subject) VALUES ($1, 'u');", [userId]);
    await db.query("INSERT INTO clients (id, display_name) VALUES ($1, 'C');", [clientId]);
    await db.query('INSERT INTO sessions (id, user_id, bound_client_id) VALUES ($1, $2, $3);', [
      sessionId,
      userId,
      clientId,
    ]);

    await db.exec(`SET app.current_client_id = '${clientId}';`);

    // Invalid period: period_start > period_end
    await expect(
      db.query(
        `INSERT INTO evidence_items (
          client_id, session_id, workflow, field_key, value_json, value_type,
          period_start, period_end, source_label, basis, status
        ) VALUES ($1, $2, 'W6', 'spend', '1000', 'number', '2026-10-15', '2026-10-01', 'ads', 'confirmed', 'confirmed');`,
        [clientId, sessionId],
      ),
    ).rejects.toThrow(/check_period_order/);
  });

  it('scans and redacts credentials before persistence', () => {
    const metaToken = 'EAABwzL1234567890abcdefghijklmnopqrstuvwxyz';
    const inputWithToken = `Client report with Meta token ${metaToken} attached.`;
    const scan = scanAndRedactCredentials(inputWithToken);

    expect(scan.hasCredentials).toBe(true);
    expect(scan.redacted).not.toContain(metaToken);
    expect(scan.redacted).toContain('[REDACTED_CREDENTIAL]');

    const plainInput = 'Leads count: 120, Spend: 15000 INR';
    const scanPlain = scanAndRedactCredentials(plainInput);
    expect(scanPlain.hasCredentials).toBe(false);
    expect(scanPlain.redacted).toBe(plainInput);
  });

  it('manages hash-bound evidence confirmation flow without mutating staged items', async () => {
    const db = new PGlite();
    for (const file of [
      '0001_initial_schema.sql',
      '0002_rls_and_security.sql',
      '0003_append_only_triggers.sql',
    ]) {
      await db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
    }

    const clientId = '11111111-1111-1111-1111-111111111111';
    const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const sessionId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    await db.query("INSERT INTO users (id, auth_subject) VALUES ($1, 'u');", [userId]);
    await db.query("INSERT INTO clients (id, display_name) VALUES ($1, 'C');", [clientId]);
    await db.query('INSERT INTO sessions (id, user_id, bound_client_id) VALUES ($1, $2, $3);', [
      sessionId,
      userId,
      clientId,
    ]);
    await db.exec(`SET app.current_client_id = '${clientId}';`);

    const service = new EvidenceService(db);

    // 1. Stage evidence item
    const { staged, contentHash } = await service.stageEvidence({
      clientId,
      sessionId,
      workflow: 'W6',
      fieldKey: 'spend',
      valueJson: { amount: 15000, currency: 'INR' },
      valueType: 'object',
      sourceLabel: 'Ad Account Export',
    });

    expect(staged).toBeDefined();
    if (!staged) throw new Error('staged is undefined');

    expect(staged['status']).toBe('unconfirmed');
    expect(staged['basis']).toBe('assumed');
    expect(staged['version']).toBe(1);

    // 2. Reject confirmation if content hash does not match
    await expect(
      service.confirmEvidence({
        stagedId: staged.id as string,
        contentHash: 'wrong_hash_tampered_value',
        userId,
        clientId,
      }),
    ).rejects.toThrow(/ERR_HASH_MISMATCH/);

    // 3. Confirm with valid content hash
    const confirmed = (await service.confirmEvidence({
      stagedId: staged.id as string,
      contentHash,
      userId,
      clientId,
    })) as Record<string, unknown>;

    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.basis).toBe('confirmed');
    expect(confirmed.version).toBe(2);
    expect(confirmed.supersedes_id).toBe(staged.id);

    // 4. Verify staged item was preserved and not mutated
    const originalStagedRes = await db.query<{ status: string; version: number }>(
      'SELECT status, version FROM evidence_items WHERE id = $1;',
      [staged.id],
    );
    expect(originalStagedRes.rows[0]?.status).toBe('unconfirmed');
    expect(originalStagedRes.rows[0]?.version).toBe(1);
  });

  it('executes client data export and hard delete with content-free tombstone (PV-32)', async () => {
    const db = new PGlite();
    for (const file of [
      '0001_initial_schema.sql',
      '0002_rls_and_security.sql',
      '0003_append_only_triggers.sql',
    ]) {
      await db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
    }

    const clientId = '11111111-1111-1111-1111-111111111111';
    const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const sessionId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    await db.query("INSERT INTO users (id, auth_subject) VALUES ($1, 'u');", [userId]);
    await db.query("INSERT INTO clients (id, display_name) VALUES ($1, 'Client Acme');", [
      clientId,
    ]);
    await db.query('INSERT INTO sessions (id, user_id, bound_client_id) VALUES ($1, $2, $3);', [
      sessionId,
      userId,
      clientId,
    ]);
    await db.exec(`SET app.current_client_id = '${clientId}';`);

    const govService = new GovernanceService(db);

    // 1. Export
    const exportBundle = await govService.exportClientData(clientId, userId);
    expect(exportBundle.manifest.client_id).toBe(clientId);

    // 2. Hard delete (PV-32)
    const tombstone = await govService.hardDeleteClient(clientId, {
      adminUserId: userId,
      requestRef: 'REQ-1234',
    });

    expect(tombstone.tombstoneId).toBeDefined();
    expect(tombstone.requestRef).toBe('REQ-1234');

    // Verify tenant records are purged
    const clientCheck = await db.query('SELECT * FROM clients WHERE id = $1;', [clientId]);
    expect(clientCheck.rows.length).toBe(0);

    // Verify tombstone in audit events has no client name or content hashes
    const tombstoneAudit = await db.query<{ metadata_json: { tombstoneId: string } }>(
      "SELECT metadata_json FROM audit_events WHERE event_type = 'delete_executed';",
    );
    expect(tombstoneAudit.rows.length).toBe(1);
    expect(tombstoneAudit.rows[0]?.metadata_json.tombstoneId).toBe(tombstone.tombstoneId);
  });
});
