const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required credentials in .env.local.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_INSTRUCTION = `
You are an expert Japanese linguist. Your task is to output a concise plain-English explanation of how a specific Japanese Kanji character (or its common words) functions grammatically in sentences.
Output ONLY a short, direct paragraph. Do NOT use markdown bolding, lists, bullet points, or introductory phrases.

Example:
For '毎': Commonly functions as a prefix for time nouns to indicate repetition. Appears in everyday adverbial phrases like 毎日 (every day) and 毎週 (every week) to indicate occurrences without requiring a particle.
`;

async function getGrammarExplanation(character) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION
  });

  const prompt = `Provide a concise grammar explanation for the Kanji character: "${character}"`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error(`[Enricher] Error calling Gemini for "${character}":`, err.message);
    return null;
  }
}

async function enrichCurriculum() {
  console.log("[Enricher] Querying Kanjis missing grammar_explanation...");
  
  const { data: legacyKanjis, error: dbError } = await supabase
    .from("kanjis")
    .select("id, character")
    .is("grammar_explanation", null);

  if (dbError) {
    console.error("Database error:", dbError.message);
    process.exit(1);
  }

  if (!legacyKanjis || legacyKanjis.length === 0) {
    console.log("[Enricher] All existing Kanjis already have a grammar_explanation! Nothing to enrich.");
    return;
  }

  console.log(`[Enricher] Identified ${legacyKanjis.length} Kanjis to enrich. Starting processing...`);

  let successCount = 0;

  for (let i = 0; i < legacyKanjis.length; i++) {
    const kanji = legacyKanjis[i];
    console.log(`[Enricher] [${i + 1}/${legacyKanjis.length}] Generating grammar explanation for: "${kanji.character}"...`);

    const explanation = await getGrammarExplanation(kanji.character);

    if (!explanation) {
      console.error(`[Enricher] ❌ Skipped "${kanji.character}" due to error.`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("kanjis")
      .update({ grammar_explanation: explanation })
      .eq("id", kanji.id);

    if (updateError) {
      console.error(`[Enricher] ❌ Failed to update "${kanji.character}":`, updateError.message);
    } else {
      console.log(`[Enricher] ✅ Successfully enriched: "${kanji.character}"`);
      successCount++;
    }

    // Delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n[Enricher] Completed. Enriched ${successCount}/${legacyKanjis.length} legacy Kanjis.`);
}

enrichCurriculum().catch(console.error);
