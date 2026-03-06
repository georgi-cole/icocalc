-- Migration: 1_init_schema.sql
-- Idempotent creation of members, entries, and audit_log tables with
-- trigger functions for updated_by/updated_at stamping and append-only
-- audit logging. Row-Level Security (RLS) is enabled with policies that
-- restrict data access to authenticated members only.

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.members (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role        text        NOT NULL DEFAULT 'member',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    updated_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.entries (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id   uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    title       text        NOT NULL,
    body        text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    updated_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.audit_log (
    id          bigserial   PRIMARY KEY,
    table_name  text        NOT NULL,
    record_id   uuid        NOT NULL,
    operation   text        NOT NULL,  -- INSERT, UPDATE, DELETE
    changed_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at  timestamptz NOT NULL DEFAULT now(),
    old_data    jsonb,
    new_data    jsonb
);

-- ─────────────────────────────────────────────
-- Trigger functions
-- ─────────────────────────────────────────────

-- Automatically stamps updated_at and updated_by on every UPDATE.
CREATE OR REPLACE FUNCTION public.set_updated_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at := now();
    NEW.updated_by := auth.uid();
    RETURN NEW;
END;
$$;

-- Appends a row to audit_log for every INSERT, UPDATE, or DELETE.
CREATE OR REPLACE FUNCTION public.append_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record_id uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id;
    ELSE
        v_record_id := NEW.id;
    END IF;

    INSERT INTO public.audit_log (table_name, record_id, operation, changed_by, old_data, new_data)
    VALUES (
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        auth.uid(),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );

    RETURN NULL;  -- AFTER trigger; return value is ignored
END;
$$;

-- ─────────────────────────────────────────────
-- Triggers on members
-- ─────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_members_set_updated_fields'
          AND tgrelid = 'public.members'::regclass
    ) THEN
        CREATE TRIGGER trg_members_set_updated_fields
            BEFORE UPDATE ON public.members
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_fields();
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_members_audit'
          AND tgrelid = 'public.members'::regclass
    ) THEN
        CREATE TRIGGER trg_members_audit
            AFTER INSERT OR UPDATE OR DELETE ON public.members
            FOR EACH ROW EXECUTE FUNCTION public.append_audit_log();
    END IF;
END;
$$;

-- ─────────────────────────────────────────────
-- Triggers on entries
-- ─────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_entries_set_updated_fields'
          AND tgrelid = 'public.entries'::regclass
    ) THEN
        CREATE TRIGGER trg_entries_set_updated_fields
            BEFORE UPDATE ON public.entries
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_fields();
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_entries_audit'
          AND tgrelid = 'public.entries'::regclass
    ) THEN
        CREATE TRIGGER trg_entries_audit
            AFTER INSERT OR UPDATE OR DELETE ON public.entries
            FOR EACH ROW EXECUTE FUNCTION public.append_audit_log();
    END IF;
END;
$$;

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────

-- Speeds up RLS policy lookups on members (used in entries policies and is_member()).
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members (user_id);

-- Speeds up correlated subqueries that join members(id, user_id) from entries policies.
CREATE INDEX IF NOT EXISTS idx_members_id_user_id ON public.members (id, user_id);

-- Speeds up lookups of entries by member_id.
CREATE INDEX IF NOT EXISTS idx_entries_member_id ON public.entries (member_id);

-- ─────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────

ALTER TABLE public.members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- RLS helper: is the current user a member?
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.members WHERE user_id = auth.uid()
    );
$$;

-- ─────────────────────────────────────────────
-- Policies for members table
-- ─────────────────────────────────────────────

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'members_select_self'
    ) THEN
        CREATE POLICY members_select_self ON public.members
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;
END; $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'members_insert_self'
    ) THEN
        CREATE POLICY members_insert_self ON public.members
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;
END; $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'members_update_self'
    ) THEN
        CREATE POLICY members_update_self ON public.members
            FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END; $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'members_delete_self'
    ) THEN
        CREATE POLICY members_delete_self ON public.members
            FOR DELETE
            USING (user_id = auth.uid());
    END IF;
END; $$;

-- ─────────────────────────────────────────────
-- Policies for entries table
-- ─────────────────────────────────────────────

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'entries' AND policyname = 'entries_select_members'
    ) THEN
        CREATE POLICY entries_select_members ON public.entries
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.members
                    WHERE members.id = entries.member_id
                      AND members.user_id = auth.uid()
                )
            );
    END IF;
END; $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'entries' AND policyname = 'entries_insert_members'
    ) THEN
        CREATE POLICY entries_insert_members ON public.entries
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.members
                    WHERE members.id = entries.member_id
                      AND members.user_id = auth.uid()
                )
            );
    END IF;
END; $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'entries' AND policyname = 'entries_update_members'
    ) THEN
        CREATE POLICY entries_update_members ON public.entries
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.members
                    WHERE members.id = entries.member_id
                      AND members.user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.members
                    WHERE members.id = entries.member_id
                      AND members.user_id = auth.uid()
                )
            );
    END IF;
END; $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'entries' AND policyname = 'entries_delete_members'
    ) THEN
        CREATE POLICY entries_delete_members ON public.entries
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.members
                    WHERE members.id = entries.member_id
                      AND members.user_id = auth.uid()
                )
            );
    END IF;
END; $$;

-- ─────────────────────────────────────────────
-- Policies for audit_log table (read-only for members)
-- ─────────────────────────────────────────────

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'audit_log' AND policyname = 'audit_log_select_members'
    ) THEN
        CREATE POLICY audit_log_select_members ON public.audit_log
            FOR SELECT
            USING (public.is_member());
    END IF;
END; $$;
