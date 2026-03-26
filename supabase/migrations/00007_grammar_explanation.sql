-- Migration: 00007_grammar_explanation.sql
-- Adds grammar_explanation (TEXT) to the kanjis table.
-- This field provides a plain-English grammar explanation for how the
-- kanji is commonly used in sentences (particle role, verb form, etc.)
-- and is referenced by the sentence-level UI grammar highlight feature.

ALTER TABLE kanjis
  ADD COLUMN IF NOT EXISTS grammar_explanation TEXT;
