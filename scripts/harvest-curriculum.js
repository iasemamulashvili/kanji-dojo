const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from project root
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

// Complete standard N5 list
const N5_KANJIS = [
  "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万", "円", "日", "月", "火", "水", "木", "金",
  "土", "年", "時", "分", "半", "国", "駅", "電", "車", "名", "前", "後", "午", "今", "朝", "昼", "晩", "夜", "先", "生",
  "友", "父", "母", "子", "男", "女", "人", "外", "道", "本", "校", "店", "社", "山", "川", "花", "雨", "天", "気", "空",
  "北", "南", "東", "西", "右", "左", "上", "下", "中", "大", "小", "多", "少", "古", "新", "長", "高", "安", "低", "近",
  "遠", "早", "明", "暗", "赤", "青", "白", "黒", "見", "聞", "書", "読", "話", "言", "語", "買", "食", "飲", "行", "来",
  "出", "入", "立", "休", "会", "足", "手", "目", "耳", "口", "力", "田", "週", "毎"
];

// Complete standard N4 list (181 characters)
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

const SYSTEM_INSTRUCTION = `
You are an expert Japanese linguist API. Your task is to output pure JSON data for a specific Japanese Kanji character.
Do NOT output any markdown blocks, backticks, or explanation. ONLY raw JSON.

Return a strictly valid JSON object following this exact schema:
{
  "character": "string (the kanji character)",
  "meanings": ["string array"],
  "onyomi": ["string array in hiragana/katakana"],
  "kunyomi": ["string array in hiragana/katakana"],
  "stroke_count": number,
  "grammar_explanation": "string — a concise plain-English explanation of how this kanji (or its common vocabulary words) functions grammatically in sentences. Mention the part of speech, usage patterns, and any relevant notes (e.g., 'Commonly functions as a noun or adverb. Appears in time expressions like 毎日 (every day).').",
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

async function enrichKanji(character, level) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION
  });

  const prompt = `Please generate full curriculum details for the JLPT N${level} Kanji character: "${character}". Ensure example sentences are natural and the tokens array perfectly matches the words in the sentence. Output strictly valid JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Strip backticks if Gemini includes them
    const cleanJson = responseText.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error(`[Harvester] Failed to parse JSON for Kanji "${character}":`, err.message);
    return null;
  }
}

async function startHarvesting() {
  console.log("[Harvester] Querying existing database curriculum...");
  const { data: existingKanjis, error: dbError } = await supabase
    .from("kanjis")
    .select("character");

  if (dbError) {
    console.error("Error fetching existing database kanjis:", dbError.message);
    process.exit(1);
  }

  const existingSet = new Set((existingKanjis || []).map(k => k.character));
  console.log(`[Harvester] Database currently contains ${existingSet.size} Kanjis.`);

  // Filter missing N5 Kanjis
  const missingN5 = N5_KANJIS.filter(k => !existingSet.has(k));
  console.log(`[Harvester] Identified ${missingN5.length} missing N5 Kanjis to harvest.`);

  // Filter missing N4 Kanjis
  const missingN4 = N4_KANJIS.filter(k => !existingSet.has(k));
  console.log(`[Harvester] Identified ${missingN4.length} missing N4 Kanjis to harvest.`);

  const missingList = [
    ...missingN5.map(k => ({ character: k, level: 5 })),
    ...missingN4.map(k => ({ character: k, level: 4 }))
  ];

  if (missingList.length === 0) {
    console.log("[Harvester] Curriculum is already 100% seeded! Nothing to harvest.");
    return;
  }

  console.log(`[Harvester] Total Kanjis to harvest: ${missingList.length}. Starting execution...`);

  // To prevent timeouts or context limit crashes, we harvest them sequentially with a slight delay
  let successCount = 0;

  for (let i = 0; i < missingList.length; i++) {
    const item = missingList[i];
    console.log(`[Harvester] [${i + 1}/${missingList.length}] Processing Kanji: "${item.character}" (Level N${item.level})...`);

    const enriched = await enrichKanji(item.character, item.level);

    if (!enriched) {
      console.error(`[Harvester] ❌ Failed to enrich Kanji: "${item.character}". Skipping.`);
      continue;
    }

    // Determine the next order index dynamically or sequentially based on loop count
    // Order offset: N5 typically spans order 1-150, N4 spans 151+
    const orderIndex = item.level === 5 ? (i + 100) : (i + 300);

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
      console.error(`[Harvester] ❌ Database error inserting "${item.character}":`, insertError.message);
    } else {
      console.log(`[Harvester] ✅ Successfully seeded Kanji: "${item.character}" (Order: ${orderIndex})`);
      successCount++;
    }

    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n[Harvester] Execution completed successfully. Seeded ${successCount}/${missingList.length} Kanjis.`);
}

startHarvesting().catch(console.error);
