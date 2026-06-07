import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

interface Token {
  text?: string;
  word?: string;
  furigana?: string;
  reading?: string;
  english?: string | null;
  meaning?: string | null;
}

interface ExampleSentence {
  japanese: string;
  english: string;
  tokens: Token[];
}

interface KanjiRecord {
  id: string;
  character: string;
  meanings: string[];
  onyomi: string[];
  kunyomi: string[];
  jlpt_level: number | null;
  stroke_count: number | null;
  jlpt_order: number | null;
  grammar_explanation: string | null;
  example_sentences: ExampleSentence[] | null;
}

async function runAudit() {
  console.log("Fetching all Kanji records from the database...");
  const { data: kanjis, error } = await supabase
    .from('kanjis')
    .select('*')
    .order('jlpt_level', { ascending: false })
    .order('jlpt_order', { ascending: true });

  if (error) {
    console.error("Failed to fetch kanjis:", error);
    process.exit(1);
  }

  console.log(`Successfully fetched ${kanjis.length} Kanji records.`);

  const auditResults = {
    total_records: kanjis.length,
    by_jlpt_level: {} as Record<number, number>,
    missing_required_fields: [] as any[],
    sentence_anomalies: [] as any[],
    token_anomalies: [] as any[],
    records: [] as any[]
  };

  for (const row of (kanjis as KanjiRecord[])) {
    const level = row.jlpt_level || 0;
    auditResults.by_jlpt_level[level] = (auditResults.by_jlpt_level[level] || 0) + 1;

    // Check required fields
    const missingFields: string[] = [];
    if (!row.character) missingFields.push('character');
    if (!row.meanings || row.meanings.length === 0) missingFields.push('meanings');
    // Onyomi and Kunyomi are technically allowed to be empty arrays for some kanji, but let's check if they are null
    if (row.onyomi === null) missingFields.push('onyomi (null)');
    if (row.kunyomi === null) missingFields.push('kunyomi (null)');
    if (row.jlpt_level === null) missingFields.push('jlpt_level');
    if (row.stroke_count === null) missingFields.push('stroke_count');
    if (row.jlpt_order === null) missingFields.push('jlpt_order');
    if (!row.grammar_explanation || row.grammar_explanation.trim() === '') {
      missingFields.push('grammar_explanation');
    }

    if (missingFields.length > 0) {
      auditResults.missing_required_fields.push({
        character: row.character,
        id: row.id,
        jlpt_level: row.jlpt_level,
        missing_fields: missingFields
      });
    }

    // Check example sentences
    const sentences = row.example_sentences;
    if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
      auditResults.sentence_anomalies.push({
        character: row.character,
        error: "Missing or empty example_sentences array",
        sentence_count: 0
      });
      continue;
    }

    // Standard says exactly 3 example sentences (or at least 1, let's verify if they have exactly 3)
    if (sentences.length !== 3) {
      auditResults.sentence_anomalies.push({
        character: row.character,
        error: `Expected exactly 3 example sentences, found ${sentences.length}`,
        sentence_count: sentences.length
      });
    }

    for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
      const sentence = sentences[sIdx];
      const sNum = sIdx + 1;

      if (!sentence.japanese || sentence.japanese.trim() === '') {
        auditResults.sentence_anomalies.push({
          character: row.character,
          sentence_index: sIdx,
          error: `Sentence ${sNum} is missing 'japanese' text`
        });
      }

      if (!sentence.english || sentence.english.trim() === '') {
        auditResults.sentence_anomalies.push({
          character: row.character,
          sentence_index: sIdx,
          error: `Sentence ${sNum} is missing 'english' translation`
        });
      }

      const tokens = sentence.tokens;
      if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        auditResults.token_anomalies.push({
          character: row.character,
          sentence_index: sIdx,
          error: `Sentence ${sNum} has no tokens or empty tokens array`
        });
        continue;
      }

      // Audit tokens for completeness
      for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
        const token = tokens[tIdx];
        const missingKeys: string[] = [];
        const anomalousValues: string[] = [];

        // Check schema compliance
        const hasText = token.hasOwnProperty('text');
        const hasFurigana = token.hasOwnProperty('furigana');
        const hasEnglish = token.hasOwnProperty('english');

        const hasWord = token.hasOwnProperty('word');
        const hasReading = token.hasOwnProperty('reading');
        const hasMeaning = token.hasOwnProperty('meaning');

        // Check if using legacy keys and missing UI keys
        if (!hasText && hasWord) {
          missingKeys.push('text (but has legacy "word")');
        } else if (!hasText) {
          missingKeys.push('text');
        }

        if (!hasFurigana && hasReading) {
          missingKeys.push('furigana (but has legacy "reading")');
        } else if (!hasFurigana) {
          missingKeys.push('furigana');
        }

        if (!hasEnglish && hasMeaning) {
          missingKeys.push('english (but has legacy "meaning")');
        } else if (!hasEnglish) {
          missingKeys.push('english');
        }

        // Extract values safely
        const wordText = String(token.text || token.word || '').trim();
        const rawReading = token.hasOwnProperty('furigana') ? token.furigana : token.reading;
        const wordReading = String(rawReading !== null && rawReading !== undefined ? rawReading : '').trim();

        // 1. Critical text check: must not be empty
        if (wordText === '') {
          anomalousValues.push('empty word/text');
        }

        // 2. Linguistic: Kanji words MUST have non-empty, non-null furigana
        const containsKanji = /[\u4e00-\u9faf]/.test(wordText);
        if (containsKanji) {
          if (rawReading === null || rawReading === undefined || String(rawReading).trim() === '') {
            anomalousValues.push(`kanji word "${wordText}" is missing furigana/reading`);
          }
        }

        // 3. Linguistic: Particles check
        if (wordText === 'は' && rawReading !== null && rawReading !== undefined && wordReading !== 'わ' && wordReading !== 'は' && wordReading !== '') {
          anomalousValues.push(`topic particle 'は' has suspicious reading '${wordReading}' (expected 'わ', 'は', or empty)`);
        }
        if (wordText === 'を' && rawReading !== null && rawReading !== undefined && wordReading !== 'を' && wordReading !== 'お' && wordReading !== '') {
          anomalousValues.push(`object particle 'を' has suspicious reading '${wordReading}' (expected 'w', 'を', 'お', or empty)`);
        }

        if (missingKeys.length > 0 || anomalousValues.length > 0) {
          auditResults.token_anomalies.push({
            character: row.character,
            sentence_index: sIdx,
            sentence_text: sentence.japanese,
            token_index: tIdx,
            token_data: token,
            missing_keys: missingKeys.length > 0 ? missingKeys : undefined,
            anomalous_values: anomalousValues.length > 0 ? anomalousValues : undefined
          });
        }
      }
    }
  }

  console.log("\n================ AUDIT SUMMARY ================");
  console.log(`Total Kanji Rows Checked: ${auditResults.total_records}`);
  console.log("Breakdown by JLPT level:", auditResults.by_jlpt_level);
  console.log(`Rows with missing required fields: ${auditResults.missing_required_fields.length}`);
  console.log(`Sentence configuration anomalies: ${auditResults.sentence_anomalies.length}`);
  console.log(`Token data anomalies/gaps: ${auditResults.token_anomalies.length}`);
  console.log("===============================================\n");

  // Save audit results to a JSON file for deep analysis if needed
  fs.writeFileSync('scripts/audit-report-raw.json', JSON.stringify(auditResults, null, 2));
  console.log("Raw audit log written to scripts/audit-report-raw.json");
}

runAudit().catch(console.error);
