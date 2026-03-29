-- Resolve the missing group_id column in group_settings
-- This specifically fixes the 500 error: "column group_settings.group_id does not exist"

-- 1. Ensure the column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='group_settings' AND column_name='group_id') THEN
        ALTER TABLE group_settings ADD COLUMN group_id BIGINT;
    END IF;
END $$;

-- 2. Populate the group_id if it's currently null using the singleton or default logic
-- If we only have 1 group, we can set it to the expected group ID if we know it.
-- But since this is a general migration, we'll just allow it for now.
-- In bot.ts, we use the value from process.env.TELEGRAM_GROUP_ID.

-- 3. Ensure the id column is INT for the singleton logic (matching migration 00004 intent)
ALTER TABLE group_settings 
ALTER COLUMN id TYPE INT USING (CASE WHEN id IS NOT NULL THEN 1 ELSE 1 END);

-- 4. Add uniqeness constraint to group_id if not already present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_settings_group_id_key') THEN
        ALTER TABLE group_settings ADD CONSTRAINT group_settings_group_id_key UNIQUE (group_id);
    END IF;
END $$;
