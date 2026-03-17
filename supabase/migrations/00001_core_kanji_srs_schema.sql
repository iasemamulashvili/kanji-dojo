CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_id BIGINT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create kanjis table
CREATE TABLE kanjis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character VARCHAR UNIQUE NOT NULL,
    meanings TEXT[],
    onyomi TEXT[],
    kunyomi TEXT[],
    jlpt_level INTEGER,
    stroke_count INTEGER,
    example_sentences JSONB DEFAULT '[]'::jsonb
);

-- Create user_kanji_progress table
CREATE TABLE user_kanji_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    kanji_id UUID REFERENCES kanjis(id) ON DELETE CASCADE NOT NULL,
    srs_level INTEGER DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    correct_streak INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, kanji_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanjis ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kanji_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can select their own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- RLS Policies for kanjis
CREATE POLICY "Public read access for kanjis"
    ON kanjis FOR SELECT
    USING (true);

-- RLS Policies for user_kanji_progress
CREATE POLICY "Users can select their own progress"
    ON user_kanji_progress FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own progress"
    ON user_kanji_progress FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
    ON user_kanji_progress FOR UPDATE
    USING (user_id = auth.uid());
