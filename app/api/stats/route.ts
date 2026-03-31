import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyTelegramToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
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

  try {
    // 1. Fetch Global Stats from Leaderboard
    const { data: global, error: globalError } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    // 2. Fetch Category Mastery
    const { data: mastery, error: masteryError } = await supabase
      .from('user_question_stats')
      .select('question_type, correct_count, total_count')
      .eq('telegram_id', telegramId);

    // 3. Fetch Recent Scores
    const { data: recent, error: recentError } = await supabase
      .from('quiz_scores')
      .select('score, total_questions, correct_answers, created_at')
      .eq('telegram_id', telegramId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (globalError || masteryError || recentError) {
      console.error('Stats fetch error:', { globalError, masteryError, recentError });
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }

    return NextResponse.json({
      global: global || {
        total_score: 0,
        total_quizzes: 0,
        total_correct: 0,
        total_questions: 0,
        best_score: 0,
        accuracy_pct: 0,
        streak_days: 0
      },
      mastery: mastery || [],
      recent: recent || []
    });

  } catch (err) {
    console.error('Unexpected error fetching stats:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
