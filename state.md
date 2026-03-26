# Antigravity State Blackboard

## Current Active Branch / Stage
- Phase 2: Feature Sprint & Bug Fixes (Scoreboard, Quiz UI, Cron/Navigation bugs)

## Global Blockers
- ~~**Frontend Artist** depends on **Backend Warden** for Scoreboard API.~~ ✅ **UNBLOCKED** — `/api/quiz/score` now upserts `user_stats`.
- **Backend Warden** depends on **Game Master** for Scoreboard Database Schema (`user_stats` table must exist in Supabase).

## Active Assignments
- **Project Manager**: Sprint Orchestration complete (Plan generated).
- **Game Master**: Fix `jlpt_order` schema bug, update navigation SQL, create Scoreboard DB schema, add `grammar_explanation` to kanjis table.
- **Backend Warden**: Fix Vercel Cron endpoints, implement `/today` command, create `/api/quiz/score` POST route.

## Completed Tasks / Schema Definitions
- *Frontend Artist Patch Sequence*:
  - **Drawing Quiz patched**: infinite attempts allowed + explicit Skip.
  - **Drag-n-Drop fixed**: `window.Telegram.WebApp.disableVerticalSwipes()` halts Telegram pull-to-refresh app close.
  - **Scoreboard UI**: created full-page Wabi-Sabi ranking view linked to DB api.
  - **Grammar Tooltips**: interactive tokens now show `grammar_explanation` if present.
- *Multi-Agent Architecture Initialization completes. PM organized skills in `.agents/skills/`.*
- **Backend Warden Sprint ✅**
  - `/api/cron/morning` and `/api/cron/nag` now export both `GET` (Vercel) and `POST` (cron-job.org) handlers with `Bearer CRON_SECRET` auth.
  - `docs/cron-job-org-setup.md` created — guide to configure 5 daily cron jobs on cron-job.org.
  - `/today` Telegram command added to `lib/telegram/bot.ts` — replies with full kanji card (character, meanings, on/kun readings, JLPT level, grammar notes) in MarkdownV2 — pinnable and offline-readable.
  - `/api/quiz/score` POST route enhanced — now upserts `user_stats` (total_quizzes, total_score, best_score, last_played_at) when a quiz session finishes. Leaderboard-ready.

### Game Master — Delivered Artifacts (2026-03-27)
- **`supabase/migrations/00005_add_jlpt_order.sql`** — Adds `jlpt_order` INT UNIQUE to `kanjis`, backfills 1..N ordering by `jlpt_level DESC, stroke_count ASC, character ASC`. Adds unique constraint + B-tree index.
- **`supabase/migrations/00006_leaderboard_schema.sql`** — Creates `quiz_scores` (raw per-session results) and `leaderboard` (pre-aggregated totals with computed `accuracy_pct`). Includes `sync_leaderboard` trigger to keep aggregate in sync on every insert.
- **`supabase/migrations/00007_grammar_explanation.sql`** — Adds `grammar_explanation TEXT` to `kanjis`.
- **`lib/telegram/bot.ts`** — `/next` command now queries `jlpt_order` directly (removed the broken `jlpt_level * 1000 + stroke_count` fallback). `handleNavigation` now orders by `jlpt_order ASC`.
- **`scripts/harvest-n5.ts`** — Gemini prompt schema + insert payload updated to include `grammar_explanation`.

### Backend Warden Dependency
- `leaderboard` and `quiz_scores` tables are ready. Backend Warden can now implement `POST /api/quiz/score`.
