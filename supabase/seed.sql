-- Mock User Seed for Local Development
-- Creates a dummy user in auth.users and profiles, and adds 5 fake quiz results.

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

INSERT INTO public.quiz_scores (telegram_id, username, score, total_questions, correct_answers, quiz_type, type_stats, created_at)
VALUES 
(123456789, 'Mock User', 100, 10, 10, 'mixed', '{"meaning": {"total": 5, "correct": 5}, "reading": {"total": 5, "correct": 5}}', NOW() - INTERVAL '5 days'),
(123456789, 'Mock User', 90,  10,  9, 'meaning', '{"meaning": {"total": 10, "correct": 9}}', NOW() - INTERVAL '4 days'),
(123456789, 'Mock User', 100, 10, 10, 'mixed', '{"audio": {"total": 5, "correct": 5}, "writing": {"total": 5, "correct": 5}}', NOW() - INTERVAL '3 days'),
(123456789, 'Mock User', 80,  10,  8, 'reverse', '{"reverse": {"total": 10, "correct": 8}}', NOW() - INTERVAL '2 days'),
(123456789, 'Mock User', 100, 10, 10, 'audio', '{"audio": {"total": 10, "correct": 10}}', NOW() - INTERVAL '1 day');
