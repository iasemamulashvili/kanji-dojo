import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyTelegramToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  const activeToken = req.cookies.get('dojo_session')?.value;
  if (!activeToken)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let telegramId;
  let username;
  try {
    const payload = await verifyTelegramToken(activeToken);
    telegramId = payload.telegramId;
    username = payload.username;
    if (!telegramId) throw new Error('Missing telegramId');
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { sessionId } = body;
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

  const upsertData: any = { session_id: sessionId, telegram_id: telegramId };
  if (username) upsertData.username = username;

  let { data: myParticipant, error } = await supabase
    .from('quiz_participants')
    .upsert(upsertData, { onConflict: 'session_id, telegram_id' })
    .select('*')
    .single();

  if (error) {
    if (error.code === '42703' || error.message.includes('username')) {
      console.warn("Retrying quiz_participants join without username column");
      delete upsertData.username;
      const retry = await supabase.from('quiz_participants')
        .upsert(upsertData, { onConflict: 'session_id, telegram_id' })
        .select('*').single();
      myParticipant = retry.data;
      error = retry.error;
    }
  }

  if (error) {
    console.error('Quiz join error', error);
    return NextResponse.json({ error: 'Failed to join', details: error }, { status: 500 });
  }

  const { data: participants } = await supabase
    .from('quiz_participants')
    .select('*')
    .eq('session_id', sessionId);

  return NextResponse.json({ myParticipant, participants: participants || [] });
}
