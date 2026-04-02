import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Query the actual leaderboard table instead of calculating on the fly
  const { data: leaderboard, error } = await supabase
    .from('leaderboard')
    .select('telegram_id, username, total_score, streak_days, accuracy_pct, completed_sessions:total_quizzes')
    .order('total_score', { ascending: false })
    .limit(50);
    
  if (error || !leaderboard) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }

  return NextResponse.json({ leaderboard }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
