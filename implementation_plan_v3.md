# 🎌 Kanji Dojo — Phase 3: Implementation Plan

## Overview
Phase 3 focuses on Telegram bot enhancements, secure stats visualization, and a comprehensive "Wabi-Sabi" UI overhaul.

## Stage 1: 🤖 Telegram Bot & Sync (Backend Warden)
- [ ] **Task 1: Testing Throttles**: In `lib/telegram/bot.ts`, temporarily lower `/next` and `/prev` quorum to `1` vote.
- [ ] **Task 2: Help Command Fix**: Update `/help` command to ensure the "Ask Sensei" button populates the input window with `/ask ` instead of sending it directly.
- [ ] **Task 3: Today Command Middleman**: 
    - Implement a file-based or memory-based cache for the last successfully fetched Kanji in `lib/telegram/cache.ts`.
    - Ensure `/today` uses this cache if the DB is slow or unreachable.
    - Add `revalidatePath('/practice')` and `revalidatePath('/stats')` to all rollover events (inc. `/prev`).

## Stage 2: 📊 Stats Page Construction (Game Master)
- [ ] **Task 1: Stats API**: Create `/api/stats` to fetch user stats (streak, accuracy, totals, best score) from `leaderboard` and `quiz_scores` using the JWT session.
- [ ] **Task 2: Stats Page UI**: Build `app/stats/page.tsx` with:
    - Secure session handling.
    - Display cards for: Streak, Accuracy %, Total Correct/Questions, and Best Score.
    - Apply Wabi-Sabi aesthetic (irregular borders, new palette).

## Stage 3: 🎨 Full Wabi-Sabi UI Polish (UI Artist)
- [ ] **Task 1: Design System Update**: Update `app/globals.css` with the new color variables:
    - Rich Mahogany (#4a1816)
    - Silver (#acaca7)
    - Ebony (#656142)
    - Charcoal Brown (#2d291d)
    - Khaki Beige (#a7a190)
- [ ] **Task 2: Imperfect Lines**: Implement "Imperfect Lines" (irregular `border-radius`) across all components via a utility class or specific component styles.
- [ ] **Task 3: Refactor Core Components**:
    - Update `PracticeClient.tsx`.
    - Update `QuizClient.tsx` and its question sub-components.
    - Ensure consistent use of the new color tokens.

## Operational Constraints
- **Timezone**: Strictly `Asia/Tbilisi` (UTC+4).
- **Execution**: Dispatched via `subagent-driven-development`.
