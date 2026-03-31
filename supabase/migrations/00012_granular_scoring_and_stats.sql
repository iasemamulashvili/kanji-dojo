-- Migration: 00012_granular_scoring_and_stats.sql
-- Extension of the quiz scoring system to track per-question-type performance

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extend quiz_participants to track session-local stats
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE quiz_participants 
  ADD COLUMN IF NOT EXISTS type_stats JSONB DEFAULT '{}'::jsonb;
-- structure of type_stats: { "meaning": { "correct": 0, "total": 0 }, ... }

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Extend quiz_scores to store history-local stats (for stats page)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE quiz_scores
  ADD COLUMN IF NOT EXISTS type_stats JSONB DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Create global mastery table for all-time stats
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_question_stats (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id     BIGINT      NOT NULL,
  question_type   VARCHAR(32) NOT NULL,
  correct_count   INTEGER     NOT NULL DEFAULT 0,
  total_count     INTEGER     NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(telegram_id, question_type)
);

CREATE INDEX IF NOT EXISTS idx_user_question_stats_telegram_id ON user_question_stats (telegram_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Trigger to update all-time stats when a quiz finishes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_user_question_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  stat_key text;
  stat_val jsonb;
BEGIN
  -- NEW.type_stats is expected to be a JSONB object like:
  -- {"meaning": {"correct": 2, "total": 3}, "audio": {"correct": 1, "total": 1}}
  
  FOR stat_key, stat_val IN SELECT * FROM jsonb_each(NEW.type_stats)
  LOOP
    INSERT INTO user_question_stats (telegram_id, question_type, correct_count, total_count, updated_at)
    VALUES (
      NEW.telegram_id, 
      stat_key, 
      (stat_val->>'correct')::int, 
      (stat_val->>'total')::int, 
      NOW()
    )
    ON CONFLICT (telegram_id, question_type) DO UPDATE SET
      correct_count = user_question_stats.correct_count + EXCLUDED.correct_count,
      total_count   = user_question_stats.total_count + EXCLUDED.total_count,
      updated_at    = NOW();
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_user_question_stats
AFTER INSERT ON quiz_scores
FOR EACH ROW EXECUTE FUNCTION sync_user_question_stats();

-- Add RLS
ALTER TABLE user_question_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read user_question_stats" ON user_question_stats FOR SELECT USING (true);
