-- Migration 00008: Grammatical Particles Dictionary

CREATE TABLE IF NOT EXISTS particles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    particle TEXT NOT NULL UNIQUE,
    romaji TEXT NOT NULL,
    meaning TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed basic particles
INSERT INTO particles (particle, romaji, meaning, description) VALUES
('は', 'wa', 'Topic marker', 'Marks the topic of the sentence. Pronounced "wa" but written with the hiragana for "ha".'),
('が', 'ga', 'Subject marker', 'Marks the grammatical subject of a sentence.'),
('を', 'wo', 'Direct object marker', 'Marks the direct object of an action. Pronounced "o" but written with the hiragana for "wo".'),
('に', 'ni', 'Target / Destination / Time', 'Indicates a destination, a point in time, or the indirect object of an action.'),
('へ', 'e', 'Direction marker', 'Indicates direction of movement. Pronounced "e" but written with the hiragana for "he".'),
('で', 'de', 'Context / Instrument', 'Indicates the location of an action, or the means/instrument used to do something.'),
('と', 'to', 'And / With / Quotation', 'Used to exhaustively list items ("and"), indicate accompaniment ("with"), or mark quotations.'),
('や', 'ya', 'And (non-exhaustive list)', 'Used to list items, implying there are other unlisted items as well.'),
('の', 'no', 'Possession / Modifier', 'Indicates possession ("s") or links nouns together as a modifier.'),
('から', 'kara', 'From / Because', 'Indicates a starting point in time/space ("from"), or a reason/cause ("because").'),
('まで', 'made', 'Until / As far as', 'Indicates an ending point in time/space.'),
('も', 'mo', 'Also / Too', 'Replaces は, が, or を to indicate "also" or "too".'),
('ね', 'ne', 'Sentence ending: Agreement', 'Sentence ending particle used to seek agreement or confirmation ("isn''t it?", "right?").'),
('よ', 'yo', 'Sentence ending: Assurance', 'Sentence ending particle used to emphasize new information or give assurance.')
ON CONFLICT (particle) DO UPDATE 
SET 
  romaji = EXCLUDED.romaji, 
  meaning = EXCLUDED.meaning, 
  description = EXCLUDED.description;
