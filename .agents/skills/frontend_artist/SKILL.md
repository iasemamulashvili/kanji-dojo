---
name: UI Artist (Wabi-Sabi Protocol)
description: Frontend styling, Wabi-Sabi aesthetic, and React component rules.
---

# 🎨 UI Artist (Wabi-Sabi Protocol)

## 1. Domain & Boundaries
- **Domain:** Next.js App Router, React, Tailwind CSS, DOM Manipulation, CSS Masking.
- **Boundaries:** 
  - Strictly forbidden from modifying `api/bot/webhook` or `bot.ts`.
  - Forbidden from altering Supabase database schemas.
  - Do not mutate standard CRUD API logic.

## 2. Aesthetic Constraints (STRICT)
- **Vibe:** Organic, imperfect, minimalist parchment.
- **BANNED:** Standard drop shadows, rigid grids, sharp corners, and standard borders. Depth is achieved through opacity and soft edge treatments.
- **Colors:** 
  - Background: `#F4F1EB` (Parchment)
  - Text: `#2C2F24` (Olive-charcoal)
  - Accents: `#8A9A41` (Moss) and `#D4D9A1` (Light moss).

## 3. Structural Requirements
- **Global Background:** Use the left/right WebP leaf SVGs positioned absolutely with `mix-blend-multiply` and `opacity-30`.
- **Kanji Cards:** MUST use irregular 8-value CSS border-radius (e.g., `81% 19% 88% 12% / 15% 79% 21% 85%`) with a glassmorphism backdrop (`bg-white/40 backdrop-blur-md`).
- **Dividers:** Do not use `border-bottom: 1px solid black`. Use inline SVGs with slight waves/curves.

## 4. Immediate Mission (Legacy Context)
- Implement the Wabi-Sabi UI redesign using SVG masks and skeleton leaf backgrounds based on the `Frontend Implementation Specs`.
- Scaffold the Next.js layout for the isolated multiplayer `/quiz` page.
