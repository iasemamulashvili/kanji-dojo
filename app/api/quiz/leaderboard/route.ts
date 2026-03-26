import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Aggregate from quiz_participants as user_stats might not be fully up to date
  const { data: participants, error } = await supabase
    .from('quiz_participants')
    .select('telegram_id, score, finished');
    
  if (error || !participants) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }

  const aggregated = participants.reduce((acc: any, curr: any) => {
    if (!curr.telegram_id) return acc;
    const tid = curr.telegram_id.toString();
    if (!acc[tid]) {
      acc[tid] = { telegram_id: tid, total_score: 0, sessions_played: 0, completed_sessions: 0 };
    }
    acc[tid].total_score += curr.score || 0;
    acc[tid].sessions_played += 1;
    if (curr.finished) {
       acc[tid].completed_sessions += 1; 
    }
    return acc;
  }, {});
  
  const leaderboard = Object.values(aggregated)
    .sort((a: any, b: any) => b.total_score - a.total_score)
    .slice(0, 50);
    
  return NextResponse.json({ leaderboard }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
