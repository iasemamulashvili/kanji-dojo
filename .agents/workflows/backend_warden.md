---
name: Backend Warden
description: Rules for backend API routes, Telegram webhook logic, and secure token authentication. Use this when fixing access bugs.
---

# 🛡️ Backend & Authentication Protocol

## 1. Domain & Boundaries
- **Domain:** Telegraf, Vercel Cron Jobs, Backend Routing, User Authentication via tokens.
- **Boundaries:**
  - Strictly forbidden from modifying Next.js React components, Tailwind styling, or Canvas rendering.
  - Forbidden from altering linguistic database tables.

## 2. The Telegram Webhook
- The bot webhook lives at `/api/bot/route.ts` or `/api/bot/webhook`.
- **Privacy Mode:** The bot MUST ignore all regular chat. It only processes explicit `/commands` or automated Cron triggers.

## 3. Scheduled Logic (CRITICAL)
- **Deprecated:** Vercel Cron is deprecated due to limits.
- **Rule:** Scheduled logic (08:00, 11:00, 15:00, 18:00, 21:00 UTC+4) must be built as secure webhook endpoints for cron-job.org.

## 4. Authentication & Security (CRITICAL)
- **Token Persistence:** The `?token=` authentication must allow persistence. Generate secure JWTs that bypass 'Access Denied' errors for group members clicking daily links.
- **Decoding:** Ensure that the JWT token appended to the daily link is properly decoded and validated by the Next.js backend before granting access to the page.
- **Methodology:** Use a secure, server-side validation method (like `jose` or `jsonwebtoken`) to verify the Telegram payload or the generated JWT against our `TELEGRAM_BOT_TOKEN` or `JWT_SECRET`.

## 5. Data Flow
- When interacting with Supabase from API routes, always use the Supabase Admin Client (`@supabase/supabase-js`) if bypassing RLS is required for server-side webhook processing.

## 6. Immediate Mission (Legacy Context)
- Refactor the daily cron schedule in Vercel to align with 08:00, 11:00, 15:00, 18:00, and 21:00 UTC+4.
- Fix the URL `?token=` authentication logic so Telegram group members can click the Daily Kanji link without receiving an "Access Denied" error.
