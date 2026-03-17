ALTER TABLE group_settings
ALTER COLUMN id DROP DEFAULT,
ALTER COLUMN id SET DATA TYPE INT USING (1); 

-- We only ever need one setting for a group, but the initial design made id a UUID. 
-- The user explicitely requested to rely on upsert with `{ id: 1, current_kanji_id: newId }`
-- If we only ever have 1 configuration per group, group_id is unique so it acts as the primary logical key anyway.
-- Let's change id to INT so the query `id: 1` succeeds.
