-- Migration: 00013_twenty_four_hour_quizzes.sql
-- Adds timestamp and notification tracking for the 24-hour competitive window

ALTER TABLE quiz_sessions 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  ADD COLUMN IF NOT EXISTS notified   BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure quiz_participants has username for the leaderboard announcements
ALTER TABLE quiz_participants
  ADD COLUMN IF NOT EXISTS username VARCHAR(64);

-- Index for the "Active Dojo" cron/command
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_expires_at ON quiz_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_notified   ON quiz_sessions (notified);
