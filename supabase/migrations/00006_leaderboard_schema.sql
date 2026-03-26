-- Migration: 00006_leaderboard_schema.sql
-- Creates two tables for the quiz scoreboard system:
--   quiz_scores  – one row per quiz attempt by a user, stores per-attempt stats.
--   leaderboard  – materialised aggregate view per user (updated via trigger).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. quiz_scores: raw per-session results
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_scores (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id      BIGINT      NOT NULL,               -- Telegram user ID (no auth.users dependency)
  username         VARCHAR(64),                        -- Display name snapshot at time of quiz
  quiz_session_id  UUID,                               -- Optional: FK to quiz_sessions if multiplayer
  score            INTEGER     NOT NULL DEFAULT 0,     -- Raw score for this attempt
  total_questions  INTEGER     NOT NULL DEFAULT 0,     -- Number of questions in the quiz
  correct_answers  INTEGER     NOT NULL DEFAULT 0,     -- How many were answered correctly
  time_taken_ms    INTEGER,                            -- Total time in milliseconds
  kanji_id         UUID REFERENCES kanjis(id) ON DELETE SET NULL, -- Kanji being tested (null = mixed)
  quiz_type        VARCHAR(32) NOT NULL DEFAULT 'mixed', -- 'meaning','reading','reverse','writing','audio','mixed'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching a user's history fast
CREATE INDEX IF NOT EXISTS idx_quiz_scores_telegram_id ON quiz_scores (telegram_id);
-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_quiz_scores_score ON quiz_scores (score DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. leaderboard: pre-aggregated per-user totals
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id      BIGINT      UNIQUE NOT NULL,
  username         VARCHAR(64),
  total_score      BIGINT      NOT NULL DEFAULT 0,
  total_quizzes    INTEGER     NOT NULL DEFAULT 0,
  total_correct    INTEGER     NOT NULL DEFAULT 0,
  total_questions  INTEGER     NOT NULL DEFAULT 0,
  best_score       INTEGER     NOT NULL DEFAULT 0,
  accuracy_pct     NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_questions = 0 THEN 0
         ELSE ROUND((total_correct::NUMERIC / total_questions) * 100, 2)
    END
  ) STORED,
  streak_days      INTEGER     NOT NULL DEFAULT 0,     -- Consecutive days with at least 1 quiz
  last_quiz_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rendering top-N leaderboard fast
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score ON leaderboard (total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_accuracy    ON leaderboard (accuracy_pct DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Function + Trigger: keep leaderboard in sync after each quiz_score insert
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_leaderboard()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  agg RECORD;
BEGIN
  -- Aggregate this user's stats from quiz_scores
  SELECT
    SUM(score)           AS total_score,
    COUNT(*)             AS total_quizzes,
    SUM(correct_answers) AS total_correct,
    SUM(total_questions) AS total_questions,
    MAX(score)           AS best_score,
    MAX(created_at)      AS last_quiz_at
  INTO agg
  FROM quiz_scores
  WHERE telegram_id = NEW.telegram_id;

  INSERT INTO leaderboard (
    telegram_id, username, total_score, total_quizzes,
    total_correct, total_questions, best_score, last_quiz_at, updated_at
  )
  VALUES (
    NEW.telegram_id, NEW.username,
    agg.total_score, agg.total_quizzes,
    agg.total_correct, agg.total_questions, agg.best_score,
    agg.last_quiz_at, NOW()
  )
  ON CONFLICT (telegram_id) DO UPDATE SET
    username         = EXCLUDED.username,
    total_score      = EXCLUDED.total_score,
    total_quizzes    = EXCLUDED.total_quizzes,
    total_correct    = EXCLUDED.total_correct,
    total_questions  = EXCLUDED.total_questions,
    best_score       = EXCLUDED.best_score,
    last_quiz_at     = EXCLUDED.last_quiz_at,
    updated_at       = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_leaderboard
AFTER INSERT ON quiz_scores
FOR EACH ROW EXECUTE FUNCTION sync_leaderboard();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE quiz_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard  ENABLE ROW LEVEL SECURITY;

-- quiz_scores: service role writes, public reads
CREATE POLICY "Public read quiz_scores"
  ON quiz_scores FOR SELECT USING (true);

-- leaderboard: fully public for the scoreboard UI
CREATE POLICY "Public read leaderboard"
  ON leaderboard FOR SELECT USING (true);
