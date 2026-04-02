-- Migration: 00016_master_restoration.sql
-- Goal: Restore all game logic, columns, and triggers lost during re-running of base architecture DDL.

-- 1. Restore quiz_sessions columns
ALTER TABLE quiz_sessions 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours');

-- 2. Restore quiz_participants columns
ALTER TABLE quiz_participants 
  ADD COLUMN IF NOT EXISTS username VARCHAR(64),
  ADD COLUMN IF NOT EXISTS type_stats JSONB DEFAULT '{}'::jsonb;

-- 3. Restore quiz_scores columns
ALTER TABLE quiz_scores
  ADD COLUMN IF NOT EXISTS type_stats JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS telegram_id BIGINT,
  ADD COLUMN IF NOT EXISTS username VARCHAR(64);

-- 4. Restore leaderboard and streaks logic (from 00014)
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

DROP TRIGGER IF EXISTS t_sync_leaderboard ON quiz_scores;
CREATE TRIGGER t_sync_leaderboard
AFTER INSERT OR UPDATE ON quiz_scores
FOR EACH ROW EXECUTE FUNCTION sync_leaderboard();

-- 5. Restore granular stats logic (from 00012)
CREATE OR REPLACE FUNCTION sync_user_question_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  stat_key text;
  stat_val jsonb;
BEGIN
  IF NEW.type_stats IS NULL THEN
    RETURN NEW;
  END IF;
  
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

DROP TRIGGER IF EXISTS trg_sync_user_question_stats ON quiz_scores;
CREATE TRIGGER trg_sync_user_question_stats
AFTER INSERT ON quiz_scores
FOR EACH ROW EXECUTE FUNCTION sync_user_question_stats();
