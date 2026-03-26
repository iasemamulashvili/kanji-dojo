# Antigravity State Blackboard

## Current Active Branch / Stage
- Phase 3: Sprint Iteration (Bot Fallbacks, Quiz Canvas Fixes, Grammar Tooltips)

## Global Blockers
- **Frontend Artist** depends on **Backend Warden** to finalize the accurate correct-answer counting on `/api/quiz/score`.

## Active Assignments
- **Game Master**: Implement `/today` & `/next` graceful fallbacks pointing to `jlpt_order = 1`.
- **Backend Warden**: (DONE) Finalize true correct-answer count tracking natively in `/api/quiz/score`. Now consumes `{ totalCorrect, totalQuestions }` and natively updates `quiz_scores`.
- **Frontend Artist**: (DONE) Fix `DrawingQuestion.tsx` Canvas UI locks, stop initial kanji flashing, verify Score display, and implement `.grammar_explanation` tooltips in `InteractiveSentence.tsx`.

## Completed Tasks / Schema Definitions
- *Frontend Artist Patch Sequence*:
  - **Drawing Quiz patched**: infinite attempts mapped without canvas locking (`showHintAfterMisses`), stripped initial answer flash (`showCharacter: false`).
  - **Drag-n-Drop fixed**: `window.Telegram.WebApp.disableVerticalSwipes()` halts Telegram pull-to-refresh app close.
  - **Scoreboard UI**: Explicitly shows "X / Y Correct" at completion.
  - **Grammar Tooltips**: Added visual cues (dashed border); interactive tokens successfully display `grammar_explanation` and english meanings.
- *Multi-Agent Architecture Initialization completes. PM organized skills in `.agents/skills/`.*
- **Backend Warden Sprint ✅**
  - `/api/cron/morning` and `/api/cron/nag` now export both `GET` (Vercel) and `POST` (cron-job.org) handlers with `Bearer CRON_SECRET` auth.
  - `docs/cron-job-org-setup.md` created — guide to configure 5 daily cron jobs on cron-job.org.
  - `/today` Telegram command added to `lib/telegram/bot.ts` — replies with full kanji card (character, meanings, on/kun readings, JLPT level, grammar notes) in MarkdownV2 — pinnable and offline-readable.
  - `/api/quiz/score` POST route enhanced — now upserts `user_stats` (total_quizzes, total_score, best_score, last_played_at) when a quiz session finishes. Leaderboard-ready.

### Game Master — Delivered Artifacts (2026-03-27)
- **Phase 3 Bot Fallbacks**: `/today` and `/next` now gracefully handle missing `current_kanji_id` by defaulting to `jlpt_order = 1`, bypassing wait messages for new curriculums.
- **`supabase/migrations/00005_add_jlpt_order.sql`** — Adds `jlpt_order` INT UNIQUE to `kanjis`, backfills 1..N ordering by `jlpt_level DESC, stroke_count ASC, character ASC`. Adds unique constraint + B-tree index.
- **`supabase/migrations/00006_leaderboard_schema.sql`** — Creates `quiz_scores` (raw per-session results) and `leaderboard` (pre-aggregated totals with computed `accuracy_pct`). Includes `sync_leaderboard` trigger to keep aggregate in sync on every insert.
- **`supabase/migrations/00007_grammar_explanation.sql`** — Adds `grammar_explanation TEXT` to `kanjis`.
- **`lib/telegram/bot.ts`** — `/next` command now queries `jlpt_order` directly (removed the broken `jlpt_level * 1000 + stroke_count` fallback). `handleNavigation` now orders by `jlpt_order ASC`.
- **`scripts/harvest-n5.ts`** — Gemini prompt schema + insert payload updated to include `grammar_explanation`.

### Backend Warden Dependency
- (DONE) `leaderboard` and `quiz_scores` tables are ready. Backend Warden has successfully implemented `POST /api/quiz/score` dropping the legacy `user_stats` upsert and now directly inserting into `quiz_scores` (which fires `sync_leaderboard` trigger natively).
