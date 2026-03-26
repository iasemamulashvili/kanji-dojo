import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyTelegramToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  const dojoSession = req.cookies.get('dojo_session')?.value;
  const token = req.cookies.get('auth_token')?.value;

  if (!dojoSession && !token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let telegramId;
  if (dojoSession) {
    telegramId = dojoSession;
  } else if (token) {
    try {
      const payload = await verifyTelegramToken(token);
      telegramId = payload.telegramId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const { sessionId } = body;
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });


  const { data: myParticipant, error } = await supabase
    .from('quiz_participants')
    .upsert({ session_id: sessionId, telegram_id: telegramId }, { onConflict: 'session_id, telegram_id' })
    .select('*')
    .single();

  if (error) {
    console.error('Quiz join error', error);
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 });
  }

  const { data: participants } = await supabase
    .from('quiz_participants')
    .select('*')
    .eq('session_id', sessionId);

  return NextResponse.json({ myParticipant, participants: participants || [] });
}
