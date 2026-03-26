-- Migration: 00005_add_jlpt_order.sql
-- Adds jlpt_order INTEGER UNIQUE to the kanjis table and re-sequences
-- all existing rows 1..N, ordered by jlpt_level DESC (N5 first =5, N1 last =1),
-- then stroke_count ASC as a secondary sort within each JLPT level.
-- This establishes the canonical sequential curriculum order required by the
-- Game Master skill and Foundation architectural rules.

-- Step 1: Add the column (nullable initially to allow backfill)
ALTER TABLE kanjis
  ADD COLUMN IF NOT EXISTS jlpt_order INTEGER;

-- Step 2: Backfill — assign sequential integers 1..N
-- Ordering: highest jlpt_level first (5 = N5 beginner), stroke_count ASC within level.
WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY jlpt_level DESC, stroke_count ASC, character ASC
    ) AS new_order
  FROM kanjis
)
UPDATE kanjis
SET jlpt_order = ordered.new_order
FROM ordered
WHERE kanjis.id = ordered.id;

-- Step 3: Enforce NOT NULL + UNIQUE now that all rows are populated
ALTER TABLE kanjis
  ALTER COLUMN jlpt_order SET NOT NULL;

ALTER TABLE kanjis
  ADD CONSTRAINT kanjis_jlpt_order_unique UNIQUE (jlpt_order);

-- Step 4: Index for fast sequential navigation queries
CREATE INDEX IF NOT EXISTS idx_kanjis_jlpt_order ON kanjis (jlpt_order ASC);
