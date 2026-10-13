-- ====================================================================
-- Migration: 0003_append_only_triggers.sql
-- Description: Enforce append-only history and immutable records
-- Per docs/05_DATA_MODEL.md §4
-- ====================================================================

-- 1. Immutable trigger function for strictly immutable tables (engine_runs, audit_events, responses)
CREATE OR REPLACE FUNCTION prevent_mutation_or_delete() RETURNS trigger AS $$
BEGIN
    -- Governed deletion exception per docs/05_DATA_MODEL.md §1 & §4 (PV-32)
    -- Authorised admin hard purge can delete engine_runs and responses when app.is_governed_deletion is true.
    -- audit_events is strictly append-only and can never be deleted even during governed purge.
    IF (nullif(current_setting('app.is_governed_deletion', true), '') = 'true') THEN
        IF (TG_OP = 'DELETE' AND TG_TABLE_NAME != 'audit_events') THEN
            RETURN OLD;
        END IF;
    END IF;
    RAISE EXCEPTION 'ERR_IMMUTABLE_RECORD: Mutation or deletion on % is strictly forbidden. History is append-only.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Trigger on engine_runs
CREATE TRIGGER trg_immutable_engine_runs
    BEFORE UPDATE OR DELETE ON engine_runs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_mutation_or_delete();

-- Trigger on audit_events
CREATE TRIGGER trg_immutable_audit_events
    BEFORE UPDATE OR DELETE ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_mutation_or_delete();

-- Trigger on responses
CREATE TRIGGER trg_immutable_responses
    BEFORE UPDATE OR DELETE ON responses
    FOR EACH ROW
    EXECUTE FUNCTION prevent_mutation_or_delete();

-- 2. Trigger on decision_records: committed decisions cannot be updated or deleted
CREATE OR REPLACE FUNCTION protect_committed_decision() RETURNS trigger AS $$
BEGIN
    IF (nullif(current_setting('app.is_governed_deletion', true), '') = 'true' AND TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    IF (TG_OP = 'DELETE') THEN
        IF (OLD.status = 'committed') THEN
            RAISE EXCEPTION 'ERR_IMMUTABLE_COMMITTED_DECISION: Committed decision record % cannot be deleted.', OLD.id;
        END IF;
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status = 'committed') THEN
            RAISE EXCEPTION 'ERR_IMMUTABLE_COMMITTED_DECISION: Committed decision record % cannot be modified.', OLD.id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_committed_decision
    BEFORE UPDATE OR DELETE ON decision_records
    FOR EACH ROW
    EXECUTE FUNCTION protect_committed_decision();

-- 3. Trigger on rule_registry_releases & entries: released registries cannot be mutated
CREATE OR REPLACE FUNCTION protect_released_registry() RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        IF (OLD.status = 'released') THEN
            RAISE EXCEPTION 'ERR_IMMUTABLE_RELEASED_REGISTRY: Released registry % cannot be deleted.', OLD.id;
        END IF;
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status = 'released' AND NEW.status != 'retired') THEN
            RAISE EXCEPTION 'ERR_IMMUTABLE_RELEASED_REGISTRY: Released registry % cannot be modified except to retire.', OLD.id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_released_registry
    BEFORE UPDATE OR DELETE ON rule_registry_releases
    FOR EACH ROW
    EXECUTE FUNCTION protect_released_registry();
