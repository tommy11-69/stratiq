# 05. Data Model

PostgreSQL 16 persistence contract. Database controls are the security boundary; UI prompts alone are not access control.

## 1. Principles
- Every client-owned row has `client_id` and RLS. One active client per session.
- Derive client scope from authenticated server session binding, never arbitrary request JSON.
- Append-only history: updates create new versions/linked records. Committed runs/verdicts are never edited.
- Preserve provenance, evidence status, confirmation metadata, source and version.
- Hard deletion is a governed exception to append-only history: remove client-identifying/content data from tables, snapshots, responses, indexes and object storage. Keep only a non-identifying deletion event if appropriate. Never claim personal content survives deletion because logs are append-only.
- Never store Meta tokens, passwords or secrets. Scan/redact before persistence.
- UUID identifiers; timestamps are `timestamptz`. The engine receives explicit date/time inputs.
- Use canonical JSON and hashes for snapshots/replay.

## 2. Entities

### `users`
`id uuid PK`, `auth_subject text UNIQUE NOT NULL`, optional minimized `email`, `created_at timestamptz`, `disabled_at timestamptz NULL`.

### `clients`
`id uuid PK`, `display_name text NOT NULL`, optional `business_type`, `market`, `currency char(3)`, `language`, `timezone`, `created_by uuid`, `created_at`, `deleted_at`, `context_version integer NOT NULL DEFAULT 1`.

### `client_memberships`
`client_id uuid`, `user_id uuid`, `role` constrained to `owner|marketer|viewer`, `created_at`; primary key `(client_id,user_id)`.

### `sessions`
`id uuid PK`, `user_id uuid`, `bound_client_id uuid`, `created_at`, `ended_at NULL`, `session_version integer`. Binding requires membership. Rebinding is an explicit audited action and starts a new context snapshot.

### `context_fields`
Versioned context; never overwrite history:
- `id uuid PK`, `client_id uuid NOT NULL`, `field_key text NOT NULL`, `value_json jsonb NOT NULL`, `value_type text NOT NULL`
- `status` enum: confirmed/unconfirmed/stale/conflict/invalid
- `basis` enum: confirmed/assumed/derived/default
- `source_label text NOT NULL`, `source_system text NULL`, `owner_user_id uuid NULL`, `confirmed_by uuid NULL`, `confirmed_at timestamptz NULL`
- `valid_from timestamptz NOT NULL`, `supersedes_id uuid NULL`, `version integer NOT NULL`, `created_at timestamptz NOT NULL`
- unique `(client_id,field_key,version)`.

### `evidence_items`
- `id uuid PK`, `client_id uuid NOT NULL`, `session_id uuid NOT NULL`, `workflow` W1/W5/W6, `field_key text NOT NULL`, `value_json jsonb NOT NULL`, `value_type text NOT NULL`
- optional `unit`, `currency`, `period_start date`, `period_end date`; `source_label text NOT NULL`, `source_system text NULL`
- `basis`, `status`, `confirmed_by`, `confirmed_at`, `supersedes_id`, `version`, `created_at`.
- Enforce period ordering if both dates exist.

### `rule_registry_releases`
`id uuid PK`, `version text UNIQUE NOT NULL`, `content_hash text NOT NULL`, `released_by uuid NOT NULL`, `released_at`, `status` draft/released/retired.

### `rule_registry_entries`
`id text`, `release_id uuid`, `kind`, `status`, `strength`, `page_pdf integer NULL`, `page_printed integer NULL`, `statement_verbatim text NOT NULL`, `parameters jsonb NOT NULL DEFAULT '{}'`, `workflows text[] NOT NULL DEFAULT '{}'`, `register_id text NULL`, `default_value jsonb NULL`, `overridable_by text[] NOT NULL DEFAULT '{}'`, `verified boolean NOT NULL DEFAULT false`; primary key `(release_id,id)`.

### `provisional_configs`
`id uuid PK`, `client_id uuid NULL` (null = global config), `register_id text NOT NULL`, `value_json jsonb NOT NULL`, `status` draft/confirmed/retired, `confirmed_by`, `confirmed_at`, `version integer NOT NULL`, `created_at`, `supersedes_id uuid NULL`.

### `engine_runs`
Immutable snapshot:
`id uuid PK`, `client_id uuid NOT NULL`, `session_id uuid NOT NULL`, `workflow` W1/W5/W6, `input_snapshot jsonb NOT NULL`, `input_snapshot_hash text NOT NULL`, `result_json jsonb NOT NULL`, `result_hash text NOT NULL`, `engine_version text NOT NULL`, `formula_version text NOT NULL`, `registry_release_id uuid NOT NULL`, `provisional_config_snapshot jsonb NOT NULL`, `created_at`, `replay_of_run_id uuid NULL`.

### `responses`
`id uuid PK`, `client_id uuid NOT NULL`, `run_id uuid NOT NULL`, `segments_json jsonb NOT NULL`, `figure_bindings_json jsonb NOT NULL`, `output_gate_status` passed/rejected/fallback, `narrator_version NULL`, `created_at`.

### `decision_records`
Drafts, commits, overrides and logs are distinct linked events:
`id uuid PK`, `client_id uuid NOT NULL`, `workflow` W1/W5/W6, `kind` launch/learning/scaling/human_commit/override/discard, `status` draft/committed/discarded, `run_id NULL`, `payload_json jsonb NOT NULL`, `created_by uuid NOT NULL`, `created_at`, `supersedes_id NULL`, `reason NULL`.

### `audit_events`
`id uuid PK`, optional `client_id`, `actor_user_id`, `event_type NOT NULL`, optional `target_type`, `target_id`, `metadata_json jsonb NOT NULL DEFAULT '{}'`, `created_at`. Never store secrets or unredacted pasted text.

## 3. RLS and session scoping
Enable RLS on all client-owned tables. A transaction-local server-set `app.current_client_id` and `app.current_user_id` may be used only after server authentication. Policies require user membership, row client matching bound client, and session bound client matching transaction client. Deny by default. No privileged service role in browser code. Test cross-client SELECT/INSERT/UPDATE/DELETE. Registry runtime access is read-only; release authoring uses a privileged workflow.

## 4. Append-only enforcement
- Normal roles cannot mutate/delete `engine_runs`, released registry releases/entries, committed decisions, or audit events.
- Database triggers reject forbidden mutation.
- Corrections create superseding records.
- Draft state transitions are limited and recorded as append-only events.
- Privileged erasure must remove all client content, including snapshots/responses/blobs; non-identifying deletion proof only.

## 5. Evidence confirmation transaction
1. Extractor creates staged evidence as `unconfirmed`.
2. UI displays value, unit, currency, period, source and parse warnings.
3. User confirms/rejects a staged item; request includes item ID and server-computed content hash.
4. Server validates session scope, membership, unchanged hash, schema and credential-scan status.
5. Server writes a new confirmed evidence version; staged record is not mutated.
6. Only eligible confirmed values enter engine snapshot. Model cannot call confirmation endpoints.

## 6. Context freshness
Each context field has owner/source/confirmation date/version. Volatile values (campaign performance, tracking, capacity, offer, sales cycle, guardrails) require configured freshness policy. No hidden default interval. If stale or no applicable policy, ask for reconfirmation before W6. If W6 has no review interval, reconfirm tracking. Conflicts block affected conclusions until resolved.

## 7. Export, deletion, retention
Export is client-scoped and includes schema/version metadata. Delete from primary tables, snapshots, responses, indexes and object storage, plus backups under documented policy. Retention duration is an owner/legal decision, not a universal value.

## 8. Indexes and constraints
Index all client-owned tables on `client_id`; also index `engine_runs(client_id,created_at DESC)`, `evidence_items(client_id,workflow,field_key)`, `context_fields(client_id,field_key,version DESC)`, `decision_records(client_id,created_at DESC)`. Validate enum values, period order and non-negative counts. Money uses `numeric` or decimal strings, never binary float. Require source/status/basis/unit/period where field schema demands it.
