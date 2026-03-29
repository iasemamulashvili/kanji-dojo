---
name: Foundation
description: Core architectural rules, tech stack, and global database schema for the Kanji Dojo ecosystem.
---

# ⛩️ Kanji Dojo: Global Architecture

## 1. Tech Stack
- **Frontend:** Next.js 14/15 (App Router), TypeScript, Tailwind CSS.
- **Backend/DB:** Supabase (PostgreSQL).
- **Hosting/Crons:** Vercel (Serverless Webhooks).
- **Bot Engine:** Telegraf (Telegram Bot API).

## 2. Global Architectural Rules
- **Authentication:** NEVER use email/password. We use a "Telegram-First" stateless approach. The user's Telegram ID is passed via a JWT in the URL (`?token=xyz`).
- **Timezone:** All cron jobs and logic strictly operate on **Tbilisi Time (UTC+4)**.
- **Database Logic:** The `kanjis` table has a `jlpt_order` column. Progression is strictly sequential based on this integer. NEVER serve random Kanji.

## 3. Core Database Schema
- `profiles`: `id` (UUID), `telegram_id` (BIGINT), `username` (VARCHAR).
- `kanjis`: `id`, `character`, `meanings` (JSONB), `onyomi` (JSONB), `kunyomi` (JSONB), `jlpt_order` (INT).
- `user_kanji_progress`: Tracks spaced repetition and daily streaks.
