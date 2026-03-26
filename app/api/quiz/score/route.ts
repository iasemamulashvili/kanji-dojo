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
  const { sessionId, score, finished, totalCorrect, totalQuestions } = body;

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

  // --- 2. Insert into quiz_scores for leaderboard (only when quiz is finished) ---
  if (finished && telegramId) {
    const numericScore = typeof score === 'number' ? score : 0;
    const correctCount = typeof totalCorrect === 'number' ? totalCorrect : numericScore;
    const questionsCount = typeof totalQuestions === 'number' ? totalQuestions : 0;

    const { error: insertError } = await supabase.from('quiz_scores').insert({
      telegram_id: telegramId,
      username: data?.username || null,
      quiz_session_id: sessionId || null,
      score: numericScore,
      total_questions: questionsCount,
      correct_answers: correctCount,
      kanji_id: data?.kanji_id || null, // Best effort from participants row if it exists
    });

    if (insertError) {
      console.error('[POST /api/quiz/score] quiz_scores insert failed:', insertError);
    }
  }

  return NextResponse.json({
    ...data,
    correct_answers: typeof totalCorrect === 'number' ? totalCorrect : (typeof score === 'number' ? score : 0),
    total_questions: typeof totalQuestions === 'number' ? totalQuestions : 0,
    stats_updated: finished ?? false
  });
}

