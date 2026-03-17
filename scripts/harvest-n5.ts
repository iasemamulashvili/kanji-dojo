import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_INSTRUCTION = `
You are an expert Japanese linguist API. Your task is to output pure JSON data for JLPT N5 Kanjis.
Do NOT output any markdown blocks, backticks, or explanation. ONLY raw JSON.

Return a JSON array of carefully crafted Kanji objects.
For each Kanji, you MUST strictly follow this exact structural schema:
{
  "character": "string (the kanji character)",
  "meanings": ["string array"],
  "onyomi": ["string array"],
  "kunyomi": ["string array"],
  "jlpt_level": 5,
  "stroke_count": number,
  "sentences": [
    {
      "japanese": "string",
      "english": "string",
      "tokens": [
        { "text": "string", "furigana": "string (optional)" }
      ]
    }
  ] // MUST be exactly 3 sentence objects.
}
`;

async function fetchKanjiBatch(batchIndex: number, batchSize: number): Promise<any[]> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION
  });

  const prompt = `Please generate Batch ${batchIndex} containing exactly ${batchSize} JLPT N5 Kanjis. Make sure they are distinct foundational N5 characters. Output strictly valid JSON.`;

  console.log(`[Harvester] Requesting Batch ${batchIndex}...`);
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    // Strip possible backticks if Gemini includes them despite instructions
    const cleanJson = responseText.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error(`[Harvester] Failed to parse JSON for Batch ${batchIndex}:`, err);
    console.error("Raw Output:", responseText);
    return [];
  }
}

async function harvest() {
  console.log("[Harvester] Starting N5 Data Harvest...");
  const totalKanji = 80;
  const batchSize = 10;
  const batches = Math.ceil(totalKanji / batchSize);

  let successCount = 0;

  for (let i = 1; i <= batches; i++) {
    const kanjiList = await fetchKanjiBatch(i, batchSize);

    if (!kanjiList || kanjiList.length === 0) {
      console.log(`[Harvester] Batch ${i} yielded no data. Skipping insert.`);
      continue;
    }

    for (const k of kanjiList) {
      // Map sentences to the schema expected by the table (example_sentences)
      const payload = {
        character: k.character,
        meanings: k.meanings,
        onyomi: k.onyomi,
        kunyomi: k.kunyomi,
        jlpt_level: k.jlpt_level || 5,
        stroke_count: k.stroke_count || 1,
        example_sentences: k.sentences || []
      };

      const { error } = await supabase
        .from('kanjis')
        .upsert(payload, { onConflict: 'character' });

      if (error) {
        console.error(`[Harvester] Error inserting ${k.character}:`, error.message);
      } else {
        console.log(`[Harvester] ✅ Successfully harvested and injected Kanji: ${k.character}`);
        successCount++;
      }
    }
    
    // Slight pause to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`[Harvester] Complete. Injected ${successCount} Kanjis into the Dojo.`);
}

harvest().catch(console.error);
