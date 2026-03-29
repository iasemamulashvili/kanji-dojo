-- 00011_kanji_navigation_votes.sql
CREATE TABLE IF NOT EXISTS kanji_navigation_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id BIGINT NOT NULL,
  voter_id BIGINT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('next', 'prev')),
  target_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, voter_id, direction, target_order)
);
