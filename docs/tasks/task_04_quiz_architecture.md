# Task 04: Multiplayer Quiz Engine Architecture

## Overview
Design and implement the `/quiz` Telegram command and its dedicated Next.js practice interface. This task covers the full stack: database schema, question-serving API, frontend drag-and-drop mechanics, and real-time multiplayer synchronization.

## Referenced Protocols
- `@04-game-master.mdc`
- `@03-backend-warden.mdc`
- `@02-frontend-artist.mdc`

## Assigned Agents
- **04-game-master** — Cron integration, `/quiz` Telegram command entry point, session lifecycle.
- **03-backend-warden** — API routes, question engine, Supabase schema.
- **02-frontend-artist** — Next.js quiz UI, drag-and-drop matching component.

---

## 1. Database Schema

Execute the following DDL in the Supabase SQL editor to create the required tables.

```sql
-- Represents a single quiz session initiated by the /quiz command
CREATE TABLE quiz_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kanji_id      INT REFERENCES kanjis(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'waiting',  -- 'waiting' | 'active' | 'finished'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ
);

-- One row per user per session
CREATE TABLE quiz_participants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  telegram_id   BIGINT NOT NULL,
  score         INT NOT NULL DEFAULT 0,
  finished      BOOLEAN NOT NULL DEFAULT FALSE,
  finished_at   TIMESTAMPTZ,
  UNIQUE (session_id, telegram_id)
);

-- Cumulative stats per user across all quiz sessions
CREATE TABLE user_stats (
  telegram_id   BIGINT PRIMARY KEY,
  total_score   INT NOT NULL DEFAULT 0,
  quizzes_played INT NOT NULL DEFAULT 0,
  daily_streak  INT NOT NULL DEFAULT 0,
  last_active   DATE
);
```

**Streak Logic:** When a participant finishes a quiz session, compare `last_active` on their `user_stats` row to the current calendar date in **UTC+4 (Tbilisi Time)**. If `last_active` was yesterday, increment `daily_streak` by 1. If it was earlier, reset `daily_streak` to 1. Always update `last_active` to today.

---

## 2. Question Engine

### 2.1. API Route
Implement a Next.js API route at `app/api/quiz/questions/route.ts` that accepts a `session_id` query parameter and returns a fixed set of 4 questions for the quiz session's target Kanji.

### 2.2. Question JSON Structure
Each response must be a JSON array of exactly 4 question objects, one per type. The `type` field is the canonical discriminator.

```json
[
  {
    "type": "meaning",
    "question": "What does 人 mean?",
    "options": ["Person", "Mountain", "River", "Fire"],
    "answer": "Person"
  },
  {
    "type": "reading",
    "question": "What is the Onyomi reading of 人?",
    "options": ["にん・じん", "かわ", "やま", "ひ"],
    "answer": "にん・じん"
  },
  {
    "type": "reverse",
    "question": "Which Kanji means 'Person'?",
    "options": ["人", "山", "川", "火"],
    "answer": "人"
  },
  {
    "type": "matching",
    "instruction": "Drag each Kanji to its correct English meaning.",
    "pairs": [
      { "kanji": "人", "meaning": "Person" },
      { "kanji": "山", "meaning": "Mountain" },
      { "kanji": "川", "meaning": "River" },
      { "kanji": "火", "meaning": "Fire" }
    ]
  }
]
```

- For `meaning`, `reading`, and `reverse` types: generate 3 plausible distractor options from other Kanji in the database.
- For `matching`: always include exactly 4 pairs.

---

## 3. Frontend Mechanics

### 3.1. Question Type Renderers
Create a dedicated renderer component for each question `type`. A parent `QuizQuestion` component should switch on the `type` field and render the appropriate child.

### 3.2. Drag-and-Drop Matching (`@dnd-kit/core`)
- Install `@dnd-kit/core` and `@dnd-kit/sortable`.
- The `matching` question type MUST be implemented using `@dnd-kit/core` primitives (`DndContext`, `useDraggable`, `useDroppable`).
- **Critical SSR Constraint:** `@dnd-kit` uses browser-only APIs and will cause a Next.js hydration mismatch if server-rendered. The entire matching component MUST be wrapped in a `NoSSR` boundary. Implement this as a simple wrapper:
  ```
  const NoSSR = dynamic(() => import('./MatchingQuestion'), { ssr: false });
  ```
  Use `next/dynamic` with `{ ssr: false }` to load the component only on the client.

### 3.3. Wabi-Sabi Compliance
All quiz UI components must follow `@02-frontend-artist.mdc`. Specifically:
- Answer option cards use the 8-value organic `border-radius` and glassmorphism (`bg-white/40 backdrop-blur-md`).
- Correct/Incorrect feedback uses opacity shifts and color changes, **not** drop shadows.

---

## 4. Multiplayer Sync (Supabase Realtime)

### 4.1. State Machine
A quiz session moves through three states managed via the `quiz_sessions.status` column:
`waiting` → `active` → `finished`

### 4.2. Implementation Steps

1. **Client Subscription:** When a user loads the quiz page, they subscribe to changes on the `quiz_participants` table, filtered by `session_id`.
   ```
   supabase.channel('quiz:<session_id>')
     .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_participants', filter: `session_id=eq.<session_id>` }, handleParticipantUpdate)
     .subscribe()
   ```

2. **"Waiting" Screen:** While `quiz_sessions.status = 'waiting'`, all connected clients display a "Waiting for others..." state. This persists until the session host (or a time-based trigger) sets `status = 'active'`.

3. **Detecting Completion:** When a participant submits their final answer, set `quiz_participants.finished = TRUE` and `finished_at = now()` for their row. Each client's Realtime subscription will fire `handleParticipantUpdate`.

4. **Transition to Leaderboard:** In `handleParticipantUpdate`, the client checks: *"Is every participant's `finished` flag now `TRUE`?"*. If yes, all clients simultaneously transition to the **Leaderboard** view — no server push needed. The leaderboard is derived by ordering participants by `score DESC`, then `finished_at ASC` as a tiebreaker.

5. **Session Cleanup:** Once `status` is set to `finished`, future Realtime updates for that session are ignored. The channel should be unsubscribed when the component unmounts.
