import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface KanjiQuizData {
  id: string;
  character: string;
  meanings: string[];
  onyomi: string[];
  kunyomi: string[];
  jlpt_level: number;
  stroke_count: number;
  grammar_explanation?: string;
  jlpt_order: number;
}

/**
 * Fetches the quiz data payload for a specific group.
 * Strictly limited to Current + Historical Kanji (jlpt_order <= current).
 * 
 * @param groupId Telegram Group ID
 * @param limit Maximum number of historical Kanji to include (default 10)
 */
export async function getGroupQuizData(groupId: string, limit: number = 10): Promise<KanjiQuizData[]> {
  // 1. Get the current active Kanji order for the group
  const { data: settings, error: settingsError } = await supabase
    .from('group_settings')
    .select('current_kanji_id')
    .eq('group_id', Number(groupId))
    .maybeSingle();

  if (settingsError || !settings?.current_kanji_id) {
    // Fallback if no settings: return only the first Kanji
    const { data: firstKanji } = await supabase
      .from('kanjis')
      .select('*')
      .order('jlpt_order', { ascending: true })
      .limit(1)
      .single();
    
    return firstKanji ? [firstKanji as KanjiQuizData] : [];
  }

  // 2. Determine the jlpt_order of the current Kanji
  const { data: currentKanji } = await supabase
    .from('kanjis')
    .select('jlpt_order')
    .eq('id', settings.current_kanji_id)
    .single();

  const currentOrder = currentKanji?.jlpt_order || 0;

  // 3. Fetch current + historical Kanji
  // We fetch strictly where jlpt_order <= currentOrder
  const { data: kanjis, error: kanjisError } = await supabase
    .from('kanjis')
    .select('*')
    .lte('jlpt_order', currentOrder)
    .order('jlpt_order', { ascending: false }) // Current one first
    .limit(limit + 1); // +1 to ensure we get the current one plus history

  if (kanjisError) {
    console.error('[getGroupQuizData] Error fetching kanjis:', kanjisError);
    return [];
  }

  return kanjis as KanjiQuizData[];
}
