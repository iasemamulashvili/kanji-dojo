import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyTelegramToken, signTelegramToken } from '@/lib/auth/jwt';
import { Telegraf, Markup } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// ─────────────────────────────────────────────────────────────────────────────
// Compute today's 08:00 Tbilisi time deadline (UTC+4).
// If it is already past 08:00 today, the deadline is 08:00 tomorrow.
// ─────────────────────────────────────────────────────────────────────────────
function getNextDeadline(): Date {
  const TBILISI_OFFSET_MS = 4 * 60 * 60 * 1000;
  const nowUtc = Date.now();
  const nowTbilisi = new Date(nowUtc + TBILISI_OFFSET_MS);

  // Build today's 08:00 in Tbilisi as a UTC timestamp
  const deadline = new Date(Date.UTC(
    nowTbilisi.getUTCFullYear(),
    nowTbilisi.getUTCMonth(),
    nowTbilisi.getUTCDate(),
    8 - 4, // 08:00 Tbilisi = 04:00 UTC
    0, 0, 0
  ));

  // If 08:00 has already passed today, push to tomorrow
  if (deadline.getTime() <= nowUtc) {
    deadline.setUTCDate(deadline.getUTCDate() + 1);
  }

  return deadline;
}

export async function GET(req: NextRequest) {
  // 1. Auth
  const activeToken = req.cookies.get('dojo_session')?.value;
  if (!activeToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let initiatorId: string;
  let initiatorUsername: string;
  try {
    const payload = await verifyTelegramToken(activeToken);
    if (!payload?.telegramId) throw new Error('Invalid session');
    initiatorId = payload.telegramId;
    initiatorUsername = payload.username || `Player_${initiatorId.slice(-4)}`;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  const groupId = process.env.TELEGRAM_GROUP_ID;
  const baseUrl = process.env.APP_URL ?? req.nextUrl.origin;
  const qStr = req.nextUrl.searchParams.get('q');

  // 2. Look up the current group kanji
  const { data: settings } = await supabase
    .from('group_settings')
    .select('current_kanji_id')
    .eq('group_id', Number(groupId))
    .maybeSingle();

  let kanjiId = settings?.current_kanji_id;

  if (!kanjiId) {
    const { data: fallback } = await supabase
      .from('kanjis')
      .select('id')
      .order('jlpt_level', { ascending: false })
      .order('stroke_count', { ascending: true })
      .limit(1)
      .single();
    kanjiId = fallback?.id;
  }

  if (!kanjiId) {
    return new NextResponse('No kanji found', { status: 404 });
  }

  // 3. Check if there is already an open (non-notified, non-expired) session for this group today.
  //    If yes, redirect the user into that existing session (they're joining, not starting).
  const { data: existingSession } = await supabase
    .from('quiz_sessions')
    .select('id')
    .eq('group_id', Number(groupId))
    .eq('notified', false)
    .gt('expires_at', new Date().toISOString())
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSession) {
    const redirectParams = qStr ? `?q=${qStr}` : '';
    return NextResponse.redirect(new URL(`/quiz/${existingSession.id}${redirectParams}`, baseUrl));
  }

  // 4. No open session — create a new one with the 08:00 deadline
  const deadline = getNextDeadline();

  // Safety: Validate groupId to prevent NaN inserts
  const numericGroupId = Number(groupId);
  if (isNaN(numericGroupId)) {
    console.error('Invalid TELEGRAM_GROUP_ID:', groupId);
    return new NextResponse('Server configuration error: Invalid Group ID', { status: 500 });
  }

  const insertData = {
    group_id: numericGroupId,
    kanji_id: kanjiId,
    expires_at: deadline.toISOString(),
    notified: false,
    is_active: true,
  };

  let { data: session, error } = await supabase
    .from('quiz_sessions')
    .insert(insertData)
    .select('id')
    .single();

  // Fallback: If is_active column is missing (42703), retry without it
  if (error && (error.code === '42703' || error.message.includes('is_active'))) {
    console.warn('is_active column missing, retrying without it');
    const { is_active, ...fallbackData } = insertData;
    const retry = await supabase
      .from('quiz_sessions')
      .insert(fallbackData)
      .select('id')
      .single();
    session = retry.data;
    error = retry.error;
  }

  if (error || !session) {
    console.error('Failed to create session. Supabase error:', error);
    return new NextResponse(`Failed to create session: ${error?.message || 'Unknown error'}`, { status: 500 });
  }

  // 5. Broadcast to the Telegram group so others can join
  if (groupId) {
    try {
      const deadlineStr = deadline.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tbilisi',
      });

      // Generate a join link for each participant (they'll get their own token on click)
      // We post a generic /quiz command link — users tap it and the bot sends them their own magic link
      const announcement = `🏮 *A new Dojo session has opened!*
━━━━━━━━━━━━━━━━━━
*Initiated by:* ${initiatorUsername}
*Deadline:* Today at ${deadlineStr} (Tbilisi)

Type /quiz to enter and compete. The winner is announced when everyone finishes or at ${deadlineStr}.`;

      await bot.telegram.sendMessage(groupId, announcement, { parse_mode: 'Markdown' });
    } catch (broadcastErr) {
      // Non-fatal — the quiz still works even if the broadcast fails
      console.error('Group broadcast failed:', broadcastErr);
    }
  }

  // 6. Redirect the initiator into the quiz
  const redirectParams = qStr ? `?q=${qStr}` : '';
  return NextResponse.redirect(new URL(`/quiz/${session.id}${redirectParams}`, baseUrl));
}
