import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyTelegramToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  const dojoSession = req.cookies.get('dojo_session')?.value;
  const token = req.cookies.get('auth_token')?.value;

  if (!dojoSession && !token)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let telegramId: string | undefined;
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
  const { sessionId, score, finished, totalQuestions } = body;

  if (!sessionId)
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

  // --- 1. Update quiz_participants row ---
  const updateData: Record<string, unknown> = { score };
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
    console.error('[POST /api/quiz/score] quiz_participants update failed:', error);
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
  }

  // --- 2. Upsert global user_stats for leaderboard (only when quiz is finished) ---
  if (finished && telegramId) {
    // Fetch current stats to compute running totals
    const { data: existing } = await supabase
      .from('user_stats')
      .select('total_quizzes, total_score, best_score')
      .eq('telegram_id', telegramId)
      .single();

    const prevTotalQuizzes = existing?.total_quizzes ?? 0;
    const prevTotalScore = existing?.total_score ?? 0;
    const prevBestScore = existing?.best_score ?? 0;
    const numericScore = typeof score === 'number' ? score : 0;

    await supabase.from('user_stats').upsert(
      {
        telegram_id: telegramId,
        total_quizzes: prevTotalQuizzes + 1,
        total_score: prevTotalScore + numericScore,
        best_score: Math.max(prevBestScore, numericScore),
        last_played_at: new Date().toISOString(),
        ...(totalQuestions ? { total_questions_seen: (existing as any)?.total_questions_seen ?? 0 + totalQuestions } : {}),
      },
      { onConflict: 'telegram_id' }
    );
  }

  return NextResponse.json({ ...data, stats_updated: finished ?? false });
}

