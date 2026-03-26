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
  const { sessionId, score, finished } = body;
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

  const updateData: any = { score };
  if (finished) {
    updateData.finished = true;
    updateData.finished_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('quiz_participants')
    .update(updateData)
    .eq('session_id', sessionId)
    .eq('telegram_id', telegramId)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
  }

  return NextResponse.json(data);
}
