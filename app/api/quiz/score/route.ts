import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyTelegramToken } from '@/lib/auth/jwt';
import { checkAndAnnounceWinner } from '@/lib/game-logic/winner';

export async function POST(req: NextRequest) {
  const activeToken = req.cookies.get('dojo_session')?.value;
  if (!activeToken)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let telegramId: string;
  try {
    const payload = await verifyTelegramToken(activeToken);
    telegramId = payload.telegramId;
    if (!telegramId) throw new Error('Missing telegramId');
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { sessionId, score, finished, totalCorrect, totalQuestions, typeStats } = body;

  if (!sessionId)
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

  // --- 1. Update quiz_participants row ---
  const updateData: Record<string, unknown> = { 
    score,
    type_stats: typeStats || {}
  };
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
      kanji_id: data?.kanji_id || null, 
      type_stats: typeStats || {}
    });

    if (insertError) {
      console.error('[POST /api/quiz/score] quiz_scores insert failed:', insertError);
    }

    // --- 3. Check for Winner Announcement ---
    // In a production environment, we'd check if所有人 finished.
    // For competitive flare, we'll announce the first person to finish with 100% 
    // or the final winner if this was the last person.
    
    // We'll pass this to a background utility that handles the Telegram logic.
    // This prevents blocking the response for the user.
    try {
      // Trigger a winner check broadcast if this was the finish
      await checkAndAnnounceWinner(sessionId);
    } catch (e) {
      console.error("Winner broadcast failed:", e);
    }
  }

  return NextResponse.json({
    ...data,
    correct_answers: typeof totalCorrect === 'number' ? totalCorrect : (typeof score === 'number' ? score : 0),
    total_questions: typeof totalQuestions === 'number' ? totalQuestions : 0,
    stats_updated: finished ?? false
  });
}

