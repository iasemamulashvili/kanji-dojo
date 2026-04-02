-- Migration: 00015_ensure_username_on_participants.sql
-- Fixes "Failed to join" error when using recent bot link (which includes username)
-- but the base table DDL was re-run without the username column.

ALTER TABLE quiz_participants 
  ADD COLUMN IF NOT EXISTS username VARCHAR(64);

-- Also ensure type_stats exists (from 00012) in case that was also missed
ALTER TABLE quiz_participants 
  ADD COLUMN IF NOT EXISTS type_stats JSONB DEFAULT '{}'::jsonb;
