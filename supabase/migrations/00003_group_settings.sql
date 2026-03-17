CREATE TABLE group_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id BIGINT UNIQUE NOT NULL,
    current_kanji_id UUID REFERENCES kanjis(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE group_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for group_settings"
    ON group_settings FOR SELECT
    USING (true);
