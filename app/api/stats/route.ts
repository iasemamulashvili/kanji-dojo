import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyTelegramToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  const activeToken = req.cookies.get('dojo_session')?.value;
  if (!activeToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let telegramId: string;
  try {
    const payload = await verifyTelegramToken(activeToken);
    telegramId = payload.telegramId;
    if (!telegramId) throw new Error('Missing telegramId');
  } catch (error) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  // Fetch from the leaderboard table (which is synced by DB triggers)
  const { data: stats, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('telegram_id', telegramId)
    .maybeSingle();

  if (error) {
    console.error('[GET /api/stats] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  if (!stats) {
    // If no stats yet, return default empty stats
    return NextResponse.json({
      streak_days: 0,
      accuracy_pct: 0,
      total_correct: 0,
      total_questions: 0,
      best_score: 0,
      total_quizzes: 0,
      username: 'Sensei-in-training'
    });
  }

  return NextResponse.json(stats);
}
