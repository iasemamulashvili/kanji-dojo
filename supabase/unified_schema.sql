-- =====================================================================
-- KANJI DOJO — UNIFIED SCHEMA (idempotent, safe to re-run)
-- Paste this entire file into the Supabase SQL Editor and click Run.
-- All statements use IF NOT EXISTS or OR REPLACE to avoid conflicts.
-- Run order matters — do NOT rearrange sections.
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Extensions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Core Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles: decoupled from Supabase Auth (Telegram-native)
CREATE TABLE IF NOT EXISTS profiles (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop the old auth.users FK if it was ever added
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Kanjis: the curriculum
CREATE TABLE IF NOT EXISTS kanjis (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character           VARCHAR UNIQUE NOT NULL,
    meanings            TEXT[],
    onyomi              TEXT[],
    kunyomi             TEXT[],
    jlpt_level          INTEGER,
    stroke_count        INTEGER,
    example_sentences   JSONB DEFAULT '[]'::jsonb,
    grammar_explanation TEXT,
    jlpt_order          INTEGER
);

-- JLPT curriculum order: enforce uniqueness only if data is present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'kanjis_jlpt_order_unique'
    ) THEN
        ALTER TABLE kanjis ADD CONSTRAINT kanjis_jlpt_order_unique UNIQUE (jlpt_order);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kanjis_jlpt_order ON kanjis (jlpt_order ASC);

-- Backfill jlpt_order for any rows that don't have one yet
WITH ordered AS (
    SELECT id,
           ROW_NUMBER() OVER (ORDER BY jlpt_level DESC, stroke_count ASC, character ASC) AS new_order
    FROM kanjis
    WHERE jlpt_order IS NULL
)
UPDATE kanjis
SET jlpt_order = ordered.new_order
FROM ordered
WHERE kanjis.id = ordered.id;

-- User SRS progress
CREATE TABLE IF NOT EXISTS user_kanji_progress (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    kanji_id       UUID REFERENCES kanjis(id) ON DELETE CASCADE NOT NULL,
    srs_level      INTEGER DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    correct_streak INTEGER DEFAULT 0,
    updated_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, kanji_id)
);

-- Group settings: singleton row (id = 1)
CREATE TABLE IF NOT EXISTS group_settings (
    id               INT PRIMARY KEY DEFAULT 1,
    group_id         BIGINT UNIQUE,
    current_kanji_id UUID REFERENCES kanjis(id) ON DELETE SET NULL,
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Particles dictionary
CREATE TABLE IF NOT EXISTS particles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    particle    TEXT NOT NULL UNIQUE,
    romaji      TEXT NOT NULL,
    meaning     TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kanji navigation votes (group voting on next/prev)
CREATE TABLE IF NOT EXISTS kanji_navigation_votes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id     BIGINT NOT NULL,
    voter_id     BIGINT NOT NULL,
    direction    TEXT NOT NULL CHECK (direction IN ('next', 'prev')),
    target_order INT NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, voter_id, direction, target_order)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Quiz Infrastructure
-- ─────────────────────────────────────────────────────────────────────────────

-- Quiz sessions: one per competitive round
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id     BIGINT NOT NULL,
    kanji_id     UUID REFERENCES kanjis(id) ON DELETE SET NULL,
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);
-- Add columns from later migrations safely
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS group_id   BIGINT; 
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours');
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS notified   BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_expires_at ON quiz_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_notified   ON quiz_sessions (notified);

-- Quiz participants: one row per user per session
CREATE TABLE IF NOT EXISTS quiz_participants (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id   UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE NOT NULL,
    telegram_id  BIGINT NOT NULL,
    score        INTEGER DEFAULT 0,
    finished     BOOLEAN DEFAULT FALSE,
    finished_at  TIMESTAMPTZ,
    UNIQUE (session_id, telegram_id)
);
-- Add columns from later migrations safely
ALTER TABLE quiz_participants ADD COLUMN IF NOT EXISTS username   VARCHAR(64);
ALTER TABLE quiz_participants ADD COLUMN IF NOT EXISTS type_stats JSONB DEFAULT '{}'::jsonb;

-- Quiz scores: one row per completed quiz attempt (source of truth for stats)
CREATE TABLE IF NOT EXISTS quiz_scores (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_session_id  UUID,
    score            INTEGER NOT NULL DEFAULT 0,
    total_questions  INTEGER NOT NULL DEFAULT 0,
    correct_answers  INTEGER NOT NULL DEFAULT 0,
    time_taken_ms    INTEGER,
    quiz_type        VARCHAR(32) NOT NULL DEFAULT 'mixed',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Add columns from later migrations safely
ALTER TABLE quiz_scores ADD COLUMN IF NOT EXISTS telegram_id BIGINT;
ALTER TABLE quiz_scores ADD COLUMN IF NOT EXISTS username    VARCHAR(64);
ALTER TABLE quiz_scores ADD COLUMN IF NOT EXISTS type_stats  JSONB DEFAULT '{}'::jsonb;

-- Prevent double-counting from network retries (safe: only on non-null session_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_quiz_scores_session_user'
    ) THEN
        -- Clean up any pre-existing duplicates first
        DELETE FROM quiz_scores
        WHERE id IN (
            SELECT id FROM (
                SELECT id,
                       ROW_NUMBER() OVER (PARTITION BY telegram_id, quiz_session_id ORDER BY created_at ASC) AS rn
                FROM quiz_scores
                WHERE quiz_session_id IS NOT NULL
            ) t WHERE rn > 1
        );
        ALTER TABLE quiz_scores
            ADD CONSTRAINT uq_quiz_scores_session_user UNIQUE (telegram_id, quiz_session_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quiz_scores_telegram_id ON quiz_scores (telegram_id);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_score       ON quiz_scores (score DESC);

-- Leaderboard: pre-aggregated per-user totals (kept in sync via trigger)
CREATE TABLE IF NOT EXISTS leaderboard (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id     BIGINT UNIQUE NOT NULL,
    username        VARCHAR(64),
    total_score     BIGINT NOT NULL DEFAULT 0,
    total_quizzes   INTEGER NOT NULL DEFAULT 0,
    total_correct   INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    best_score      INTEGER NOT NULL DEFAULT 0,
    accuracy_pct    NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_questions = 0 THEN 0
             ELSE ROUND((total_correct::NUMERIC / total_questions) * 100, 2)
        END
    ) STORED,
    streak_days     INTEGER NOT NULL DEFAULT 0,
    last_quiz_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score ON leaderboard (total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_accuracy    ON leaderboard (accuracy_pct DESC);

-- Per question-type mastery (aggregated across all time)
CREATE TABLE IF NOT EXISTS user_question_stats (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id   BIGINT      NOT NULL,
    question_type VARCHAR(32) NOT NULL,
    correct_count INTEGER     NOT NULL DEFAULT 0,
    total_count   INTEGER     NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(telegram_id, question_type)
);

CREATE INDEX IF NOT EXISTS idx_user_question_stats_telegram_id ON user_question_stats (telegram_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: Functions & Triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- 4a. Leaderboard sync — runs after every quiz_scores INSERT or UPDATE
CREATE OR REPLACE FUNCTION sync_leaderboard()
RETURNS TRIGGER LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE agg RECORD;
BEGIN
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
    ) VALUES (
        NEW.telegram_id, NEW.username,
        agg.total_score, agg.total_quizzes,
        agg.total_correct, agg.total_questions, agg.best_score,
        agg.last_quiz_at, NOW(), 1
    )
    ON CONFLICT (telegram_id) DO UPDATE SET
        username        = EXCLUDED.username,
        total_score     = EXCLUDED.total_score,
        total_quizzes   = EXCLUDED.total_quizzes,
        total_correct   = EXCLUDED.total_correct,
        total_questions = EXCLUDED.total_questions,
        best_score      = EXCLUDED.best_score,
        updated_at      = EXCLUDED.updated_at,
        streak_days     = CASE
            WHEN (leaderboard.last_quiz_at AT TIME ZONE 'UTC')::date
                 = (EXCLUDED.last_quiz_at AT TIME ZONE 'UTC')::date
                THEN leaderboard.streak_days
            WHEN (leaderboard.last_quiz_at AT TIME ZONE 'UTC')::date
                 = ((EXCLUDED.last_quiz_at AT TIME ZONE 'UTC') - INTERVAL '1 day')::date
                THEN leaderboard.streak_days + 1
            ELSE 1
        END,
        last_quiz_at    = EXCLUDED.last_quiz_at;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS t_sync_leaderboard ON quiz_scores;
CREATE TRIGGER t_sync_leaderboard
AFTER INSERT OR UPDATE ON quiz_scores
FOR EACH ROW EXECUTE FUNCTION sync_leaderboard();


-- 4b. Granular per-type mastery sync — runs after every quiz_scores INSERT
CREATE OR REPLACE FUNCTION sync_user_question_stats()
RETURNS TRIGGER LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stat_key text;
    stat_val jsonb;
BEGIN
    IF NEW.type_stats IS NULL OR NEW.type_stats = '{}'::jsonb THEN
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
            total_count   = user_question_stats.total_count   + EXCLUDED.total_count,
            updated_at    = NOW();
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_question_stats ON quiz_scores;
CREATE TRIGGER trg_sync_user_question_stats
AFTER INSERT ON quiz_scores
FOR EACH ROW EXECUTE FUNCTION sync_user_question_stats();


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanjis                ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kanji_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_scores           ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_stats   ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Users can select their own profile" ON profiles;
CREATE POLICY "Users can select their own profile"
    ON profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE USING (id = auth.uid());

-- kanjis (public read)
DROP POLICY IF EXISTS "Public read access for kanjis" ON kanjis;
CREATE POLICY "Public read access for kanjis"
    ON kanjis FOR SELECT USING (true);

-- user_kanji_progress
DROP POLICY IF EXISTS "Users can select their own progress" ON user_kanji_progress;
CREATE POLICY "Users can select their own progress"
    ON user_kanji_progress FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own progress" ON user_kanji_progress;
CREATE POLICY "Users can insert their own progress"
    ON user_kanji_progress FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own progress" ON user_kanji_progress;
CREATE POLICY "Users can update their own progress"
    ON user_kanji_progress FOR UPDATE USING (user_id = auth.uid());

-- group_settings (public read)
DROP POLICY IF EXISTS "Public read access for group_settings" ON group_settings;
CREATE POLICY "Public read access for group_settings"
    ON group_settings FOR SELECT USING (true);

-- quiz_scores (public read, service-role write)
DROP POLICY IF EXISTS "Public read quiz_scores" ON quiz_scores;
CREATE POLICY "Public read quiz_scores"
    ON quiz_scores FOR SELECT USING (true);

-- leaderboard (fully public)
DROP POLICY IF EXISTS "Public read leaderboard" ON leaderboard;
CREATE POLICY "Public read leaderboard"
    ON leaderboard FOR SELECT USING (true);

-- user_question_stats (public read)
DROP POLICY IF EXISTS "Public read user_question_stats" ON user_question_stats;
CREATE POLICY "Public read user_question_stats"
    ON user_question_stats FOR SELECT USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: Seed Data — Particles dictionary
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO particles (particle, romaji, meaning, description) VALUES
('は', 'wa',   'Topic marker',             'Marks the topic of the sentence. Pronounced "wa" but written with hiragana for "ha".'),
('が', 'ga',   'Subject marker',           'Marks the grammatical subject of a sentence.'),
('を', 'wo',   'Direct object marker',     'Marks the direct object of an action. Pronounced "o" but written with hiragana for "wo".'),
('に', 'ni',   'Target / Destination / Time','Indicates a destination, a point in time, or the indirect object of an action.'),
('へ', 'e',    'Direction marker',         'Indicates direction of movement. Pronounced "e" but written with hiragana for "he".'),
('で', 'de',   'Context / Instrument',     'Indicates the location of an action, or the means/instrument used to do something.'),
('と', 'to',   'And / With / Quotation',   'Used to exhaustively list items ("and"), indicate accompaniment ("with"), or mark quotations.'),
('や', 'ya',   'And (non-exhaustive list)', 'Used to list items, implying there are other unlisted items as well.'),
('の', 'no',   'Possession / Modifier',    'Indicates possession ("s") or links nouns together as a modifier.'),
('から','kara','From / Because',           'Indicates a starting point in time/space ("from"), or a reason/cause ("because").'),
('まで','made','Until / As far as',        'Indicates an ending point in time/space.'),
('も', 'mo',   'Also / Too',              'Replaces は, が, or を to indicate "also" or "too".'),
('ね', 'ne',   'Sentence ending: Agreement','Sentence ending particle used to seek agreement or confirmation ("isn''t it?", "right?").'),
('よ', 'yo',   'Sentence ending: Assurance','Sentence ending particle used to emphasize new information or give assurance.')
ON CONFLICT (particle) DO UPDATE SET
    romaji      = EXCLUDED.romaji,
    meaning     = EXCLUDED.meaning,
    description = EXCLUDED.description;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7: Verification queries (optional — comment out before running)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';
-- SELECT * FROM leaderboard LIMIT 5;
-- SELECT * FROM user_question_stats LIMIT 5;
