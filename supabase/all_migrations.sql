-- ==========================================
-- FILE: 00001_core_kanji_srs_schema.sql
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_id BIGINT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create kanjis table
CREATE TABLE kanjis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character VARCHAR UNIQUE NOT NULL,
    meanings TEXT[],
    onyomi TEXT[],
    kunyomi TEXT[],
    jlpt_level INTEGER,
    stroke_count INTEGER,
    example_sentences JSONB DEFAULT '[]'::jsonb
);

-- Create user_kanji_progress table
CREATE TABLE user_kanji_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    kanji_id UUID REFERENCES kanjis(id) ON DELETE CASCADE NOT NULL,
    srs_level INTEGER DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    correct_streak INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, kanji_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanjis ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kanji_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can select their own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- RLS Policies for kanjis
CREATE POLICY "Public read access for kanjis"
    ON kanjis FOR SELECT
    USING (true);

-- RLS Policies for user_kanji_progress
CREATE POLICY "Users can select their own progress"
    ON user_kanji_progress FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own progress"
    ON user_kanji_progress FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
    ON user_kanji_progress FOR UPDATE
    USING (user_id = auth.uid());


-- ==========================================
-- FILE: 00002_decouple_auth.sql
-- ==========================================

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ALTER COLUMN id SET DEFAULT uuid_generate_v4();


-- ==========================================
-- FILE: 00003_group_settings.sql
-- ==========================================

CREATE TABLE group_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id BIGINT UNIQUE NOT NULL,
    current_kanji_id UUID REFERENCES kanjis(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE group_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for group_settings"
    ON group_settings FOR SELECT
    USING (true);


-- ==========================================
-- FILE: 00005_add_jlpt_order.sql
-- ==========================================

-- Migration: 00005_add_jlpt_order.sql
-- Adds jlpt_order INTEGER UNIQUE to the kanjis table and re-sequences
-- all existing rows 1..N, ordered by jlpt_level DESC (N5 first =5, N1 last =1),
-- then stroke_count ASC as a secondary sort within each JLPT level.
-- This establishes the canonical sequential curriculum order required by the
-- Game Master skill and Foundation architectural rules.

-- Step 1: Add the column (nullable initially to allow backfill)
ALTER TABLE kanjis
  ADD COLUMN IF NOT EXISTS jlpt_order INTEGER;

-- Step 2: Backfill — assign sequential integers 1..N
-- Ordering: highest jlpt_level first (5 = N5 beginner), stroke_count ASC within level.
WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY jlpt_level DESC, stroke_count ASC, character ASC
    ) AS new_order
  FROM kanjis
)
UPDATE kanjis
SET jlpt_order = ordered.new_order
FROM ordered
WHERE kanjis.id = ordered.id;

-- Step 3: Enforce NOT NULL + UNIQUE now that all rows are populated
ALTER TABLE kanjis
  ALTER COLUMN jlpt_order SET NOT NULL;

ALTER TABLE kanjis
  ADD CONSTRAINT kanjis_jlpt_order_unique UNIQUE (jlpt_order);

-- Step 4: Index for fast sequential navigation queries
CREATE INDEX IF NOT EXISTS idx_kanjis_jlpt_order ON kanjis (jlpt_order ASC);


-- ==========================================
-- FILE: 00006_leaderboard_schema.sql
-- ==========================================

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


-- ==========================================
-- FILE: 00007_grammar_explanation.sql
-- ==========================================

-- Migration: 00007_grammar_explanation.sql
-- Adds grammar_explanation (TEXT) to the kanjis table.
-- This field provides a plain-English grammar explanation for how the
-- kanji is commonly used in sentences (particle role, verb form, etc.)
-- and is referenced by the sentence-level UI grammar highlight feature.

ALTER TABLE kanjis
  ADD COLUMN IF NOT EXISTS grammar_explanation TEXT;


-- ==========================================
-- FILE: 00008_particles.sql
-- ==========================================

-- Migration 00008: Grammatical Particles Dictionary

CREATE TABLE IF NOT EXISTS particles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    particle TEXT NOT NULL UNIQUE,
    romaji TEXT NOT NULL,
    meaning TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed basic particles
INSERT INTO particles (particle, romaji, meaning, description) VALUES
('は', 'wa', 'Topic marker', 'Marks the topic of the sentence. Pronounced "wa" but written with the hiragana for "ha".'),
('が', 'ga', 'Subject marker', 'Marks the grammatical subject of a sentence.'),
('を', 'wo', 'Direct object marker', 'Marks the direct object of an action. Pronounced "o" but written with the hiragana for "wo".'),
('に', 'ni', 'Target / Destination / Time', 'Indicates a destination, a point in time, or the indirect object of an action.'),
('へ', 'e', 'Direction marker', 'Indicates direction of movement. Pronounced "e" but written with the hiragana for "he".'),
('で', 'de', 'Context / Instrument', 'Indicates the location of an action, or the means/instrument used to do something.'),
('と', 'to', 'And / With / Quotation', 'Used to exhaustively list items ("and"), indicate accompaniment ("with"), or mark quotations.'),
('や', 'ya', 'And (non-exhaustive list)', 'Used to list items, implying there are other unlisted items as well.'),
('の', 'no', 'Possession / Modifier', 'Indicates possession ("s") or links nouns together as a modifier.'),
('から', 'kara', 'From / Because', 'Indicates a starting point in time/space ("from"), or a reason/cause ("because").'),
('まで', 'made', 'Until / As far as', 'Indicates an ending point in time/space.'),
('も', 'mo', 'Also / Too', 'Replaces は, が, or を to indicate "also" or "too".'),
('ね', 'ne', 'Sentence ending: Agreement', 'Sentence ending particle used to seek agreement or confirmation ("isn''t it?", "right?").'),
('よ', 'yo', 'Sentence ending: Assurance', 'Sentence ending particle used to emphasize new information or give assurance.')
ON CONFLICT (particle) DO UPDATE 
SET 
  romaji = EXCLUDED.romaji, 
  meaning = EXCLUDED.meaning, 
  description = EXCLUDED.description;


-- ==========================================
-- FILE: 00010_fix_group_settings.sql
-- ==========================================

-- Resolve the missing group_id column in group_settings
-- This specifically fixes the 500 error: "column group_settings.group_id does not exist"

-- 1. Ensure the column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='group_settings' AND column_name='group_id') THEN
        ALTER TABLE group_settings ADD COLUMN group_id BIGINT;
    END IF;
END $$;

-- 2. Populate the group_id if it's currently null using the singleton or default logic
-- If we only have 1 group, we can set it to the expected group ID if we know it.
-- But since this is a general migration, we'll just allow it for now.
-- In bot.ts, we use the value from process.env.TELEGRAM_GROUP_ID.

-- 3. Ensure the id column is INT for the singleton logic (matching migration 00004 intent)
ALTER TABLE group_settings 
ALTER COLUMN id TYPE INT USING (CASE WHEN id IS NOT NULL THEN 1 ELSE 1 END);

-- 4. Add uniqeness constraint to group_id if not already present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_settings_group_id_key') THEN
        ALTER TABLE group_settings ADD CONSTRAINT group_settings_group_id_key UNIQUE (group_id);
    END IF;
END $$;


-- ==========================================
-- FILE: 00011_kanji_navigation_votes.sql
-- ==========================================

-- 00011_kanji_navigation_votes.sql
CREATE TABLE IF NOT EXISTS kanji_navigation_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id BIGINT NOT NULL,
  voter_id BIGINT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('next', 'prev')),
  target_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, voter_id, direction, target_order)
);


-- ==========================================
-- FILE: 00012_granular_scoring_and_stats.sql
-- ==========================================

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


-- ==========================================
-- FILE: 00013_twenty_four_hour_quizzes.sql
-- ==========================================

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


-- ==========================================
-- FILE: 00014_fix_leaderboard_streaks.sql
-- ==========================================

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


-- ==========================================
-- FILE: 00015_ensure_username_on_participants.sql
-- ==========================================

-- Migration: 00015_ensure_username_on_participants.sql
-- Fixes "Failed to join" error when using recent bot link (which includes username)
-- but the base table DDL was re-run without the username column.

ALTER TABLE quiz_participants 
  ADD COLUMN IF NOT EXISTS username VARCHAR(64);

-- Also ensure type_stats exists (from 00012) in case that was also missed
ALTER TABLE quiz_participants 
  ADD COLUMN IF NOT EXISTS type_stats JSONB DEFAULT '{}'::jsonb;


-- ==========================================
-- FILE: 00016_master_restoration.sql
-- ==========================================

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


-- ==========================================
-- FILE: 20260316222637_00004_alter_group_settings_id_type.sql
-- ==========================================

ALTER TABLE group_settings
ALTER COLUMN id DROP DEFAULT,
ALTER COLUMN id SET DATA TYPE INT USING (1); 

-- We only ever need one setting for a group, but the initial design made id a UUID. 
-- The user explicitely requested to rely on upsert with `{ id: 1, current_kanji_id: newId }`
-- If we only ever have 1 configuration per group, group_id is unique so it acts as the primary logical key anyway.
-- Let's change id to INT so the query `id: 1` succeeds.


