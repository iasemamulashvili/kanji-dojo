# Task 01: `/next` Command Implementation

## Overview
Implement a Telegram `/next` voting command. When users vote to skip the current Kanji and a quorum is reached, the 08:00 (Tbilisi Time) morning routine is triggered early. This broadcasts the next sequential Kanji to the group.

## Agent Assigned
**04-game-master**

## 1. Supabase Schema Updates

A new table must be created to track active votes so that serverless webhook invocations can persist the voting state.

**Suggested Table Schema:** `kanji_votes`
- `id`: UUID (Primary Key)
- `current_jlpt_order`: INT (References the `jlpt_order` of the currently active Kanji being skipped)
- `voter_telegram_id`: BIGINT (The Telegram ID of the user casting the vote)
- `created_at`: TIMESTAMPTZ (Defaults to `now()`)

*Constraint:* Unique composite key on `(current_jlpt_order, voter_telegram_id)` to ensure only one vote per user per Kanji.

## 2. Technical Specifications & Timezone Constraints

- **Strict Timezone:** All timezone calculations (e.g., checking if the 08:00 routine already ran today to prevent double-skipping) MUST strictly use **Tbilisi Time (UTC+4)**.
- **Sequential Progression:** As per foundational rules, the newly broadcasted Kanji MUST be the next one in the `jlpt_order`. **NEVER** serve random Kanji.
- **Quorum Threshold:** Define a numeric threshold (e.g., 3 unique votes). When the `kanji_votes` table has `>= 3` rows for the `current_jlpt_order`, the vote passes.
- **Idempotency:** Once the quorum is reached and the next Kanji is broadcasted, subsequent `/next` votes for the *old* Kanji must be ignored.

## 3. Step-by-Step Logic

### Step 1: Abstract the 08:00 Routine
- Locate the code responsible for the 08:00 morning broadcast (likely in `scripts/crons/**/*.ts` or `lib/game-logic/**/*.ts`).
- Extract this logic into a reusable asynchronous function, e.g., `broadcastNextKanji(trigger: 'cron' | 'vote')`.
- Ensure this function queries the database for the *current* `jlpt_order`, increments it by 1, and broadcasts the new Kanji strictly sequentially.

### Step 2: Implement the `/next` Webhook Handler
- In the Telegram webhook handler, intercept the `/next` command.
- When `/next` is received:
  1. Identify the user's `telegram_id` and the `current_jlpt_order` currently active in the group.
  2. Insert a new record into the `kanji_votes` table. If the unique constraint error is thrown (user already voted), return a Telegram message: *"You have already voted to skip this Kanji."*
  3. Query the `kanji_votes` table to count the total votes for the `current_jlpt_order`.

### Step 3: Evaluate Voting Condition
- If total votes `<` Quorum:
  - Send a message to the group: *"Vote registered! [X/3] votes to skip to the next Kanji."*
- If total votes `>=` Quorum:
  - Send a message to the group: *"Vote passed! Skipping to the next Kanji..."*
  - **Crucial Action:** Invoke the `broadcastNextKanji(trigger: 'vote')` function to trigger the 08:00 morning routine early.
  - *(Optional)* Set a flag or reliance on the `current_jlpt_order` shifting forward so old votes become invalidated automatically.

### Step 4: Update the 08:00 Cron Job
- Update the actual Vercel cron job that runs at 08:00 UTC+4.
- When the cron fires, it should check if a Kanji was already skipped "today" via voting. If `broadcastNextKanji` was already triggered manually that calendar day (in UTC+4), the cron should skip execution to avoid skipping two Kanjis in one day.
