# Task 03: Wabi-Sabi UI & Audio Bug Fix

## Overview
This task encompasses two major frontend improvements for the main practice page: fixing an audio context bug and completing the Wabi-Sabi aesthetic overhaul.

## Referenced Protocols
- `@02-frontend-artist.mdc`

## Assigned Agent
**02-frontend-artist**

## 1. The Audio Bug Fix: Onyomi vs Kunyomi
- **The Issue:** Currently, isolated clicks on the Kanji audio playback button are incorrectly triggering the Kunyomi reading instead of the Onyomi reading.
- **Action Required:**
  - Locate the component responsible for Kanji audio playback (likely within `components/**/*.tsx` or `app/(frontend)/**/*.tsx`).
  - Modify the event handler or the audio source logic so that when a user clicks the main audio button for an isolated Kanji, the contextually accurate **Onyomi** (Chinese reading) is played default/first, rather than the Kunyomi.

## 2. The Aesthetic Overhaul (Wabi-Sabi Protocol)
The UI Artist **MUST** apply the strict aesthetic rules from `@02-frontend-artist.mdc` to the main practice page.

### 2.1. Color Palette Implementation
- Ensure the global CSS or Tailwind configuration explicitly applies these theme colors:
  - **Background:** `#F4F1EB` (Parchment)
  - **Text:** `#2C2F24` (Olive-charcoal)
  - **Accents:** `#8A9A41` (Moss) and `#D4D9A1` (Light moss)

### 2.2. Global Background
- Implement absolute-positioned left and right WebP leaf images/SVGs on the main page layout.
- These background images MUST have the Tailwind classes `mix-blend-multiply` and `opacity-30` applied to achieve the intended organic depth.

### 2.3. Anti-Rigidity (Banned Elements)
- Scan the main practice page and forcefully **REMOVE**:
  - Standard drop shadows (`shadow-md`, etc.)
  - Rigid grid structures that feel too mechanical
  - Sharp corners (`rounded-none` or small rigid radiuses)
  - Standard CSS borders (`border`, `border-b`, `border-black`, etc.)

### 2.4. Organic Kanji Cards (Glassmorphism)
- Convert the main Kanji display card (and any interactive child cards) to use an irregular 8-value CSS `border-radius`.
  *Example:* `border-radius: 81% 19% 88% 12% / 15% 79% 21% 85%;`
- Apply the glassmorphism backdrop classes exactly as specified: `bg-white/40 backdrop-blur-md` to achieve depth without shadows.

### 2.5. SVGs for Dividers
- Wherever a visual separation is needed (previously done with `border-bottom`), implement inline SVGs that depict slight waves or curves to maintain the imperfect, hand-drawn wabi-sabi feel.
