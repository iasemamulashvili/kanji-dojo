# Kanji Dojo | Project Intelligence Root

This is the **Source of Truth** for the Kanji Dojo project. It coordinates all specialized skills and defines the project-specific constraints.

## 🎌 Project Identity
- **Goal**: A premium Japanese learning application (Next.js/Supabase/Telegram).
- **Aesthetic**: Wabi-Sabi (Premium, Minimalist, Earthy tones).
- **Core Loop**: Daily Kanji -> Practice -> Quiz -> Stats.

## 🛠️ Technical Stack
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, Framer Motion (Transitions).
- **Backend**: Supabase (PostgreSQL, Auth, Storage).
- **Bot**: Telegraf (Telegram API).
- **Scheduling**: Cron-job.org (Free tier external scheduler).

## 🛡️ Expert Directives (Shadowing)
These rules override generic skill instructions:

### 1. Linguistic Rules (`@linguistic-architect`)
- **Ordering**: Always follow the JLPT standard order (1, 2, 3...). 
- **Quiz Types**: Meaning, Kun/On, Writing (no hints), Matching (Click-to-Connect), Listening.
- **Progress**: Kanji is updated daily at 08:00 Tbilisi time (UTC+4).

### 2. Telegram UX (`@telegram-bot-builder`)
- **Middleman Mode**: Common Chat must be ignored; only commands and cron triggers allowed.
- **Offline Mode**: `/today` MUST work offline (stored text only).
- **Persistence**: Usage of JWT in the `?token=` parameter must allow seamless access on any device once logged in.

### 3. Structural Preferences
- **Components**: Functional components only. No Classes.
- **Database**: Use BIGINT for Telegram IDs. 
- **Timezone**: All scheduled events follow `Asia/Tbilisi`.

## 🧠 Active Knowledgebase
Check `./.agent/skills/` for the local implementation of:
- `nextjs-best-practices`: Custom rules for Supabase/JWT.
- `telegram-bot-builder`: Custom rules for Telegraf and Tbilisi CRONs.
- `ui-ux-pro-max`: Custom Wabi-Sabi palette and mobile-first rules.

## 📝 Next Actions
1.  **Refactor Quiz**: [COMPLETED] Click-to-Connect matching mechanic.
2.  **Fix Scoring**: [COMPLETED] Resolved `0 / X` correct answers bug and leaderboard syncing.
3.  **Canvas Fixes**: [COMPLETED] Precision and test-mode hint rules updated for KanjiCanvas.
4.  **Daily Sync**: [COMPLETED] Added `revalidatePath` to the broadcast logic.
5.  **Multiplayer Stats**: Implement more detailed post-quiz results.
