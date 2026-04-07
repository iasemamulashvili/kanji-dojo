-- Mock User Seed for Local Development
-- Creates a dummy user in auth.users and profiles, and adds 5 fake quiz results.

CREATE TABLE IF NOT EXISTS public.leaderboard (
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
  streak_days      INTEGER     NOT NULL DEFAULT 0,
  last_quiz_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_question_stats (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id     BIGINT      NOT NULL,
  question_type   VARCHAR(32) NOT NULL,
  correct_count   INTEGER     NOT NULL DEFAULT 0,
  total_count     INTEGER     NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(telegram_id, question_type)
);


INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'mock@kanjidojo.local',
  'password123',
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, telegram_id, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  123456789,
  NOW()
) ON CONFLICT DO NOTHING;

DELETE FROM public.quiz_scores WHERE telegram_id = 123456789;

INSERT INTO public.quiz_scores (telegram_id, username, score, total_questions, correct_answers, type_stats, created_at)
VALUES 
(123456789, 'Mock User', 100, 10, 10, '{"meaning": {"total": 5, "correct": 5}, "reading": {"total": 5, "correct": 5}}', NOW() - INTERVAL '5 days'),
(123456789, 'Mock User', 90,  10,  9, '{"meaning": {"total": 10, "correct": 9}}', NOW() - INTERVAL '4 days'),
(123456789, 'Mock User', 100, 10, 10, '{"audio": {"total": 5, "correct": 5}, "writing": {"total": 5, "correct": 5}}', NOW() - INTERVAL '3 days'),
(123456789, 'Mock User', 80,  10,  8, '{"reverse": {"total": 10, "correct": 8}}', NOW() - INTERVAL '2 days'),
(123456789, 'Mock User', 100, 10, 10, '{"audio": {"total": 10, "correct": 10}}', NOW() - INTERVAL '1 day');
