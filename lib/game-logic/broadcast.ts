import { createClient } from '@supabase/supabase-js';
import { Telegraf } from 'telegraf';

export type BroadcastResult = {
  skipped: boolean;
  reason?: string;
  kanji?: any;
};

/**
 * Reusable function to broadcast the next sequential Kanji to the Telegram group.
 * Can be triggered by the 08:00 cron job or by a community /next vote.
 * 
 * @param trigger 'cron' for scheduled broadcasts, 'vote' for manual skips
 */
export async function broadcastNextKanji(trigger: 'cron' | 'vote'): Promise<BroadcastResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const groupId = process.env.TELEGRAM_GROUP_ID;

  if (!supabaseUrl || !supabaseServiceKey || !botToken || !groupId) {
    throw new Error('Missing environment variables for broadcastNextKanji');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const bot = new Telegraf(botToken);

  // 1. Fetch group settings to determine the currently active Kanji
  const { data: settings, error: settingsError } = await supabase
    .from('group_settings')
    .select('id, current_kanji_id, updated_at')
    .eq('group_id', groupId)
    .single();

  if (settingsError && settingsError.code !== 'PGRST116') {
    throw new Error(`Error fetching group settings: ${settingsError.message}`);
  }

  // 2. Strict UTC+4 (Tbilisi) idempotency constraint
  // To avoid skipping two Kanjis in a single day (e.g. if someone votes at 07:00, 
  // the 08:00 cron shouldn't progress the order again on the same day).
  if (trigger === 'cron' && settings?.updated_at) {
    const tbilisiDateFormatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Asia/Tbilisi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Output formatted string like "YYYY-MM-DD" natively tied to UTC+4
    const todayTbilisi = tbilisiDateFormatter.format(new Date());
    const lastUpdateTbilisi = tbilisiDateFormatter.format(new Date(settings.updated_at));

    if (todayTbilisi === lastUpdateTbilisi) {
      console.log(`[broadcastNextKanji] Already broadcasted today (${todayTbilisi} UTC+4). Skipping.`);
      return { skipped: true, reason: 'already_broadcasted_today' };
    }
  }

  let nextKanji = null;

  if (settings?.current_kanji_id) {
    // Determine the current Kanji's strictly ordered integer
    const { data: currentKanji } = await supabase
      .from('kanjis')
      .select('jlpt_order')
      .eq('id', settings.current_kanji_id)
      .single();

    const currentOrder = currentKanji?.jlpt_order || 0;

    // Fast-forward to the precisely next Kanji in the list based on jlpt_order
    const { data: nextKanjiData } = await supabase
      .from('kanjis')
      .select('*')
      .gt('jlpt_order', currentOrder)
      .order('jlpt_order', { ascending: true })
      .limit(1)
      .single();

    nextKanji = nextKanjiData;
  }
  
  // 3. Fallback: if no valid Kanji or settings, fallback to the very first Kanji (Order 1)
  if (!nextKanji) {
    const { data: fallbackKanji, error: fallbackError } = await supabase
      .from('kanjis')
      .select('*')
      .order('jlpt_order', { ascending: true })
      .limit(1)
      .single();

    if (fallbackError || !fallbackKanji) {
      throw new Error('No Kanji found in the database to broadcast.');
    }
    nextKanji = fallbackKanji;
  }

  // 4. Update the current_kanji_id state tracking to the NEW Kanji
  if (settings) {
    await supabase
      .from('group_settings')
      .update({ 
        current_kanji_id: nextKanji.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', settings.id);
  } else {
    await supabase
      .from('group_settings')
      .insert({
        group_id: Number(groupId),
        current_kanji_id: nextKanji.id,
      });
  }

  // 5. Broadcast message compilation
  const greetings = [
    "🌅 Konnichiwa, Dojo...",
    "🏔️ The sun rises over the mountains...",
    "🌿 The morning dew has settled...",
    "🎋 A new day begins at the Dojo...",
    "🌸 The cherry blossoms whisper..."
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const meanings = Array.isArray(nextKanji.meanings) ? nextKanji.meanings.join(', ') : (nextKanji.meanings || '');
  const onyomi = Array.isArray(nextKanji.onyomi) ? nextKanji.onyomi.join(', ') : (nextKanji.onyomi || '');
  const kunyomi = Array.isArray(nextKanji.kunyomi) ? nextKanji.kunyomi.join(', ') : (nextKanji.kunyomi || '');

  // Distinguish voting skip from normal morning cron
  const prefix = trigger === 'vote' ? "<b>⏭️ Community Vote Passed! Skipping to the next Kanji...</b>\n\n" : `<b>${greeting}</b>\n\n`;

  const caption = `${prefix}Today's Kanji is: <b>${nextKanji.character}</b>\nMeaning: ${meanings}\n\n<a href="${appUrl}/practice">⛩️ Click here to begin your training.</a>`;
  const isLocal = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

  try {
    if (isLocal) {
      await bot.telegram.sendMessage(groupId, caption, { parse_mode: 'HTML' });
      console.log(`[broadcastNextKanji] Sent text-only message (local mode) for ${nextKanji.character}`);
    } else {
      const ogImageUrl = `${appUrl}/api/og/kanji?character=${encodeURIComponent(nextKanji.character)}&meanings=${encodeURIComponent(meanings)}&onyomi=${encodeURIComponent(onyomi)}&kunyomi=${encodeURIComponent(kunyomi)}`;
      await bot.telegram.sendPhoto(groupId, ogImageUrl, {
        caption: caption,
        parse_mode: 'HTML'
      });
      console.log(`[broadcastNextKanji] Sent photo card (production mode) for ${nextKanji.character}`);
    }
  } catch (err) {
    console.error(`[broadcastNextKanji] Telegram broadcast failed:`, err);
  }

  return { skipped: false, kanji: nextKanji };
}
