import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Telegraf } from 'telegraf';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const groupId = process.env.TELEGRAM_GROUP_ID;

  if (!supabaseUrl || !supabaseServiceKey || !botToken || !groupId) {
    console.error({
      botTokenExists: !!botToken,
      groupIdExists: !!groupId,
      supabaseUrlExists: !!supabaseUrl,
      supabaseKeyExists: !!supabaseServiceKey
    });
    return new NextResponse("Missing env vars", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const bot = new Telegraf(botToken);

  try {
    // 1. Check if group settings exist
    let kanjiIdToFetch = null;
    
    // 1. Fetch current kanji setting
    const { data: settings } = await supabase
      .from('group_settings')
      .select('current_kanji_id')
      .single();

    if (settings?.current_kanji_id) {
      kanjiIdToFetch = settings.current_kanji_id;
    }

    // 2. Query Kanji Based on Settings or Fallback
    let query: any = supabase.from('kanjis').select('*');
    
    if (kanjiIdToFetch) {
      query = query.eq('id', kanjiIdToFetch).single();
    } else {
      query = query.order('jlpt_level', { ascending: false }).order('stroke_count', { ascending: true }).limit(1).single();
    }

    const { data: kanji, error } = await query;

    if (error || !kanji) {
      console.error("Cron Database Error:", error);
      return new NextResponse('Database Error', { status: 500 });
    }

    const greetings = [
      "🌅 Konnichiwa, Dojo...",
      "🏔️ The sun rises over the mountains...",
      "🌿 The morning dew has settled...",
      "🎋 A new day begins at the Dojo...",
      "🌸 The cherry blossoms whisper..."
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const meanings = Array.isArray(kanji.meanings) ? kanji.meanings.join(', ') : kanji.meanings;
    const onyomi = Array.isArray(kanji.onyomi) ? kanji.onyomi.join(', ') : (kanji.onyomi || '');
    const kunyomi = Array.isArray(kanji.kunyomi) ? kanji.kunyomi.join(', ') : (kanji.kunyomi || '');

    const caption = `<b>${greeting}</b>\n\nToday's Kanji is: <b>${kanji.character}</b>\nMeaning: ${meanings}\n\n<a href="${appUrl}/practice">⛩️ Click here to begin your training.</a>`;

    const isLocal = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

    if (isLocal) {
      // Local dev: Telegram can't fetch images from localhost, send text only
      await bot.telegram.sendMessage(groupId, caption, { parse_mode: 'HTML' });
      console.log('[Morning Cron] Sent text-only message (local mode)');
    } else {
      // Production: Send beautiful OG image card
      const ogImageUrl = `${appUrl}/api/og/kanji?character=${encodeURIComponent(kanji.character)}&meanings=${encodeURIComponent(meanings)}&onyomi=${encodeURIComponent(onyomi)}&kunyomi=${encodeURIComponent(kunyomi)}`;
      await bot.telegram.sendPhoto(groupId, ogImageUrl, {
        caption: caption,
        parse_mode: 'HTML'
      });
      console.log('[Morning Cron] Sent photo card (production mode)');
    }

    return new NextResponse('Success', { status: 200 });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
