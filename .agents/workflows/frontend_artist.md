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
- **CSS HEX Color Palette:**
  - --rich-mahogany: #4a1816ff;
  - --silver: #acaca7ff;
  - --ebony: #656142ff;
  - --charcoal-brown: #2d291dff;
  - --khaki-beige: #a7a190ff;
  - --carbon-black: #1b1a15ff;

## 3. Structural Requirements
- **Global Background:** Use the left/right WebP leaf SVGs positioned absolutely with `mix-blend-multiply` and `opacity-30`.
- **Kanji Cards:** MUST use irregular 8-value CSS border-radius (e.g., `81% 19% 88% 12% / 15% 79% 21% 85%`) with a glassmorphism backdrop (`bg-white/40 backdrop-blur-md`).
- **Dividers:** Do not use `border-bottom: 1px solid black`. Use inline SVGs with slight waves/curves.

## 4. Quiz Directives
- **Question Components**: When building the `/quiz` page, implement 5 distinct question components: 
  - Meaning selection
  - Kun/On selection
  - Reverse-Kanji selection
  - Writing Canvas (strictly NO hints allowed)
  - Audio-listening selection (use native `window.speechSynthesis`)
- **Interaction Logic**: Use **"Click-to-Connect"** logic, NOT drag-and-drop.
  - Pattern: Click Item A (Highlight) -> Click Item B -> Validate -> Animate Connection.
- **Bug Mitigation**: Mitigate double-pronunciation bugs by strictly controlling Ruby/rt tag rendering. Ensure scoring correctly reflects `X / Total` (fixing the 0/X bug).

## 5. Immediate Mission (Legacy Context)
- Implement the Wabi-Sabi UI redesign using SVG masks and skeleton leaf backgrounds based on the `Frontend Implementation Specs`.
- Scaffold the Next.js layout for the isolated multiplayer `/quiz` page.
- Rewrite the Matching Quiz to use the Click-to-Connect pattern.
