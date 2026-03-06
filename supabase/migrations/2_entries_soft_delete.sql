-- Migration: 2_entries_soft_delete.sql
-- Adds a nullable deleted_at column to entries for soft-delete support.
-- Existing rows are unaffected (deleted_at defaults to NULL, meaning active).

ALTER TABLE public.entries
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Index to speed up queries that filter on deleted_at IS NULL (active entries).
CREATE INDEX IF NOT EXISTS idx_entries_deleted_at ON public.entries (deleted_at)
    WHERE deleted_at IS NULL;
