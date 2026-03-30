# Antigravity State Blackboard

## Current Active Branch / Stage
- Phase 4: Long-Term Retention & SRS (Planning)

## Global Blockers
- **None**

## Active Assignments
- **Game Master**: (RESOLVED) Sequential Curriculum logic enforced. Static Routing restored.
- **Backend Warden**: (RESOLVED) TWA Rollback complete. Hardcoded Env-Routing enforced.
- **Frontend Artist**: (RESOLVED) Phase 3 Wabi-Sabi Overhaul complete. Core components refactored.

## Completed Tasks / Schema Definitions

### Phase 3 — Bot Overhaul, Stats & Wabi-Sabi Polish ✅ (2026-03-30)
- **Telegram Bot & Sync**:
    - **Voting Throttles**: Lowered /next and /prev quorum to 1 for rapid testing.
    - **Help Command**: Updated /help to populate /ask in the user's input field using `switchToCurrentChat`.
    - **Middleman Cache**: Implemented in `lib/telegram/cache.ts` to allow /today to work offline or when DB is unreachable.
    - **Sync Logic**: Enhanced `broadcastNextKanji` and `broadcastPrevKanji` with `revalidatePath` to keep web UI synced with bot navigation.
- **Stats Page Construction**:
    - **Stats API**: Created `/api/stats` to securely fetch user progress (streak, accuracy, totals) from `leaderboard` and `quiz_scores` using JWT sessions.
    - **Stats Page UI**: Built `app/stats/page.tsx` with premium Wabi-Sabi design, progress bars, and Framer Motion animations.
- **Full Wabi-Sabi UI Polish**:
    - **Design System Update**: Updated `app/globals.css` with the new color palette (Mahogany, Silver, Ebony, Charcoal Brown, Khaki Beige).
    - **Imperfect Lines**: Implemented the `imperfect-border` utility class and applied it to core UI elements.
    - **Component Refactor**: Updated `PracticeClient.tsx`, `QuizClient.tsx`, and question sub-components to use new tokens and aesthetic rules.

### Game Master — Database & Curriculum Resolution (2026-03-29)
- **`supabase/migrations/00010_fix_group_settings.sql`** — Resolves "group_id missing" crash.
- **Strict Sequential Logic**: Refactored `broadcastNextKanji`. Rollover follows `jlpt_order`.
- **Quiz Data Payload**: Created `lib/db/quiz.ts` implementing `getGroupQuizData`.

### Backend Warden — Quiz Logic & Bot Wiring (2026-03-30)
- **Quiz Button Callbacks**: Handles dynamic question counts and secure Magic Links.
- **Dynamic Question Counts**: `/api/quiz/questions` re-architected to cycle through 5 question types.
- **Security**: Magic links route through `/api/auth/verify`.
