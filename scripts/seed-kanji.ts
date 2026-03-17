import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const seedKanjis = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for local administration!');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const kanjiArray = [
        {
            character: '一',
            meanings: ['One'],
            onyomi: ['ichi', 'itsu'],
            kunyomi: ['hito', 'hito.tsu'],
            jlpt_level: 5,
            stroke_count: 1,
            example_sentences: [
              {
                "japanese": "一日は二十四時間です。",
                "english": "One day is 24 hours.",
                "tokens": [
                  { "word": "一日", "reading": "いちにち", "meaning": "one day" },
                  { "word": "は", "reading": "わ", "meaning": "topic particle" },
                  { "word": "二十四", "reading": "にじゅうよん", "meaning": "twenty-four" },
                  { "word": "時間", "reading": "じかん", "meaning": "hours" },
                  { "word": "です", "reading": "です", "meaning": "is / to be" },
                  { "word": "。", "reading": "", "meaning": "punctuation" }
                ]
              },
              {
                "japanese": "もう一度言ってください。",
                "english": "Please say it one more time.",
                "tokens": [
                  { "word": "もう", "reading": "もう", "meaning": "more" },
                  { "word": "一度", "reading": "いちど", "meaning": "one time" },
                  { "word": "言って", "reading": "いって", "meaning": "say" },
                  { "word": "ください", "reading": "ください", "meaning": "please" },
                  { "word": "。", "reading": "", "meaning": "punctuation" }
                ]
              },
              {
                "japanese": "一番好きな食べ物は何ですか。",
                "english": "What is your number one favorite food?",
                "tokens": [
                  { "word": "一番", "reading": "いちばん", "meaning": "number one / most" },
                  { "word": "好きな", "reading": "すきな", "meaning": "favorite" },
                  { "word": "食べ物", "reading": "たべもの", "meaning": "food" },
                  { "word": "は", "reading": "わ", "meaning": "topic particle" },
                  { "word": "何", "reading": "なに", "meaning": "what" },
                  { "word": "です", "reading": "です", "meaning": "is" },
                  { "word": "か", "reading": "か", "meaning": "question particle" },
                  { "word": "。", "reading": "", "meaning": "punctuation" }
                ]
              }
            ]
        },
        {
            character: '二',
            meanings: ['Two'],
            onyomi: ['ni', 'ji'],
            kunyomi: ['futa', 'futa.tsu'],
            jlpt_level: 5,
            stroke_count: 2,
            example_sentences: [
              {
                "japanese": "二人は友達です。",
                "english": "The two of them are friends.",
                "tokens": [
                  { "word": "二人", "reading": "ふたり", "meaning": "two people" },
                  { "word": "は", "reading": "わ", "meaning": "topic particle" },
                  { "word": "友達", "reading": "ともだち", "meaning": "friends" },
                  { "word": "です", "reading": "です", "meaning": "is / to be" },
                  { "word": "。", "reading": "", "meaning": "punctuation" }
                ]
              }
            ]
        },
        {
            character: '三',
            meanings: ['Three'],
            onyomi: ['san', 'zou'],
            kunyomi: ['mi', 'mi.tsu', 'mit.tsu'],
            jlpt_level: 5,
            stroke_count: 3,
            example_sentences: [
              {
                "japanese": "りんごを三つ食べました。",
                "english": "I ate three apples.",
                "tokens": [
                  { "word": "りんご", "reading": "りんご", "meaning": "apples" },
                  { "word": "を", "reading": "を", "meaning": "object particle" },
                  { "word": "三つ", "reading": "みっつ", "meaning": "three things" },
                  { "word": "食べ", "reading": "たべ", "meaning": "eat" },
                  { "word": "ました", "reading": "ました", "meaning": "past polite suffix" },
                  { "word": "。", "reading": "", "meaning": "punctuation" }
                ]
              }
            ]
        }
    ];

    try {
        const { data, error } = await supabaseAdmin
            .from('kanjis')
            .upsert(kanjiArray, { onConflict: 'character' })
            .select();

        if (error) {
            console.error('Error seeding kanjis:', error.message);
            return;
        }

        console.log('Successfully seeded database with basic kanjis:', data?.map((k: any) => k.character).join(', '));
    } catch (e) {
        console.error('Unexpected error during seeding:', e);
    }
};

seedKanjis();
