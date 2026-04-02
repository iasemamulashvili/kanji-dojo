-- Migration: 00014_fix_leaderboard_streaks.sql
-- Addresses critical issues from Vibe Code Auditor:
-- 1. Un-hallucinates the Streak Days logic (Daily Flame)
-- 2. Prevents double-score insertion from network lag

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Prevent Duplicate Scores per Session
-- ─────────────────────────────────────────────────────────────────────────────
-- Remove duplicates first if they exist
DELETE FROM quiz_scores 
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY telegram_id, quiz_session_id ORDER BY created_at ASC) as row_num
        FROM quiz_scores 
        WHERE quiz_session_id IS NOT NULL
    ) t WHERE t.row_num > 1
);

ALTER TABLE quiz_scores
  ADD CONSTRAINT uq_quiz_scores_session_user UNIQUE (telegram_id, quiz_session_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Fully Implement Streak Logic in the Trigger
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
    total_correct, total_questions, best_score, last_quiz_at, updated_at, streak_days
  )
  VALUES (
    NEW.telegram_id, NEW.username,
    agg.total_score, agg.total_quizzes,
    agg.total_correct, agg.total_questions, agg.best_score,
    agg.last_quiz_at, NOW(), 1
  )
  ON CONFLICT (telegram_id) DO UPDATE SET
    username         = EXCLUDED.username,
    total_score      = EXCLUDED.total_score,
    total_quizzes    = EXCLUDED.total_quizzes,
    total_correct    = EXCLUDED.total_correct,
    total_questions  = EXCLUDED.total_questions,
    best_score       = EXCLUDED.best_score,
    updated_at       = EXCLUDED.updated_at,
    -- Streak recalculation
    streak_days      = CASE
        WHEN (leaderboard.last_quiz_at AT TIME ZONE 'UTC')::date = (EXCLUDED.last_quiz_at AT TIME ZONE 'UTC')::date THEN leaderboard.streak_days
        WHEN (leaderboard.last_quiz_at AT TIME ZONE 'UTC')::date = ((EXCLUDED.last_quiz_at AT TIME ZONE 'UTC') - INTERVAL '1 day')::date THEN leaderboard.streak_days + 1
        ELSE 1
    END,
    last_quiz_at     = EXCLUDED.last_quiz_at;

  RETURN NEW;
END;
$$;
