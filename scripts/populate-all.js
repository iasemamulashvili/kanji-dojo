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

const N5_KANJIS = [
  "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万", "円", "日", "月", "火", "水", "木", "金",
  "土", "年", "時", "分", "半", "国", "駅", "電", "車", "名", "前", "後", "午", "今", "朝", "昼", "晩", "夜", "先", "生",
  "友", "父", "母", "子", "男", "女", "人", "外", "道", "本", "校", "店", "社", "山", "川", "花", "雨", "天", "気", "空",
  "北", "南", "東", "西", "右", "左", "上", "下", "中", "大", "小", "多", "少", "古", "新", "長", "高", "安", "低", "近",
  "遠", "早", "明", "暗", "赤", "青", "白", "黒", "見", "聞", "書", "読", "話", "言", "語", "買", "食", "飲", "行", "来",
  "出", "入", "立", "休", "会", "足", "手", "目", "耳", "口", "力", "田", "週", "毎"
];

const N4_KANJIS = [
  "悪", "暗", "医", "意", "以", "引", "院", "員", "運", "英", "映", "遠", "屋", "音", "歌", "夏", "家", "画", "海", "回",
  "開", "界", "楽", "館", "漢", "寒", "顔", "帰", "起", "究", "急", "牛", "去", "強", "教", "京", "業", "局", "近", "銀",
  "区", "苦", "空", "君", "係", "計", "型", "原", "現", "言", "個", "古", "庫", "湖", "向", "幸", "港", "号", "根", "祭",
  "皿", "仕", "死", "使", "始", "指", "歯", "詩", "次", "自", "事", "持", "室", "社", "者", "写", "借", "弱", "首", "重",
  "春", "初", "所", "暑", "緒", "助", "消", "商", "章", "勝", "乗", "植", "信", "森", "真", "神", "親", "身", "進", "人",
  "吹", "正", "生", "青", "静", "席", "積", "説", "前", "全", "組", "送", "想", "息", "速", "族", "他", "多", "太", "打",
  "代", "台", "第", "題", "注", "町", "長", "鳥", "通", "弟", "定", "庭", "鉄", "点", "転", "都", "度", "答", "冬", "動",
  "同", "働", "特", "内", "南", "肉", "敗", "発", "半", "番", "品", "不", "部", "服", "福", "物", "平", "別", "便", "勉",
  "方", "法", "妹", "味", "未", "民", "無", "明", "鳴", "面", "問", "野", "薬", "由", "油", "有", "遊", "予", "用", "洋",
  "葉", "陽", "様", "落", "利", "理", "立", "力", "林", "冷", "例", "練", "路", "和", "話"
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Resilient API Call Wrapper with Exponential Backoff for 429 Errors
 */
async function callGeminiWithRetry(prompt, systemInstruction, maxRetries = 5) {
  let delay = 40000; // Start with 40s sleep for 429 or transient error recovery
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-flash-lite-latest",
        systemInstruction
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const errMsg = err.message || "";
      const isTransient =
        errMsg.includes("429") ||
        errMsg.includes("quota") ||
        errMsg.includes("Too Many Requests") ||
        errMsg.includes("503") ||
        errMsg.includes("500") ||
        errMsg.includes("Service Unavailable") ||
        errMsg.includes("high demand") ||
        errMsg.includes("fetch failed");

      if (isTransient && attempt < maxRetries) {
        console.log(`[Gemini Error] Transient error on attempt ${attempt}: ${errMsg.substring(0, 120)}. Waiting ${delay / 1000}s before retry...`);
        await sleep(delay);
        delay *= 1.5; // Exponential scale back
      } else {
        throw err;
      }
    }
  }
}

/**
 * Stage 1: Enrich original seeded N5 Kanjis with grammar_explanation
 */
async function enrichLegacyKanjis() {
  console.log("\n--- STAGE 1: ENRICHING LEGACY KANJIS ---");
  const { data: legacyKanjis, error: dbError } = await supabase
    .from("kanjis")
    .select("id, character")
    .is("grammar_explanation", null);

  if (dbError) {
    console.error("Error checking legacy Kanjis:", dbError.message);
    return;
  }

  if (!legacyKanjis || legacyKanjis.length === 0) {
    console.log("[Enricher] All legacy Kanjis already enriched.");
    return;
  }

  console.log(`[Enricher] Found ${legacyKanjis.length} legacy Kanjis missing 'grammar_explanation'. Enriching...`);

  const enrichInstruction = `
  You are an expert Japanese linguist. Your task is to output a concise plain-English explanation of how a specific Japanese Kanji character functions grammatically in sentences.
  Output ONLY a short, direct paragraph. Do NOT use markdown bolding, lists, bullet points, or introductory phrases.
  `;

  for (let i = 0; i < legacyKanjis.length; i++) {
    const kanji = legacyKanjis[i];
    console.log(`[Enricher] [${i + 1}/${legacyKanjis.length}] Generating grammar explanation for: "${kanji.character}"...`);

    try {
      const prompt = `Provide a concise grammar explanation for the Kanji character: "${kanji.character}"`;
      const responseText = await callGeminiWithRetry(prompt, enrichInstruction);
      const explanation = responseText.trim();

      const { error: updateError } = await supabase
        .from("kanjis")
        .update({ grammar_explanation: explanation })
        .eq("id", kanji.id);

      if (updateError) {
        console.error(`[Enricher] ❌ Update failed for "${kanji.character}":`, updateError.message);
      } else {
        console.log(`[Enricher] ✅ Enriched: "${kanji.character}"`);
      }
    } catch (e) {
      console.error(`[Enricher] ❌ Failed to process "${kanji.character}":`, e.message);
    }

    // Defensive delay to respect 15 RPM limits (8 seconds)
    await sleep(8000);
  }
  console.log("[Enricher] Stage 1 enrichment complete.");
}

/**
 * Stage 2: Harvest missing N5 and N4 Kanjis
 */
async function harvestCurriculum() {
  console.log("\n--- STAGE 2: HARVESTING MISSING CURRICULUM ---");
  const { data: existingKanjis, error: dbError } = await supabase
    .from("kanjis")
    .select("character");

  if (dbError) {
    console.error("Error querying database:", dbError.message);
    return;
  }

  const existingSet = new Set((existingKanjis || []).map(k => k.character));
  
  const missingN5 = N5_KANJIS.filter(k => !existingSet.has(k));
  const missingN4 = N4_KANJIS.filter(k => !existingSet.has(k));

  const missingList = [
    ...missingN5.map(k => ({ character: k, level: 5 })),
    ...missingN4.map(k => ({ character: k, level: 4 }))
  ];

  if (missingList.length === 0) {
    console.log("[Harvester] Curriculum is already 100% complete!");
    return;
  }

  console.log(`[Harvester] Found ${missingList.length} Kanjis missing from database. Seeding now...`);

  const harvestInstruction = `
  You are an expert Japanese linguist API. Your task is to output pure JSON data for a specific Japanese Kanji character.
  Do NOT output any markdown blocks, backticks, or explanation. ONLY raw JSON.

  Return a strictly valid JSON object following this exact schema:
  {
    "character": "string (the kanji character)",
    "meanings": ["string array"],
    "onyomi": ["string array in hiragana/katakana"],
    "kunyomi": ["string array in hiragana/katakana"],
    "stroke_count": number,
    "grammar_explanation": "string — a concise plain-English explanation of how this kanji (or its common vocabulary words) functions grammatically in sentences.",
    "example_sentences": [
      {
        "japanese": "string (full Japanese sentence)",
        "english": "string (full English translation)",
        "tokens": [
          {
            "text": "string (Japanese word spelling)",
            "word": "string (Japanese word spelling - duplicate of text for compatibility)",
            "furigana": "string (furigana/reading in hiragana, use empty string for punctuation)",
            "reading": "string (furigana/reading - duplicate of furigana for compatibility)",
            "english": "string (direct English translation of this specific word, use null for structural particles that don't translate cleanly)",
            "meaning": "string (direct English translation - duplicate of english for compatibility)"
          }
        ]
      }
    ] // MUST be exactly 3 sentence objects.
  }
  `;

  for (let i = 0; i < missingList.length; i++) {
    const item = missingList[i];
    console.log(`[Harvester] [${i + 1}/${missingList.length}] Seeding "${item.character}" (Level N${item.level})...`);

    try {
      const prompt = `Please generate full curriculum details for the JLPT N${item.level} Kanji character: "${item.character}".`;
      const responseText = await callGeminiWithRetry(prompt, harvestInstruction);
      
      const cleanJson = responseText.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();
      const enriched = JSON.parse(cleanJson);

      // Assign temporary high offset to avoid unique constraint violations during seeding
      const orderIndex = item.level === 5 ? (i + 10000) : (i + 20000);

      const payload = {
        character: enriched.character,
        meanings: enriched.meanings,
        onyomi: enriched.onyomi,
        kunyomi: enriched.kunyomi,
        jlpt_level: item.level,
        stroke_count: enriched.stroke_count || 1,
        grammar_explanation: enriched.grammar_explanation || null,
        example_sentences: enriched.example_sentences || [],
        jlpt_order: orderIndex
      };

      const { error: insertError } = await supabase
        .from("kanjis")
        .upsert(payload, { onConflict: "character" });

      if (insertError) {
        console.error(`[Harvester] ❌ Database insert error for "${item.character}":`, insertError.message);
      } else {
        console.log(`[Harvester] ✅ Seeded "${item.character}" successfully (Temp Order: ${orderIndex})`);
      }
    } catch (e) {
      console.error(`[Harvester] ❌ Failed to process "${item.character}":`, e.message);
    }

    // Defensive delay to respect 15 RPM limits (8 seconds)
    await sleep(8000);
  }
  console.log("[Harvester] Stage 2 curriculum harvesting complete.");
}

/**
 * Stage 3: Resequence all Kanjis sequentially from 1..N based on jlpt_level DESC, stroke_count ASC, character ASC
 */
async function resequenceJlptOrder() {
  console.log("\n--- STAGE 3: RESEQUENCING JLPT ORDER ---");
  const { data: kanjis, error: fetchError } = await supabase
    .from("kanjis")
    .select("id, character, jlpt_level, stroke_count");

  if (fetchError) {
    console.error("Error fetching kanjis for resequencing:", fetchError.message);
    return;
  }

  console.log(`[Resequencer] Sorting and resequencing ${kanjis.length} Kanjis...`);

  // Sort logically: N5 (5) first, then N4 (4); then by stroke_count ASC; then by character ASC
  kanjis.sort((a, b) => {
    if (a.jlpt_level !== b.jlpt_level) {
      return b.jlpt_level - a.jlpt_level; // 5 before 4
    }
    if (a.stroke_count !== b.stroke_count) {
      return a.stroke_count - b.stroke_count; // smaller stroke_count first
    }
    return a.character.localeCompare(b.character);
  });

  // Temporarily shift all orders to a high offset to avoid unique conflicts during update
  console.log("[Resequencer] Step 1: Shifting all orders to a temporary high offset...");
  for (let i = 0; i < kanjis.length; i++) {
    const { error: shiftError } = await supabase
      .from("kanjis")
      .update({ jlpt_order: 100000 + i })
      .eq("id", kanjis[i].id);

    if (shiftError) {
      console.error(`[Resequencer] ❌ Failed to shift order for "${kanjis[i].character}":`, shiftError.message);
      return;
    }
  }

  console.log("[Resequencer] Step 2: Applying final sequential orders (1..N)...");
  for (let i = 0; i < kanjis.length; i++) {
    const newOrder = i + 1;
    const { error: updateError } = await supabase
      .from("kanjis")
      .update({ jlpt_order: newOrder })
      .eq("id", kanjis[i].id);

    if (updateError) {
      console.error(`[Resequencer] ❌ Failed to update order for "${kanjis[i].character}" to ${newOrder}:`, updateError.message);
    }
  }

  console.log("[Resequencer] Stage 3 resequencing complete.");
}

(async () => {
  console.log("[Orchestrator] Starting Sequential, Rate-Limiting Curriculum Pipeline...");
  
  // 1. Enrich original 73 Kanjis first
  await enrichLegacyKanjis();
  
  // 2. Harvest all missing N5/N4 Kanjis next
  await harvestCurriculum();

  // 3. Resequence all Kanjis sequentially 1..N
  await resequenceJlptOrder();
  
  console.log("\n[Orchestrator] Core Pipeline Completed Successfully.");
})();
