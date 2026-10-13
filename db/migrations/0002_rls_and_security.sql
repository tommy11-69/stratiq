-- ====================================================================
-- Migration: 0002_rls_and_security.sql
-- Description: Row-Level Security (RLS) policies for multi-tenant client isolation
-- Per docs/05_DATA_MODEL.md §3
-- ====================================================================

-- Enable RLS on all tenant-owned tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE provisional_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE engine_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners where applicable
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
ALTER TABLE client_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE context_fields FORCE ROW LEVEL SECURITY;
ALTER TABLE evidence_items FORCE ROW LEVEL SECURITY;
ALTER TABLE provisional_configs FORCE ROW LEVEL SECURITY;
ALTER TABLE engine_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE responses FORCE ROW LEVEL SECURITY;
ALTER TABLE decision_records FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;

-- Helper function to get current transaction-bound client_id
CREATE OR REPLACE FUNCTION app_current_client_id() RETURNS uuid AS $$
BEGIN
    RETURN nullif(current_setting('app.current_client_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 1. clients
CREATE POLICY tenant_isolation_clients ON clients
    FOR ALL
    USING (id = app_current_client_id())
    WITH CHECK (id = app_current_client_id());

-- 2. client_memberships
CREATE POLICY tenant_isolation_client_memberships ON client_memberships
    FOR ALL
    USING (client_id = app_current_client_id())
    WITH CHECK (client_id = app_current_client_id());

-- 3. sessions
CREATE POLICY tenant_isolation_sessions ON sessions
    FOR ALL
    USING (bound_client_id = app_current_client_id())
    WITH CHECK (bound_client_id = app_current_client_id());

-- 4. context_fields
CREATE POLICY tenant_isolation_context_fields ON context_fields
    FOR ALL
    USING (client_id = app_current_client_id())
    WITH CHECK (client_id = app_current_client_id());

-- 5. evidence_items
CREATE POLICY tenant_isolation_evidence_items ON evidence_items
    FOR ALL
    USING (client_id = app_current_client_id())
    WITH CHECK (client_id = app_current_client_id());

-- 6. provisional_configs (Allows global null client_id reads or client-specific configs)
CREATE POLICY tenant_isolation_provisional_configs ON provisional_configs
    FOR ALL
    USING (client_id IS NULL OR client_id = app_current_client_id())
    WITH CHECK (client_id = app_current_client_id());

-- 7. engine_runs
CREATE POLICY tenant_isolation_engine_runs ON engine_runs
    FOR ALL
    USING (client_id = app_current_client_id())
    WITH CHECK (client_id = app_current_client_id());

-- 8. responses
CREATE POLICY tenant_isolation_responses ON responses
    FOR ALL
    USING (client_id = app_current_client_id())
    WITH CHECK (client_id = app_current_client_id());

-- 9. decision_records
CREATE POLICY tenant_isolation_decision_records ON decision_records
    FOR ALL
    USING (client_id = app_current_client_id())
    WITH CHECK (client_id = app_current_client_id());

-- 10. audit_events
CREATE POLICY tenant_isolation_audit_events ON audit_events
    FOR ALL
    USING (client_id IS NULL OR client_id = app_current_client_id())
    WITH CHECK (client_id IS NULL OR client_id = app_current_client_id());

-- 11. Application role without superuser / BYPASSRLS privileges
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stratiq_app_role') THEN
        CREATE ROLE stratiq_app_role;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO stratiq_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO stratiq_app_role;
