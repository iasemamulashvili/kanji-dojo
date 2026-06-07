-- =====================================================================
-- KANJI DOJO — GRAMMAR UPGRADE MIGRATION (Idempotent)
-- Paste this entire file into your Supabase SQL Editor and click Run.
-- =====================================================================

BEGIN;

-- 0. Ensure public.kanjis table has grammar_explanation column (Safely Add)
ALTER TABLE public.kanjis ADD COLUMN IF NOT EXISTS grammar_explanation TEXT;

-- 1. Rename 'particles' to 'grammar_dictionary' safely if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'particles') THEN
        ALTER TABLE public.particles RENAME TO grammar_dictionary;
        ALTER TABLE public.grammar_dictionary RENAME COLUMN particle TO token;
    END IF;
END $$;

-- 2. Ensure table exists with evolved structure
CREATE TABLE IF NOT EXISTS public.grammar_dictionary (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token       TEXT NOT NULL UNIQUE,
    romaji      TEXT NOT NULL,
    category    TEXT NOT NULL CHECK (category IN ('particle', 'suffix', 'prefix', 'conjugation')),
    meaning     TEXT NOT NULL,
    description TEXT,
    jlpt_level  INTEGER DEFAULT 5,
    created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add category and jlpt_level column if they don't exist (in case rename occurred)
ALTER TABLE public.grammar_dictionary ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'particle' CHECK (category IN ('particle', 'suffix', 'prefix', 'conjugation'));
ALTER TABLE public.grammar_dictionary ADD COLUMN IF NOT EXISTS jlpt_level INTEGER DEFAULT 5;

-- 4. Create user_grammar_progress table for SRS tracking
CREATE TABLE IF NOT EXISTS public.user_grammar_progress (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    grammar_token_id UUID REFERENCES public.grammar_dictionary(id) ON DELETE CASCADE NOT NULL,
    srs_level        INTEGER DEFAULT 0,
    next_review_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    correct_streak   INTEGER DEFAULT 0,
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, grammar_token_id)
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.grammar_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_grammar_progress ENABLE ROW LEVEL SECURITY;

-- 6. DDL RLS Policies
DROP POLICY IF EXISTS "Public read access for grammar_dictionary" ON public.grammar_dictionary;
CREATE POLICY "Public read access for grammar_dictionary"
    ON public.grammar_dictionary FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can select their own grammar progress" ON public.user_grammar_progress;
CREATE POLICY "Users can select their own grammar progress"
    ON public.user_grammar_progress FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own grammar progress" ON public.user_grammar_progress;
CREATE POLICY "Users can insert their own grammar progress"
    ON public.user_grammar_progress FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own grammar progress" ON public.user_grammar_progress;
CREATE POLICY "Users can update their own grammar progress"
    ON public.user_grammar_progress FOR UPDATE USING (user_id = auth.uid());

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_grammar_dict_token ON public.grammar_dictionary (token);
CREATE INDEX IF NOT EXISTS idx_user_grammar_srs ON public.user_grammar_progress (user_id, next_review_at);

-- 7. Seed Masterclass N5/N4 Grammar Dataset
INSERT INTO public.grammar_dictionary (token, romaji, category, meaning, description, jlpt_level) VALUES
-- --- N5 Particles ---
('は', 'wa', 'particle', 'Topic Marker', 'Marks the main topic of the sentence. Pronounced as "wa" but written with hiragana "ha". Sets the context.', 5),
('が', 'ga', 'particle', 'Subject Marker', 'Marks the specific subject of the sentence, often introducing new information or emphasizing WHO performed the action.', 5),
('を', 'wo', 'particle', 'Direct Object Marker', 'Indicates the direct object of a transitive action verb. Written as "wo" but pronounced "o" in modern speech.', 5),
('に', 'ni', 'particle', 'Destination / Time / Indirect Object', 'Marks destination of movement (to), specific points in time (at/on), and recipients of actions.', 5),
('へ', 'e', 'particle', 'Direction Marker', 'Emphasizes the general direction of movement (towards). Written as "he" but pronounced "e".', 5),
('で', 'de', 'particle', 'Location of Action / Instrument', 'Marks where an action takes place, or the tool/instrument/method used to complete an action.', 5),
('と', 'to', 'particle', 'And / With (Exhaustive)', 'Joins nouns together to form a complete, exhaustive list ("and"), or indicates accompaniment ("with").', 5),
('や', 'ya', 'particle', 'And (Non-Exhaustive list)', 'Links nouns to list representative examples, implying there are other unlisted items in the group.', 5),
('の', 'no', 'particle', 'Possession / Linker', 'Indicates ownership ("s") or links nouns together, where the first noun modifies the second.', 5),
('から', 'kara', 'particle', 'From / Starting Point / Because', 'Indicates a starting point in time/space ("from"), or specifies the reason or cause ("because") when ending a clause.', 5),
('まで', 'made', 'particle', 'Until / Limit', 'Indicates a boundary or terminal limit in space or time ("until", "as far as").', 5),
('も', 'mo', 'particle', 'Also / Too', 'Replaces particles は, が, or を to indicate that the same statement applies to another subject/object ("also").', 5),
('ね', 'ne', 'particle', 'Sentence Ending: Seeking Agreement', 'Placed at the end of a sentence to seek agreement, reassurance, or build rapport ("right?", "isn''t it?").', 5),
('よ', 'yo', 'particle', 'Sentence Ending: Assurance / Emphasis', 'Used at the end of a sentence to offer new info, assert certainty, or emphasize a statement.', 5),
('か', 'ka', 'particle', 'Question Marker', 'Placed at the end of a sentence to mark a question. Replaces the question mark.', 5),

-- --- N4 Particles ---
('だけ', 'dake', 'particle', 'Only / Just', 'Indicates a limit, specifying that nothing else is included. Replaces or attaches directly to nouns.', 4),
('ばかり', 'bakari', 'particle', 'Nothing But / Just Finished', 'Indicates that something is done exclusively ("nothing but") or that an action has literally just finished (past tense + bakari).', 4),
('しか', 'shika', 'particle', 'Only (Used with Negative)', 'Means "only" or "nothing but". Always paired with a negative verb to express limitation with a nuanced tone of insufficiency.', 4),
('でも', 'demo', 'particle', 'But / Even / Or something', 'Translates to "even if" or "but". When attached to a noun, it suggests it as an example ("or something like that").', 4),
('ながら', 'nagara', 'particle', 'While / Doing Simultaneously', 'Attached to verb stem to indicate that two actions are performed simultaneously by the same subject.', 4),
('より', 'yori', 'particle', 'Than (Comparison)', 'Used in comparison statements, marking the standard or baseline of comparison ("more than X").', 4),
('ほど', 'hodo', 'particle', 'Extent / Degree / Limit', 'Specifies the approximate degree or extent of something ("as much as", "to the extent of").', 4),
('ぐらい', 'gurai', 'particle', 'Approximate Amount / Degree', 'Indicates an approximate duration, quantity, or level ("about", "around"). Also written "kurai".', 4),
('までに', 'made ni', 'particle', 'By / Before (Deadline)', 'Marks a deadline by which an action must be completed ("by", "no later than"). Distinct from until (made).', 4),
('ずつ', 'zutsu', 'particle', 'Each / At a Time', 'Marks distribution, indicating that a quantity is divided equally ("two each", "one at a time").', 4),

-- --- N5/N4 Prefixes & Suffixes ---
('お', 'o-', 'prefix', 'Polite Prefix (Wago)', 'Preposed to Japanese-origin nouns and adjectives to show respect or add refinement (e.g., お茶, お水).', 5),
('ご', 'go-', 'prefix', 'Polite Prefix (Kango)', 'Preposed to Chinese-origin compound nouns to show respect or add formal refinement (e.g., ご飯, ご連絡).', 5),
('たち', 'tachi', 'suffix', 'Plural Suffix for People', 'Sufixed to pronouns or nouns representing people to form a plural group (e.g., 私たち - we, 子供たち - children).', 5),
('方', 'kata', 'suffix', 'Way of doing / Method', 'Attached to the verb stem (masu-stem) to represent the method or manner of doing that action (e.g., 読み方 - way of reading).', 4),
('屋', 'ya', 'suffix', 'Shop / Store Suffix', 'Attached to a product name to denote the shop that sells it, or the person who runs it (e.g., 本屋 - bookstore).', 5),
('さ', 'sa', 'suffix', 'Noun-forming Adjective Suffix', 'Attached to adjective stems (removing -i or -na) to turn them into abstract nouns measuring degree (e.g., 高さ - height).', 4),
('人', 'jin / nin', 'suffix', 'Person / Nationality / Counter', 'As -jin, it indicates nationality (e.g. 日本人). As -nin, it counts people (e.g. 三人).', 5),
('回', 'kai', 'suffix', 'Counter for Occurrences', 'Counter suffix indicating the number of times an event happens (e.g. 一回 - once, 何回 - how many times).', 5),
('日', 'nichi / ka', 'suffix', 'Counter for Days', 'Sufixed to count days or denote dates of the month (e.g. 三日 - third day/three days).', 5),
('時', 'ji', 'suffix', 'Hour / O''clock Counter', 'Counter suffix used to indicate o''clock or hours (e.g. 三時 - 3 o''clock).', 5),

-- --- N5/N4 Verb Suffixes & Conjugations ---
('ました', 'mashita', 'conjugation', 'Past Polite Verb Suffix', 'Conjugates a verb into its polite, formal past tense (positive). Attached to verb stem.', 5),
('せん', 'masen', 'conjugation', 'Non-Past Negative Polite', 'Conjugates a verb into its polite, formal present/future negative form (e.g., 行きません - will not go).', 5),
('ませんでした', 'masendeshita', 'conjugation', 'Past Negative Polite', 'Polite, formal past negative verb ending (e.g., 食べませんでした - did not eat).', 5),
('ます', 'masu', 'conjugation', 'Polite Non-Past Verb Suffix', 'Standard polite, formal ending for present/future affirmative verbs.', 5),
('て', 'te', 'conjugation', 'Conjunctive / Request Form', 'The te-form suffix. Links verbs in sequence, indicates cause, or acts as a mild request when followed by kudasai.', 5),
('ない', 'nai', 'conjugation', 'Negative Plain Suffix', 'Conjugates a verb into its casual, plain present negative form. Act as an i-adjective structurally.', 5),
('たい', 'tai', 'conjugation', 'Desire Suffix (Want to)', 'Attached to the verb stem to express desire ("want to do"). Inflects exactly like an i-adjective.', 4),
('ましょう', 'mashou', 'conjugation', 'Polite Volitional (Let''s)', 'Polite suggestion or invitation ("let''s do X" or "shall I do X?"). Attached to verb stem.', 5),
('させる', 'saseru', 'conjugation', 'Causative Verb Suffix', 'Indicates that the subject makes or lets someone else perform an action (e.g., 行かせる - to make/let go).', 4),
('られる', 'rareru', 'conjugation', 'Passive / Potential Suffix', 'Conjugates Group 2 verbs into the passive ("to be done") or potential ("can do") form.', 4),
('ば', 'ba', 'conjugation', 'Conditional Suffix (If)', 'Forms a conditional statement ("if... then"). Attached to the e-column of verbs or adjectives.', 4),
('たら', 'tara', 'conjugation', 'Past Conditional (If / When)', 'Strong conditional/temporal suffix ("if" or "once action is completed"). Formed from past tense + ra.', 4),
('そう', 'sou', 'conjugation', 'Conjectural: Looks like / Hear that', 'Attached to adjective or verb stems to mean "looks like" (e.g., 美味しそう). Attached to plain form for hearsay.', 4),
('にくい', 'nikui', 'conjugation', 'Difficult to do Suffix', 'Attached to verb stem to indicate that performing the action is physically or mentally difficult.', 4),
('やすい', 'yasui', 'conjugation', 'Easy to do Suffix', 'Attached to verb stem to indicate that performing the action is simple or intuitive.', 4),
('ください', 'kudasai', 'suffix', 'Please Request Suffix', 'Added directly after the conjunctive te-form of a verb to formulate a polite request.', 5)
ON CONFLICT (token) DO UPDATE SET
    romaji      = EXCLUDED.romaji,
    category    = EXCLUDED.category,
    meaning     = EXCLUDED.meaning,
    description = EXCLUDED.description,
    jlpt_level  = EXCLUDED.jlpt_level;

COMMIT;
