# Antigravity State Blackboard

## Current Active Branch / Stage
- Phase 3: Sprint Iteration (Bot Overhaul, Quiz Canvas Fixes, Grammar Tooltips)

## Global Blockers
- **None**

## Active Assignments
- **Game Master**: (RESOLVED) Sequential Curriculum logic enforced. Static Routing restored.
- **Backend Warden**: (RESOLVED) TWA Rollback complete. Hardcoded Env-Routing enforced.
- **Frontend Artist**: Ready for UI/UX Overhaul & Matching Quiz Refactor.

## Completed Tasks / Schema Definitions
- *Frontend Artist Patch Sequence*:
  - **Drawing Quiz patched**: infinite attempts mapped without canvas locking (`showHintAfterMisses`), stripped initial answer flash (`showCharacter: false`).
  - **Drag-n-Drop fixed**: `window.Telegram.WebApp.disableVerticalSwipes()` halts Telegram pull-to-refresh app close.
  - **Scoreboard UI**: Explicitly shows "X / Y Correct" at completion.
  - **Grammar Tooltips**: Added visual cues (dashed border); interactive tokens successfully display `grammar_explanation` and english meanings.
- *Multi-Agent Architecture Initialization completes. PM organized skills in `.agents/skills/`.*
- **Backend Warden Sprint ✅ (Auth & Cron Refactor)**
  - **Bot Authentication**: JWT sessions now have a **7-day expiration**. `dojo_session` cookie is now a strictly validated JWT.
  - **Protected Routes**: Added `/practice` to middleware protection.
  - **Cron Migration**: Vercel Crons (`vercel.json`) removed. Migrated to secure POST-only webhooks for external triggers (e.g., cron-job.org).
  - **New Endpoints**:
    - `POST /api/cron/daily` — Triggers 08:00 Kanji rollover.
    - `POST /api/cron/reminder` — Triggers evening study nag.
  - **Security**: Strict enforcement of `Authorization: Bearer <CRON_SECRET>` on all cron routes.
  - `/api/quiz/score` POST route enhanced — now strictly verifies JWT sessions before updating `quiz_scores`.

### Game Master — Database & Curriculum Resolution (2026-03-29)
- **`supabase/migrations/00010_fix_group_settings.sql`** — Resolves "group_id missing" crash. Unifies singleton `id: 1` pattern with `group_id` BIGINT for Telegram group tracking.
- **Strict Sequential Logic**: Refactored `broadcastNextKanji` in `lib/game-logic/broadcast.ts`. Rollover now strictly follows `jlpt_order` using `gt(jlpt_order, current)` without random fallbacks.
- **Quiz Data Payload**: Created `lib/db/quiz.ts` implementing `getGroupQuizData`.
    - **Filter**: Strictly `jlpt_order <= current_kanji.jlpt_order`. 
    - **Payload**: Full Kanji metadata (character, readings, meanings, stroke_count, grammar_explanation) to support 5 question types (Meaning, Kun/On, Reverse, Writing, Audio).
- **Bot Alignment**: `lib/telegram/bot.ts` updated to use `maybeSingle()` and BIGINT casting for `group_id` queries.

### Backend Warden — Telegram Bot Overhaul (2026-03-29)
- **Migration `00011_kanji_navigation_votes.sql`**: Created to track dynamic quorum votes for curriculum navigation.
- **Command Overhaul (`bot.ts`)**:
    - `/today`: Refactored to a clean, text-only Markdown format (Character, Meaning, Onyomi, Kunyomi).
    - `/quiz`: Implemented inline keyboard selection for quiz depth (8, 13, 17, 21 buttons).
    - `/practice` & `/stats`: Now generate secure 7-day JWT Magic Links for automated login.
    - `/help`: Updated UI with deep-linking button for `/ask` using `switchToCurrentChat`.
    - **Voting System**: Implemented `/next` and `/prev` starting a dynamic quorum vote (`(Members - 1)`).
- **Navigation Logic (`broadcast.ts`)**:
    - **`broadcastPrevKanji`**: Implemented logic to shift curriculum backwards sequentially.
    - **Edge Case Handles**: `/prev` now correctly halts with a warning if currently at the beginning of the path (`jlpt_order = 1`).
