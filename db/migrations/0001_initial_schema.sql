-- ====================================================================
-- Migration: 0001_initial_schema.sql
-- Description: Core entity schema for GoUp Marketing Intelligence Agent
-- Per docs/05_DATA_MODEL.md
-- ====================================================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_subject text UNIQUE NOT NULL,
    email text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    disabled_at timestamptz NULL
);

-- 2. Clients
CREATE TABLE IF NOT EXISTS clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name text NOT NULL,
    business_type text NULL,
    market text NULL,
    currency char(3) NULL,
    language text NULL,
    timezone text NULL,
    created_by uuid NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    context_version integer NOT NULL DEFAULT 1
);

-- 3. Client Memberships
CREATE TABLE IF NOT EXISTS client_memberships (
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'marketer', 'viewer')),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (client_id, user_id)
);

-- 4. Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    bound_client_id uuid NOT NULL REFERENCES clients(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz NULL,
    session_version integer NOT NULL DEFAULT 1
);

-- 5. Context Fields (Append-only versioning per field)
CREATE TABLE IF NOT EXISTS context_fields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    field_key text NOT NULL,
    value_json jsonb NOT NULL,
    value_type text NOT NULL,
    status text NOT NULL CHECK (status IN ('confirmed', 'unconfirmed', 'stale', 'conflict', 'invalid')),
    basis text NOT NULL CHECK (basis IN ('confirmed', 'assumed', 'derived', 'default')),
    source_label text NOT NULL,
    source_system text NULL,
    owner_user_id uuid NULL REFERENCES users(id),
    confirmed_by uuid NULL REFERENCES users(id),
    confirmed_at timestamptz NULL,
    valid_from timestamptz NOT NULL DEFAULT now(),
    supersedes_id uuid NULL REFERENCES context_fields(id),
    version integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, field_key, version)
);

-- 6. Evidence Items
CREATE TABLE IF NOT EXISTS evidence_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    session_id uuid NOT NULL REFERENCES sessions(id),
    workflow text NOT NULL CHECK (workflow IN ('W1', 'W5', 'W6')),
    field_key text NOT NULL,
    value_json jsonb NOT NULL,
    value_type text NOT NULL,
    unit text NULL,
    currency text NULL,
    period_start date NULL,
    period_end date NULL,
    source_label text NOT NULL,
    source_system text NULL,
    basis text NOT NULL CHECK (basis IN ('confirmed', 'assumed', 'derived', 'default')),
    status text NOT NULL CHECK (status IN ('confirmed', 'unconfirmed', 'stale', 'conflict', 'invalid')),
    confirmed_by uuid NULL REFERENCES users(id),
    confirmed_at timestamptz NULL,
    supersedes_id uuid NULL REFERENCES evidence_items(id),
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT check_period_order CHECK (period_start IS NULL OR period_end IS NULL OR period_start <= period_end)
);

-- 7. Rule Registry Releases
CREATE TABLE IF NOT EXISTS rule_registry_releases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version text UNIQUE NOT NULL,
    content_hash text NOT NULL,
    released_by text NOT NULL,
    released_at timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL CHECK (status IN ('draft', 'released', 'retired'))
);

-- 8. Rule Registry Entries
CREATE TABLE IF NOT EXISTS rule_registry_entries (
    id text NOT NULL,
    release_id uuid NOT NULL REFERENCES rule_registry_releases(id) ON DELETE CASCADE,
    kind text NOT NULL,
    status text NOT NULL,
    strength text NOT NULL,
    page_pdf integer NULL,
    page_printed integer NULL,
    statement_verbatim text NOT NULL,
    parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
    workflows text[] NOT NULL DEFAULT '{}',
    register_id text NULL,
    default_value jsonb NULL,
    overridable_by text[] NOT NULL DEFAULT '{}',
    verified boolean NOT NULL DEFAULT false,
    PRIMARY KEY (release_id, id)
);

-- 9. Provisional Configurations
CREATE TABLE IF NOT EXISTS provisional_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NULL REFERENCES clients(id) ON DELETE CASCADE,
    register_id text NOT NULL,
    value_json jsonb NOT NULL,
    status text NOT NULL CHECK (status IN ('draft', 'confirmed', 'retired')),
    confirmed_by uuid NULL REFERENCES users(id),
    confirmed_at timestamptz NULL,
    version integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    supersedes_id uuid NULL REFERENCES provisional_configs(id)
);

-- 10. Engine Runs (Immutable snapshots)
CREATE TABLE IF NOT EXISTS engine_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    session_id uuid NOT NULL REFERENCES sessions(id),
    workflow text NOT NULL CHECK (workflow IN ('W1', 'W5', 'W6')),
    input_snapshot jsonb NOT NULL,
    input_snapshot_hash text NOT NULL,
    result_json jsonb NOT NULL,
    result_hash text NOT NULL,
    engine_version text NOT NULL,
    formula_version text NOT NULL,
    registry_release_id uuid NOT NULL REFERENCES rule_registry_releases(id),
    provisional_config_snapshot jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    replay_of_run_id uuid NULL REFERENCES engine_runs(id)
);

-- 11. Responses
CREATE TABLE IF NOT EXISTS responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    run_id uuid NOT NULL REFERENCES engine_runs(id),
    segments_json jsonb NOT NULL,
    figure_bindings_json jsonb NOT NULL,
    output_gate_status text NOT NULL CHECK (output_gate_status IN ('passed', 'rejected', 'fallback')),
    narrator_version text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 12. Decision Records
CREATE TABLE IF NOT EXISTS decision_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    workflow text NOT NULL CHECK (workflow IN ('W1', 'W5', 'W6')),
    kind text NOT NULL CHECK (kind IN ('launch', 'learning', 'scaling', 'human_commit', 'override', 'discard')),
    status text NOT NULL CHECK (status IN ('draft', 'committed', 'discarded')),
    run_id uuid NULL REFERENCES engine_runs(id),
    payload_json jsonb NOT NULL,
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    supersedes_id uuid NULL REFERENCES decision_records(id),
    reason text NULL
);

-- 13. Audit Events (Append-only)
CREATE TABLE IF NOT EXISTS audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NULL,
    actor_user_id uuid NULL REFERENCES users(id),
    event_type text NOT NULL,
    target_type text NULL,
    target_id text NULL,
    metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance and isolation
CREATE INDEX IF NOT EXISTS idx_context_fields_client ON context_fields (client_id, field_key, version DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_items_client ON evidence_items (client_id, workflow, field_key);
CREATE INDEX IF NOT EXISTS idx_engine_runs_client ON engine_runs (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_records_client ON decision_records (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_client ON audit_events (client_id, created_at DESC);
